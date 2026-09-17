<?php

namespace App\Http\Controllers;

use App\Services\ConsumetService;
use App\Services\TmdbService;
use Illuminate\Http\Request;

class ConsumetController extends Controller
{
    protected ConsumetService $consumet;
    protected TmdbService $tmdb;

    public function __construct(ConsumetService $consumet, TmdbService $tmdb)
    {
        $this->consumet = $consumet;
        $this->tmdb = $tmdb;
    }

    public function getStream(string $type, string $id, string $season = '1', string $episode = '1')
    {
        // For local player to work, we need a DIRECT M3U8 URL.
        // If ConsumetService doesn't return one, we fallback to an embed or a known proxy.
        $streamUrl = $this->consumet->getStreamUrl($type, $id, $season, $episode);

        return response()->json([
            'success' => !!$streamUrl,
            'url' => $streamUrl
        ]);
    }
}
