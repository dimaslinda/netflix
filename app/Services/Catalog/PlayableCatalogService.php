<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Services\InternetArchiveService;
use App\Services\Playback\ArchiveStreamResolver;
use App\Services\TmdbService;
use App\Support\Catalog\ArchiveTitle;
use Illuminate\Support\Facades\Cache;

/**
 * Menyusun katalog yang setiap judulnya benar-benar bisa diputar, lengkap
 * dengan metadata TMDB.
 *
 * Arahnya sengaja dibalik dari beranda biasa. Beranda mengambil judul populer
 * dari TMDB lalu menemukan bahwa hampir tak satu pun punya berkas. Di sini
 * berkasnya dulu yang dipastikan ada di Internet Archive, baru dicarikan
 * padanannya di TMDB untuk poster, sinopsis, dan penilaian.
 *
 * Akibatnya katalog ini lebih kecil, tapi setiap kartu di dalamnya menepati
 * janjinya saat ditekan.
 */
final class PlayableCatalogService
{
    /** Hasil pencocokan jarang berubah, dan setiap entri memakan satu panggilan TMDB. */
    private const MATCH_TTL = 60 * 60 * 24 * 7;

    private const PAGE_TTL = 60 * 60 * 6;

    /**
     * Ambang kemiripan judul, dalam persen.
     *
     * Dipasang tinggi dengan sengaja. Kecocokan yang salah memasang poster dan
     * sinopsis film lain pada berkas yang akan diputar pemirsa, dan itu lebih
     * merusak daripada kartu yang tidak muncul sama sekali.
     */
    private const MIN_SIMILARITY = 88.0;

    /** Ambang yang lebih ketat dipakai saat tahun tidak bisa dibandingkan. */
    private const MIN_SIMILARITY_WITHOUT_YEAR = 94.0;

    public function __construct(
        private readonly InternetArchiveService $archive,
        private readonly TmdbService $tmdb,
        private readonly ArchiveStreamResolver $resolver,
    ) {}

    /**
     * @return array{items: array<int, array<string, mixed>>, scanned: int}
     */
    public function page(?string $query = null, int $page = 1, int $rows = 24): array
    {
        $cacheKey = 'catalog:playable:'.md5(($query ?? '').'|'.$page.'|'.$rows);

        return Cache::remember($cacheKey, self::PAGE_TTL, function () use ($query, $page, $rows): array {
            $response = $this->archive->search($query, $page, $rows);
            $documents = $response['response']['docs'] ?? [];

            if (! is_array($documents)) {
                return ['items' => [], 'scanned' => 0];
            }

            $items = [];

            foreach ($documents as $document) {
                if (! is_array($document) || ! isset($document['identifier'], $document['title'])) {
                    continue;
                }

                $entry = $this->buildEntry($document);

                if ($entry !== null) {
                    $items[] = $entry;
                }
            }

            return ['items' => $items, 'scanned' => count($documents)];
        });
    }

    /**
     * @param  array<string, mixed>  $document
     * @return array<string, mixed>|null
     */
    private function buildEntry(array $document): ?array
    {
        $identifier = (string) $document['identifier'];

        // Berkasnya diperiksa lebih dulu. Memanggil TMDB untuk item yang tidak
        // punya turunan video yang bisa diputar hanya membuang kuota.
        $source = $this->resolver->resolve($identifier);

        if ($source === null) {
            return null;
        }

        $parsed = ArchiveTitle::parse(
            (string) $document['title'],
            isset($document['year']) ? (string) $document['year'] : null,
        );

        if ($parsed->clean === '') {
            return null;
        }

        $match = $this->matchOnTmdb($parsed);

        if ($match === null) {
            return null;
        }

        return [
            'provider' => 'archive',
            'reference' => $identifier,
            'tmdb_id' => $match['id'] ?? null,
            'title' => $match['title'] ?? $parsed->clean,
            'overview' => $match['overview'] ?? null,
            'poster_path' => $match['poster_path'] ?? null,
            'backdrop_path' => $match['backdrop_path'] ?? null,
            'vote_average' => $match['vote_average'] ?? null,
            'release_date' => $match['release_date'] ?? null,
        ];
    }

    /**
     * Cari satu padanan TMDB yang cukup meyakinkan, atau tidak sama sekali.
     *
     * @return array<string, mixed>|null
     */
    private function matchOnTmdb(ArchiveTitle $parsed): ?array
    {
        $cacheKey = 'catalog:tmdb-match:'.md5($parsed->clean.'|'.($parsed->year ?? ''));

        $match = Cache::remember($cacheKey, self::MATCH_TTL, function () use ($parsed): array {
            $results = $this->tmdb->searchMovie($parsed->clean, $parsed->year)['results'] ?? [];

            if (! is_array($results) || $results === []) {
                // Saringan tahun TMDB ketat. Bila nihil, coba sekali lagi tanpa
                // tahun, karena tahun unggahan di Archive sering meleset setahun.
                $results = $parsed->year === null
                    ? []
                    : ($this->tmdb->searchMovie($parsed->clean)['results'] ?? []);
            }

            if (! is_array($results)) {
                return [];
            }

            foreach (array_slice($results, 0, 5) as $candidate) {
                if (is_array($candidate) && $this->isConfident($parsed, $candidate)) {
                    return $candidate;
                }
            }

            return [];
        });

        return $match === [] ? null : $match;
    }

    /**
     * @param  array<string, mixed>  $candidate
     */
    private function isConfident(ArchiveTitle $parsed, array $candidate): bool
    {
        $candidateTitle = (string) ($candidate['title'] ?? '');

        if ($candidateTitle === '' || ! isset($candidate['poster_path'])) {
            return false;
        }

        $left = ArchiveTitle::comparable($parsed->clean);
        $right = ArchiveTitle::comparable($candidateTitle);

        if ($left === '' || $right === '') {
            return false;
        }

        if ($left === $right) {
            return $this->yearsAgree($parsed->year, $candidate);
        }

        similar_text($left, $right, $percent);

        $candidateYear = $this->candidateYear($candidate);
        $canCompareYears = $parsed->year !== null && $candidateYear !== null;

        if (! $canCompareYears) {
            return $percent >= self::MIN_SIMILARITY_WITHOUT_YEAR;
        }

        return $percent >= self::MIN_SIMILARITY
            && abs($parsed->year - $candidateYear) <= 1;
    }

    /**
     * Judul yang sama persis masih bisa merujuk film berbeda: pembuatan ulang
     * memakai judul identik. Selisih tahun dua tahun sudah cukup memisahkan.
     *
     * @param  array<string, mixed>  $candidate
     */
    private function yearsAgree(?int $year, array $candidate): bool
    {
        $candidateYear = $this->candidateYear($candidate);

        if ($year === null || $candidateYear === null) {
            return true;
        }

        return abs($year - $candidateYear) <= 2;
    }

    /** @param  array<string, mixed>  $candidate */
    private function candidateYear(array $candidate): ?int
    {
        $date = $candidate['release_date'] ?? null;

        if (! is_string($date) || strlen($date) < 4) {
            return null;
        }

        return (int) substr($date, 0, 4);
    }
}
