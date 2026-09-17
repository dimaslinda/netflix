<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SubDLService;
use App\Services\Subtitle\SubtitleLibrary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pencarian dan penyajian takarir untuk pemutar.
 *
 * Seluruh logika ada di SubtitleLibrary. Controller hanya memvalidasi masukan
 * dan membentuk respons.
 */
final class SubtitleController extends Controller
{
    public function __construct(
        private readonly SubtitleLibrary $library,
        private readonly SubDLService $subdl,
    ) {}

    /**
     * Cari takarir untuk satu judul atau episode.
     *
     * Bila bahasa sasaran tidak ada di penyedia mana pun, hasilnya berisi
     * takarir bahasa cadangan yang ditandai needs_translation.
     */
    public function searchByTmdb(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tmdb_id' => ['required', 'string', 'max:32'],
            'type' => ['required', 'in:movie,tv'],
            'season' => ['nullable', 'integer', 'min:0'],
            'episode' => ['nullable', 'integer', 'min:0'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->library->search(
            $validated['tmdb_id'],
            $validated['type'],
            isset($validated['season']) ? (int) $validated['season'] : null,
            isset($validated['episode']) ? (int) $validated['episode'] : null,
            $validated['title'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => $result['tracks'],
            'meta' => [
                'target_language' => $result['target_language'],
                'translator' => $result['translator'],
                'translator_available' => $result['translator_available'],
            ],
        ]);
    }

    /**
     * Cari takarir hanya berbekal judul.
     *
     * Jaminannya sama dengan pencarian lewat id TMDB: bahasa sasaran dulu, dan
     * bila nihil, bahasa cadangan yang ditandai untuk diterjemahkan. Jalur ini
     * yang dipakai film katalog terbuka, yang diputar tanpa id TMDB.
     */
    public function searchByQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
        ]);

        $result = $this->library->searchByTitle(
            $validated['query'],
            isset($validated['year']) ? (int) $validated['year'] : null,
        );

        return response()->json([
            'success' => true,
            'data' => $result['tracks'],
            'meta' => [
                'target_language' => $result['target_language'],
                'translator' => $result['translator'],
                'translator_available' => $result['translator_available'],
            ],
        ]);
    }

    /**
     * Sajikan isi takarir sebagai VTT untuk elemen <track>.
     */
    public function stream(Request $request): Response
    {
        $validated = $request->validate([
            'url' => ['required', 'string', 'max:2048'],
            'from' => ['nullable', 'string', 'max:5'],
            'translate' => ['nullable', 'boolean'],
        ]);

        $content = $this->library->content(
            $validated['url'],
            $validated['from'] ?? null,
            $request->boolean('translate'),
        );

        if ($content === null) {
            return response('Takarir tidak ditemukan atau kosong.', 404);
        }

        return response($content)
            ->header('Content-Type', 'text/vtt; charset=UTF-8')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Cache-Control', 'private, max-age=86400');
    }

    public function languages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->subdl->getAvailableLanguages(),
        ]);
    }
}
