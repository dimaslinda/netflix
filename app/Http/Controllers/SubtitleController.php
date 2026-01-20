<?php

namespace App\Http\Controllers;

use App\Services\SubDLService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubtitleController extends Controller
{
    public function __construct(
        protected SubDLService $subtitles
    ) {
    }

    /**
     * Search subtitles by TMDB ID
     */
    public function searchByTmdb(Request $request): JsonResponse
    {
        $request->validate([
            'tmdb_id' => 'required|string',
            'type' => 'required|in:movie,tv',
            'season' => 'nullable|integer',
            'episode' => 'nullable|integer',
            'language' => 'nullable|string|max:5',
        ]);

        $results = $this->subtitles->searchByTmdbId(
            $request->tmdb_id,
            $request->type,
            $request->season,
            $request->episode,
            $request->language
        );

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Search subtitles by query text
     */
    public function searchByQuery(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|max:255',
            'language' => 'nullable|string|max:5',
            'year' => 'nullable|integer|min:1900|max:2100',
        ]);

        $results = $this->subtitles->searchByQuery(
            $request->query('query'),
            $request->query('language'),
            $request->query('year')
        );

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Get download link for a subtitle file
     */
    public function download(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|string',
        ]);

        $result = $this->subtitles->getDownloadLink($request->url);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get available languages
     */
    public function languages(): JsonResponse
    {
        $languages = $this->subtitles->getAvailableLanguages();

        return response()->json([
            'success' => true,
            'data' => $languages,
        ]);
    }
}
