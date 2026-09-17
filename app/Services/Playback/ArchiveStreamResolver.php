<?php

declare(strict_types=1);

namespace App\Services\Playback;

use App\Contracts\StreamResolver;
use App\Services\InternetArchiveService;
use App\Support\Catalog\ArchiveTitle;
use App\Support\Playback\StreamSource;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Memutar koleksi domain publik Internet Archive.
 *
 * Archive menyajikan berkas apa adanya tanpa DRM, jadi pemutar kita bisa
 * memakainya langsung. Satu item bisa berisi puluhan berkas turunan, maka
 * resolver ini memilih turunan terbaik memakai peringkat format yang tetap.
 */
final class ArchiveStreamResolver implements StreamResolver
{
    private const CACHE_TTL = 3600;

    /**
     * Urut dari yang paling kompatibel dengan browser modern.
     *
     * @var array<int, array{format: string, mime: string}>
     */
    private const FORMAT_PREFERENCE = [
        ['format' => 'h.264 ia', 'mime' => 'video/mp4'],
        ['format' => 'h.264', 'mime' => 'video/mp4'],
        ['format' => 'mpeg4', 'mime' => 'video/mp4'],
        ['format' => '512kb mpeg4', 'mime' => 'video/mp4'],
        ['format' => 'webm', 'mime' => 'video/webm'],
        ['format' => 'ogg video', 'mime' => 'video/ogg'],
    ];

    public function __construct(private readonly InternetArchiveService $archive) {}

    public function provider(): string
    {
        return 'archive';
    }

    public function label(): string
    {
        return 'Internet Archive';
    }

    public function resolve(string $reference, array $options = []): ?StreamSource
    {
        $identifier = trim($reference);

        // Identifier Archive hanya berisi karakter aman URL. Saring lebih awal
        // supaya tidak ada yang bisa menyelipkan path atau host lain.
        if ($identifier === '' || preg_match('/^[A-Za-z0-9._-]{1,128}$/', $identifier) !== 1) {
            return null;
        }

        return Cache::remember(
            "playback:archive:{$identifier}",
            self::CACHE_TTL,
            fn (): ?StreamSource => $this->buildSource($identifier),
        );
    }

    private function buildSource(string $identifier): ?StreamSource
    {
        $metadata = $this->archive->getMetadata($identifier);
        $files = $metadata['files'] ?? [];

        if (! is_array($files) || $files === []) {
            Log::info('Archive item tanpa berkas', ['identifier' => $identifier]);

            return null;
        }

        $picked = $this->pickBestFile($files);

        if ($picked === null) {
            Log::info('Archive item tanpa turunan video yang didukung', ['identifier' => $identifier]);

            return null;
        }

        [$file, $mime] = $picked;

        $rawTitle = $metadata['metadata']['title'] ?? $identifier;
        $name = ltrim((string) $file['name'], '/');

        // Judul Archive ditulis pengunggah dan sering membawa penanda teknis
        // seperti "1080p h264 aac". Dibersihkan di sini supaya label yang sama
        // bisa dipakai untuk tampilan sekaligus untuk mencari takarir.
        $parsed = ArchiveTitle::parse(is_string($rawTitle) ? $rawTitle : $identifier);
        $label = $parsed->clean !== '' ? $parsed->clean : $identifier;

        return StreamSource::progressive(
            url: 'https://archive.org/download/'.rawurlencode($identifier).'/'.$this->encodePath($name),
            provider: $this->provider(),
            label: $label,
            mimeType: $mime,
            poster: "https://archive.org/services/img/{$identifier}",
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $files
     * @return array{0: array<string, mixed>, 1: string}|null
     */
    private function pickBestFile(array $files): ?array
    {
        foreach (self::FORMAT_PREFERENCE as $candidate) {
            foreach ($files as $file) {
                if (! is_array($file) || ! isset($file['name'], $file['format'])) {
                    continue;
                }

                if (strtolower((string) $file['format']) === $candidate['format']) {
                    return [$file, $candidate['mime']];
                }
            }
        }

        return null;
    }

    /**
     * Archive memakai nama berkas apa adanya, termasuk spasi dan subfolder.
     * Setiap segmen di-encode terpisah supaya garis miring tetap utuh.
     */
    private function encodePath(string $path): string
    {
        return implode('/', array_map(rawurlencode(...), explode('/', $path)));
    }
}
