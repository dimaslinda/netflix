<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Catalog\PlayableCatalogService;
use App\Services\InternetArchiveService;
use App\Services\Playback\OpenMovieResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Penjelajahan katalog terbuka: kurasi film berlisensi bebas, pencarian ke
 * koleksi film Internet Archive, dan katalog beresolusi TMDB yang setiap
 * judulnya sudah terbukti punya berkas.
 */
final class ArchiveController extends Controller
{
    public function __construct(
        private readonly InternetArchiveService $archive,
        private readonly OpenMovieResolver $openMovies,
        private readonly PlayableCatalogService $playable,
    ) {}

    /**
     * Judul yang punya berkas sekaligus punya metadata TMDB.
     *
     * Jumlah hasilnya selalu lebih kecil dari jumlah yang ditelusuri: banyak
     * berkas Archive tidak punya padanan TMDB yang meyakinkan, dan yang seperti
     * itu sengaja tidak ditampilkan daripada dipasangi poster film lain.
     */
    public function playable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'rows' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $page = (int) ($validated['page'] ?? 1);
        $result = $this->playable->page(
            $validated['q'] ?? null,
            $page,
            (int) ($validated['rows'] ?? 24),
        );

        return response()->json([
            'success' => true,
            'data' => $result['items'],
            'meta' => [
                'page' => $page,
                'matched' => count($result['items']),
                'scanned' => $result['scanned'],
            ],
        ]);
    }

    /**
     * Katalog kurasi. Hanya berisi judul yang sudah terbukti bisa diputar.
     */
    public function catalog(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->openMovies->catalog(),
        ]);
    }

    /**
     * Telusuri koleksi film Internet Archive.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'rows' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $page = (int) ($validated['page'] ?? 1);
        $rows = (int) ($validated['rows'] ?? 24);

        $json = $this->archive->search($validated['q'] ?? null, $page, $rows);
        $docs = $json['response']['docs'] ?? [];

        $items = array_values(array_map(
            fn (array $doc): array => [
                'provider' => 'archive',
                'reference' => $doc['identifier'] ?? '',
                'title' => $doc['title'] ?? ($doc['identifier'] ?? 'Tanpa judul'),
                'year' => $doc['year'] ?? null,
                'poster' => isset($doc['identifier'])
                    ? 'https://archive.org/services/img/'.$doc['identifier']
                    : null,
            ],
            array_filter(is_array($docs) ? $docs : [], is_array(...)),
        ));

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'page' => $page,
                'rows' => $rows,
                'total' => (int) ($json['response']['numFound'] ?? 0),
            ],
        ]);
    }

    public function metadata(string $identifier): JsonResponse
    {
        return response()->json($this->archive->getMetadata($identifier));
    }
}
