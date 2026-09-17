<?php

declare(strict_types=1);

namespace App\Services\Playback;

use App\Contracts\StreamResolver;
use App\Support\Playback\StreamSource;
use Illuminate\Support\Facades\Cache;

/**
 * Katalog film berlisensi terbuka.
 *
 * Berkasnya sama-sama diinangi Internet Archive, jadi resolusi berkas didelegasi
 * ke ArchiveStreamResolver. Yang ditambahkan di sini hanya kurasi: judul, tahun,
 * dan lisensi yang sudah diperiksa, supaya pengguna tahu apa yang boleh dilihat.
 */
final class OpenMovieResolver implements StreamResolver
{
    private const CACHE_TTL = 3600;

    public function __construct(private readonly ArchiveStreamResolver $archive) {}

    public function provider(): string
    {
        return 'open';
    }

    public function label(): string
    {
        return 'Film Terbuka';
    }

    public function resolve(string $reference, array $options = []): ?StreamSource
    {
        $entry = $this->findEntry($reference);

        if ($entry === null) {
            return null;
        }

        $source = $this->archive->resolve($entry['identifier']);

        if ($source === null) {
            return null;
        }

        // Judul hasil kurasi lebih rapi daripada judul mentah di Archive, yang
        // kadang berisi keterangan teknis seperti resolusi dan codec.
        return new StreamSource(
            kind: $source->kind,
            url: $source->url,
            provider: $this->provider(),
            label: $entry['title'],
            mimeType: $source->mimeType,
            poster: $source->poster,
        );
    }

    /**
     * Katalog yang benar-benar bisa diputar.
     *
     * Entri yang identifier-nya hilang atau tidak punya turunan video yang
     * didukung disaring di sini, bukan dibiarkan gagal saat pengguna mengklik.
     *
     * @return array<int, array<string, mixed>>
     */
    public function catalog(): array
    {
        return Cache::remember('playback:open-movies', self::CACHE_TTL, function (): array {
            $catalog = [];

            foreach ($this->entries() as $entry) {
                $source = $this->archive->resolve($entry['identifier']);

                if ($source === null) {
                    continue;
                }

                $catalog[] = [
                    'provider' => $this->provider(),
                    'reference' => $entry['identifier'],
                    'title' => $entry['title'],
                    'year' => $entry['year'] ?? null,
                    'license' => $entry['license'] ?? null,
                    'studio' => $entry['studio'] ?? null,
                    'poster' => $source->poster,
                ];
            }

            return $catalog;
        });
    }

    /** @return array<string, mixed>|null */
    private function findEntry(string $identifier): ?array
    {
        foreach ($this->entries() as $entry) {
            if ($entry['identifier'] === $identifier) {
                return $entry;
            }
        }

        return null;
    }

    /** @return array<int, array<string, mixed>> */
    private function entries(): array
    {
        /** @var array<int, array<string, mixed>> $titles */
        $titles = config('open-movies.titles', []);

        return array_values(array_filter(
            $titles,
            static fn (array $entry): bool => isset($entry['identifier'], $entry['title']),
        ));
    }
}
