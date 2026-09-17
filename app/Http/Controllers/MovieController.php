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
        $page = max(1, (int) $request->query('page', 1));

        $providerNames = [
            'netflix' => 'Netflix',
            'prime' => 'Amazon Prime Video',
            'disney' => 'Disney',
            'viu' => 'Viu',
            'vidio' => 'Vidio',
            'hbomax' => 'HBO Max',
            'apple' => 'Apple TV',
        ];

        $providerId = null;
        if ($providerKey && isset($providerNames[$providerKey])) {
            $providerId = $this->tmdbService->findProviderIdByName(
                $providerNames[$providerKey],
                $region
            );
        }

        // Koleksi khusus Disney & Pixar untuk beranda
        $disneyId = $this->tmdbService->findProviderIdByName('Disney', $region);
        $disneyCollection = $disneyId ? $this->tmdbService->getTrending($disneyId, $region, 1) : null;

        return Inertia::render('Home', [
            'provider' => $providerKey,
            'disneyCollection' => $disneyCollection,
            'page' => $page,
            // Main categories
            'trending' => $this->tmdbService->getTrending($providerId, $region, $page),
            'topRated' => $this->tmdbService->getTopRated($providerId, $region, $page),
            'trendingTv' => $this->tmdbService->getTrendingTv($providerId, $region, $page),
            'topRatedTv' => $this->tmdbService->getTopRatedTv($providerId, $region, $page),
            // Movie genres
            'actionMovies' => $this->tmdbService->getActionMovies($providerId, $region, $page),
            'comedyMovies' => $this->tmdbService->getComedyMovies($providerId, $region, $page),
            'horrorMovies' => $this->tmdbService->getHorrorMovies($providerId, $region, $page),
            'romanceMovies' => $this->tmdbService->getRomanceMovies($providerId, $region, $page),
            'documentaries' => $this->tmdbService->getDocumentaries($providerId, $region, $page),
            'animationMovies' => $this->tmdbService->getAnimationMovies($providerId, $region, $page),
            'animeMovies' => $this->tmdbService->getAnimeMovies($providerId, $region, $page),
            // New categories
            'thrillerMovies' => $this->tmdbService->getThrillerMovies($providerId, $region, $page),
            'sciFiMovies' => $this->tmdbService->getSciFiMovies($providerId, $region, $page),
            'dramaMovies' => $this->tmdbService->getDramaMovies($providerId, $region, $page),
            'crimeMovies' => $this->tmdbService->getCrimeMovies($providerId, $region, $page),
            'familyMovies' => $this->tmdbService->getFamilyMovies($providerId, $region, $page),
            'fantasyMovies' => $this->tmdbService->getFantasyMovies($providerId, $region, $page),
            'mysteryMovies' => $this->tmdbService->getMysteryMovies($providerId, $region, $page),
            'koreanContent' => $this->tmdbService->getKoreanContent($providerId, $region, $page),
            'popularTv' => $this->tmdbService->getPopularTv($page),
            'nowPlaying' => $this->tmdbService->getNowPlaying($page),
        ]);
    }

    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $page = max(1, (int) $request->query('page', 1));

        if ($q === '') {
            return response()->json([
                'page' => 1,
                'results' => [],
                'total_pages' => 1,
                'total_results' => 0,
            ]);
        }

        return response()->json($this->tmdbService->searchMulti($q, $page));
    }

    public function searchPage(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $providerKey = $request->query('provider');

        $results = null;
        if ($q !== '') {
            $results = $this->tmdbService->searchMulti($q);
        }

        return Inertia::render('Search', [
            'provider' => $providerKey,
            'query' => $q,
            'results' => $results,
        ]);
    }

    public function details($type, $id)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            abort(404);
        }

        $data = $type === 'movie'
            ? $this->tmdbService->getMovieDetails($id)
            : $this->tmdbService->getTvDetails($id);

        $externalIds = $this->tmdbService->getExternalIds($type, $id);
        if ($externalIds) {
            $data['external_ids'] = $externalIds;
        }

        return response()->json($data);
    }

    public function videos($type, $id)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
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

    public function browseCategory(Request $request, string $category)
    {
        $providerKey = $request->query('provider');
        $region = 'ID';
        $page = max(1, (int) $request->query('page', 1));

        $providerNames = [
            'netflix' => 'Netflix',
            'prime' => 'Amazon Prime Video',
            'disney' => 'Disney',
            'viu' => 'Viu',
            'vidio' => 'Vidio',
            'hbomax' => 'HBO Max',
            'apple' => 'Apple TV',
        ];

        $providerId = null;
        if ($providerKey && isset($providerNames[$providerKey])) {
            $providerId = $this->tmdbService->findProviderIdByName(
                $providerNames[$providerKey],
                $region
            );
        }

        $title = 'Browse';
        $data = null;

        switch ($category) {
            case 'trending':
                $title = 'Trending Now';
                $data = $this->tmdbService->getTrending($providerId, $region, $page);
                break;
            case 'top-rated':
                $title = 'Top Rated';
                $data = $this->tmdbService->getTopRated($providerId, $region, $page);
                break;
            case 'tv-trending':
                $title = 'Trending TV';
                $data = $this->tmdbService->getTrendingTv($providerId, $region, $page);
                break;
            case 'tv-top-rated':
                $title = 'Top Rated TV';
                $data = $this->tmdbService->getTopRatedTv($providerId, $region, $page);
                break;
            case 'action':
                $title = 'Action Thrillers';
                $data = $this->tmdbService->getActionMovies($providerId, $region, $page);
                break;
            case 'comedy':
                $title = 'Comedies';
                $data = $this->tmdbService->getComedyMovies($providerId, $region, $page);
                break;
            case 'horror':
                $title = 'Scary Movies';
                $data = $this->tmdbService->getHorrorMovies($providerId, $region, $page);
                break;
            case 'romance':
                $title = 'Romance Movies';
                $data = $this->tmdbService->getRomanceMovies($providerId, $region, $page);
                break;
            case 'documentaries':
                $title = 'Documentaries';
                $data = $this->tmdbService->getDocumentaries($providerId, $region, $page);
                break;
            case 'animation':
                $title = 'Animation';
                $data = $this->tmdbService->getAnimationMovies($providerId, $region, $page);
                break;
            case 'anime':
                $title = 'Anime';
                $data = $this->tmdbService->getAnimeMovies($providerId, $region, $page);
                break;
            case 'thriller':
                $title = 'Thrillers';
                $data = $this->tmdbService->getThrillerMovies($providerId, $region, $page);
                break;
            case 'scifi':
                $title = 'Sci-Fi';
                $data = $this->tmdbService->getSciFiMovies($providerId, $region, $page);
                break;
            case 'drama':
                $title = 'Dramas';
                $data = $this->tmdbService->getDramaMovies($providerId, $region, $page);
                break;
            case 'crime':
                $title = 'Crime';
                $data = $this->tmdbService->getCrimeMovies($providerId, $region, $page);
                break;
            case 'family':
                $title = 'Family';
                $data = $this->tmdbService->getFamilyMovies($providerId, $region, $page);
                break;
            case 'fantasy':
                $title = 'Fantasy';
                $data = $this->tmdbService->getFantasyMovies($providerId, $region, $page);
                break;
            case 'mystery':
                $title = 'Mystery';
                $data = $this->tmdbService->getMysteryMovies($providerId, $region, $page);
                break;
            case 'korean':
                $title = 'Korean Dramas';
                $data = $this->tmdbService->getKoreanContent($providerId, $region, $page);
                break;
            case 'popular-tv':
                $title = 'Popular TV Shows';
                $data = $this->tmdbService->getPopularTv($page);
                break;
            case 'now-playing':
                $title = 'Now Playing in Theaters';
                $data = $this->tmdbService->getNowPlaying($page);
                break;
            case 'disney':
                $title = 'Disney+ Hotstar';
                $targetId = $providerId ?: $this->tmdbService->findProviderIdByName('Disney', $region);
                $data = $this->tmdbService->getTrending($targetId, $region, $page);
                break;
        }

        if (!$data) {
            abort(404);
        }

        return Inertia::render('BrowseCategory', [
            'provider' => $providerKey,
            'category' => $category,
            'title' => $title,
            'page' => $page,
            'results' => $data,
        ]);
    }

    protected function pickBestVideo($data)
    {
        $results = $data['results'] ?? [];
        if (!is_array($results) || count($results) === 0) {
            return null;
        }

        $youtubeTrailers = array_values(array_filter($results, function ($video) {
            $site = $video['site'] ?? null;
            $type = $video['type'] ?? null;

            return $site === 'YouTube' && $type === 'Trailer' && !empty($video['key']);
        }));

        if (count($youtubeTrailers) > 0) {
            return $this->normalizeVideo($youtubeTrailers[0]);
        }

        $youtubeAny = array_values(array_filter($results, function ($video) {
            $site = $video['site'] ?? null;

            return $site === 'YouTube' && !empty($video['key']);
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
            $embedUrl = "https://www.youtube.com/embed/{$key}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0";
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
