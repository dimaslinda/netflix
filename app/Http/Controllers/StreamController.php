<?php

namespace App\Http\Controllers;

use App\Services\ScraperApiService;
use Illuminate\Http\Request;

class StreamController extends Controller
{
    protected ScraperApiService $scraperApi;

    public function __construct(ScraperApiService $scraperApi)
    {
        $this->scraperApi = $scraperApi;
    }

    /**
     * Search for content on NetMirror by title
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');

        if (empty($query)) {
            return response()->json([
                'success' => false,
                'message' => 'Query is required',
                'data' => [],
            ]);
        }

        $results = $this->scraperApi->searchNetMirror($query);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Get stream URL for a content by NetMirror ID
     */
    public function getStream(Request $request)
    {
        $id = $request->query('id');

        if (empty($id)) {
            return response()->json([
                'success' => false,
                'message' => 'ID is required',
            ], 400);
        }

        $stream = $this->scraperApi->getStream($id);

        if (!$stream) {
            return response()->json([
                'success' => false,
                'message' => 'Stream not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $stream,
        ]);
    }

    /**
     * Find stream by movie/show title (useful for TMDB integration)
     */
    public function findByTitle(Request $request)
    {
        $title = $request->query('title', '');
        $year = $request->query('year');

        if (empty($title)) {
            return response()->json([
                'success' => false,
                'message' => 'Title is required',
            ], 400);
        }

        // Search for the content
        $match = $this->scraperApi->findByTitle($title, $year ? (int) $year : null);

        if (!$match) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found',
            ], 404);
        }

        // Get stream URL if we have an ID
        $streamData = null;
        if (isset($match['id'])) {
            $streamData = $this->scraperApi->getStream($match['id']);
        }

        return response()->json([
            'success' => true,
            'match' => $match,
            'stream' => $streamData,
        ]);
    }
}
