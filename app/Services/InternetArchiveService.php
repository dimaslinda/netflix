<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Pembaca katalog Internet Archive.
 *
 * Pencarian dibatasi pada koleksi yang memang disediakan untuk diunduh bebas,
 * jadi hasilnya tidak pernah menunjuk berkas yang butuh izin tambahan.
 */
class InternetArchiveService
{
    private const ENDPOINT = 'https://archive.org/advancedsearch.php';

    /** Koleksi Archive yang isinya film utuh dan boleh diunduh. */
    private const COLLECTION = 'feature_films';

    private const CACHE_TTL = 1800;

    /**
     * Telusuri koleksi film, dengan kata kunci opsional.
     *
     * @return array<string, mixed>
     */
    public function search(?string $query = null, int $page = 1, int $rows = 24): array
    {
        $page = max(1, $page);
        $rows = min(50, max(1, $rows));
        $keyword = $this->sanitizeKeyword($query);

        $cacheKey = 'archive:search:'.md5(($keyword ?? '').'|'.$page.'|'.$rows);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($keyword, $page, $rows): array {
            $clauses = ['collection:'.self::COLLECTION, 'mediatype:movies'];

            if ($keyword !== null) {
                $clauses[] = 'title:('.$keyword.')';
            }

            // Kueri disusun tangan, bukan lewat larik parameter Http.
            //
            // Archive menuntut bentuk berulang fl[]=a&fl[]=b, sedangkan larik
            // bersarang milik Laravel menghasilkan fl[][0]=a yang diabaikan
            // diam-diam. Archive juga menolak sort[] bernilai kosong dengan
            // galat UNSUPPORTED_VALUE, jadi parameter itu hanya dikirim bila
            // memang ada nilainya.
            $parameters = [
                'q='.rawurlencode(implode(' AND ', $clauses)),
                'rows='.$rows,
                'page='.$page,
                'output=json',
            ];

            foreach (['identifier', 'title', 'year', 'description'] as $field) {
                $parameters[] = 'fl%5B%5D='.$field;
            }

            if ($keyword === null) {
                $parameters[] = 'sort%5B%5D='.rawurlencode('downloads desc');
            }

            $response = Http::timeout(20)->get(
                self::ENDPOINT.'?'.implode('&', $parameters),
            );

            if (! $response->successful()) {
                return ['response' => ['docs' => [], 'numFound' => 0]];
            }

            return $response->json() ?? ['response' => ['docs' => [], 'numFound' => 0]];
        });
    }

    /**
     * @deprecated Pakai search(). Dipertahankan agar pemanggil lama tidak putus.
     *
     * @return array<string, mixed>
     */
    public function searchPublicDomain(int $page = 1, int $rows = 20): array
    {
        return $this->search(null, $page, $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public function getMetadata(string $identifier): array
    {
        $response = Http::timeout(20)->get("https://archive.org/metadata/{$identifier}");

        if (! $response->successful()) {
            return ['metadata' => null, 'files' => []];
        }

        return $response->json() ?? ['metadata' => null, 'files' => []];
    }

    /**
     * Buang karakter yang punya arti khusus di sintaks kueri Lucene milik
     * Archive. Tanpa ini, tanda kutip atau tanda kurung dari pengguna bisa
     * mengubah bentuk kueri dan membuat pencarian gagal total.
     */
    private function sanitizeKeyword(?string $query): ?string
    {
        if ($query === null) {
            return null;
        }

        $clean = trim(preg_replace('/[^\p{L}\p{N}\s\-]+/u', ' ', $query) ?? '');
        $clean = preg_replace('/\s+/', ' ', $clean) ?? '';

        return $clean === '' ? null : mb_substr($clean, 0, 80);
    }
}
