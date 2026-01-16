<?php

namespace App\Http\Controllers;

use App\Services\TmdbService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MovieController extends Controller
{
    protected $tmdbService;

    public function __construct(TmdbService $tmdbService)
    {
        $this->tmdbService = $tmdbService;
    }

    public function index(Request $request)
    {
        $providerKey = $request->query('provider');
        $region = 'ID';

        $providerNames = [
            'netflix' => 'Netflix',
            'prime' => 'Amazon Prime Video',
            'disney' => 'Disney',
            'viu' => 'Viu',
            'vidio' => 'Vidio',
            'hbomax' => 'HBO Max',
        ];

        $providerId = null;
        if ($providerKey && isset($providerNames[$providerKey])) {
            $providerId = $this->tmdbService->findProviderIdByName(
                $providerNames[$providerKey],
                $region
            );
        }

        return Inertia::render('Home', [
            'provider' => $providerKey,
            'trending' => $this->tmdbService->getTrending($providerId, $region),
            'topRated' => $this->tmdbService->getTopRated($providerId, $region),
            'actionMovies' => $this->tmdbService->getActionMovies($providerId, $region),
            'comedyMovies' => $this->tmdbService->getComedyMovies($providerId, $region),
            'horrorMovies' => $this->tmdbService->getHorrorMovies($providerId, $region),
            'romanceMovies' => $this->tmdbService->getRomanceMovies($providerId, $region),
            'documentaries' => $this->tmdbService->getDocumentaries($providerId, $region),
        ]);
    }

    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        if ($q === '') {
            return response()->json([
                'page' => 1,
                'results' => [],
                'total_pages' => 1,
                'total_results' => 0,
            ]);
        }

        return response()->json($this->tmdbService->searchMulti($q));
    }

    public function details($type, $id)
    {
        if (! in_array($type, ['movie', 'tv'], true)) {
            abort(404);
        }

        $data = $type === 'movie'
            ? $this->tmdbService->getMovieDetails($id)
            : $this->tmdbService->getTvDetails($id);

        return response()->json($data);
    }

    public function videos($type, $id)
    {
        if (! in_array($type, ['movie', 'tv'], true)) {
            abort(404);
        }

        $data = $type === 'movie'
            ? $this->tmdbService->getMovieVideos($id)
            : $this->tmdbService->getTvVideos($id);

        return response()->json([
            'best' => $this->pickBestVideo($data),
            'results' => $data['results'] ?? [],
        ]);
    }

    public function tvSeason($id, $season)
    {
        $data = $this->tmdbService->getTvSeason($id, $season);

        return response()->json($data);
    }

    protected function pickBestVideo($data)
    {
        $results = $data['results'] ?? [];
        if (! is_array($results) || count($results) === 0) {
            return null;
        }

        $youtubeTrailers = array_values(array_filter($results, function ($video) {
            $site = $video['site'] ?? null;
            $type = $video['type'] ?? null;

            return $site === 'YouTube' && $type === 'Trailer' && ! empty($video['key']);
        }));

        if (count($youtubeTrailers) > 0) {
            return $this->normalizeVideo($youtubeTrailers[0]);
        }

        $youtubeAny = array_values(array_filter($results, function ($video) {
            $site = $video['site'] ?? null;

            return $site === 'YouTube' && ! empty($video['key']);
        }));

        if (count($youtubeAny) > 0) {
            return $this->normalizeVideo($youtubeAny[0]);
        }

        return $this->normalizeVideo($results[0]);
    }

    protected function normalizeVideo($video)
    {
        $site = $video['site'] ?? null;
        $key = $video['key'] ?? null;

        $embedUrl = null;
        if ($site === 'YouTube' && $key) {
            $embedUrl = "https://www.youtube.com/embed/{$key}?autoplay=1&mute=1";
        }

        return [
            'id' => $video['id'] ?? null,
            'name' => $video['name'] ?? null,
            'site' => $site,
            'type' => $video['type'] ?? null,
            'key' => $key,
            'embed_url' => $embedUrl,
        ];
    }
}
