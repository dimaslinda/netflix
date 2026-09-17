<?php

declare(strict_types=1);

namespace App\Services\Subtitle;

use App\Contracts\SubtitleTranslator;
use App\Services\OpenSubtitlesService;
use App\Services\SubDLService;
use App\Support\Subtitle\VttConverter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Menjamin setiap tontonan punya takarir dalam bahasa sasaran.
 *
 * Urutannya: cari bahasa sasaran di semua penyedia. Bila kosong, ambil bahasa
 * cadangan dan tandai untuk diterjemahkan saat diputar. Dengan begitu film
 * domain publik yang tidak pernah punya takarir Indonesia tetap bisa ditonton
 * dengan takarir Indonesia, walau kualitasnya terjemahan mesin.
 */
final class SubtitleLibrary
{
    public function __construct(
        private readonly SubDLService $subdl,
        private readonly OpenSubtitlesService $opensubtitles,
        private readonly SubtitleTranslator $translator,
    ) {}

    /**
     * @return array{
     *     tracks: array<int, array<string, mixed>>,
     *     target_language: string,
     *     translator: string,
     *     translator_available: bool
     * }
     */
    public function search(
        string $tmdbId,
        string $type,
        ?int $season = null,
        ?int $episode = null,
        ?string $title = null,
    ): array {
        return $this->withFallback(
            fn (string $language): array => $this->searchLanguage(
                $tmdbId,
                $type,
                $season,
                $episode,
                $title,
                $language,
            ),
        );
    }

    /**
     * Cari takarir hanya berbekal judul dan tahun.
     *
     * Dipakai film katalog terbuka, yang diputar tanpa id TMDB sama sekali.
     * Tanpa jalur ini, judul yang paling siap ditonton justru satu-satunya yang
     * tidak pernah bisa dapat takarir.
     *
     * @return array{
     *     tracks: array<int, array<string, mixed>>,
     *     target_language: string,
     *     translator: string,
     *     translator_available: bool
     * }
     */
    public function searchByTitle(string $title, ?int $year = null): array
    {
        return $this->withFallback(
            fn (string $language): array => $this->queryLanguage($title, $year, $language),
        );
    }

    /**
     * Terapkan aturan yang sama untuk setiap cara pencarian: bahasa sasaran
     * dulu, dan hanya bila nihil baru bahasa cadangan yang ditandai untuk
     * diterjemahkan. Takarir asli selalu lebih baik daripada terjemahan mesin.
     *
     * @param  callable(string): array<int, array<string, mixed>>  $finder
     * @return array{
     *     tracks: array<int, array<string, mixed>>,
     *     target_language: string,
     *     translator: string,
     *     translator_available: bool
     * }
     */
    private function withFallback(callable $finder): array
    {
        $target = $this->targetLanguage();
        $tracks = $finder($target);

        if ($tracks === []) {
            foreach ($this->fallbackLanguages() as $fallback) {
                $found = $finder($fallback);

                if ($found !== []) {
                    $tracks = array_map(
                        fn (array $track): array => [...$track, 'needs_translation' => true],
                        $found,
                    );

                    break;
                }
            }
        }

        return [
            'tracks' => $tracks,
            'target_language' => $target,
            'translator' => $this->translator->name(),
            'translator_available' => $this->translator->isAvailable(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function queryLanguage(string $title, ?int $year, string $language): array
    {
        $tracks = [];

        foreach ($this->subdl->searchByQuery($title, $language, $year) as $item) {
            $tracks[] = $this->normalize($item, 'subdl', $language);
        }

        foreach ($this->opensubtitles->searchByQuery($title, $language, $year) as $item) {
            $tracks[] = $this->normalize($item, 'opensubtitles', $language);
        }

        return array_values(array_filter(
            $tracks,
            static fn (array $track): bool => $track['download_url'] !== '',
        ));
    }

    /**
     * Ambil isi takarir sebagai VTT, diterjemahkan bila diminta.
     */
    public function content(string $reference, ?string $sourceLanguage = null, bool $translate = false): ?string
    {
        $raw = $this->download($reference);

        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $vtt = VttConverter::normalize($raw);
        $target = $this->targetLanguage();
        $from = $sourceLanguage ?? 'en';

        if (! $translate || $from === $target || ! $this->translator->isAvailable()) {
            return $vtt;
        }

        return Cache::remember(
            'subtitle:translated:'.$target.':'.md5($reference.'|'.$from.'|'.$vtt),
            (int) config('subtitles.cache_ttl', 2592000),
            fn (): string => $this->translateVtt($vtt, $from, $target),
        );
    }

    private function translateVtt(string $vtt, string $from, string $to): string
    {
        $texts = VttConverter::cueTexts($vtt);

        if ($texts === []) {
            return $vtt;
        }

        try {
            $translated = $this->translator->translate($texts, $from, $to);
        } catch (Throwable $exception) {
            Log::warning('Terjemahan takarir gagal, memakai teks asli', [
                'error' => $exception->getMessage(),
            ]);

            return $vtt;
        }

        return VttConverter::replaceCueTexts($vtt, $translated);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchLanguage(
        string $tmdbId,
        string $type,
        ?int $season,
        ?int $episode,
        ?string $title,
        string $language,
    ): array {
        $tracks = [];

        foreach ($this->subdl->searchByTmdbId($tmdbId, $type, $season, $episode, $language, $title) as $item) {
            $tracks[] = $this->normalize($item, 'subdl', $language);
        }

        foreach ($this->opensubtitles->searchByTmdbId($tmdbId, $type, $season, $episode, $language) as $item) {
            $tracks[] = $this->normalize($item, 'opensubtitles', $language);
        }

        return array_values(array_filter(
            $tracks,
            static fn (array $track): bool => $track['download_url'] !== '',
        ));
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function normalize(array $item, string $provider, string $language): array
    {
        $downloadUrl = $provider === 'opensubtitles'
            ? (isset($item['file_id']) ? 'os://'.$item['file_id'] : '')
            : (string) ($item['download_url'] ?? $item['url'] ?? '');

        return [
            'id' => $item['id'] ?? $item['file_id'] ?? $downloadUrl,
            'provider' => $provider,
            'language' => $language,
            'language_name' => $item['language_name'] ?? $item['language'] ?? strtoupper($language),
            'release' => $item['release'] ?? $item['release_name'] ?? null,
            'download_url' => $downloadUrl,
            'needs_translation' => false,
        ];
    }

    private function download(string $reference): ?string
    {
        if (str_starts_with($reference, 'os://')) {
            return $this->downloadFromOpenSubtitles((int) substr($reference, 5));
        }

        return $this->subdl->downloadAndConvert($reference);
    }

    private function downloadFromOpenSubtitles(int $fileId): ?string
    {
        $link = $this->opensubtitles->getDownloadLink($fileId);

        if (! is_array($link) || ! isset($link['link']) || ! is_string($link['link'])) {
            Log::warning('OpenSubtitles tidak memberi tautan unduhan', ['file_id' => $fileId]);

            return null;
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders(['User-Agent' => config('app.name').'/1.0'])
                ->get($link['link']);

            return $response->successful() ? $response->body() : null;
        } catch (Throwable $exception) {
            Log::warning('Unduhan takarir OpenSubtitles gagal', [
                'file_id' => $fileId,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function targetLanguage(): string
    {
        return (string) config('subtitles.target_language', 'id');
    }

    /** @return array<int, string> */
    private function fallbackLanguages(): array
    {
        /** @var array<int, string> $languages */
        $languages = config('subtitles.fallback_languages', ['en']);

        return $languages;
    }
}
