<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TmdbService
{
    protected $baseUrl;

    protected $apiKey;

    protected $token;

    public function __construct()
    {
        $this->baseUrl = config('services.tmdb.base_url');
        $this->apiKey = config('services.tmdb.key');
        $this->token = config('services.tmdb.token');
    }

    public function getTrending(?int $providerId = null, string $region = 'ID')
    {
        if ($providerId === null) {
            return $this->fetch('/trending/all/week?language=en-US');
        }

        $params = [
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'with_watch_providers' => $providerId,
            'watch_region' => $region,
            'with_watch_monetization_types' => 'flatrate',
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getTopRated(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'language' => 'en-US',
            'sort_by' => 'vote_average.desc',
            'vote_count.gte' => 500,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getActionMovies(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'with_genres' => 28,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getComedyMovies(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'with_genres' => 35,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getHorrorMovies(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'with_genres' => 27,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getRomanceMovies(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'with_genres' => 10749,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getDocumentaries(?int $providerId = null, string $region = 'ID')
    {
        $params = [
            'with_genres' => 99,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getWatchProviders(string $type = 'movie', string $region = 'ID')
    {
        $queryString = http_build_query([
            'language' => 'en-US',
            'watch_region' => $region,
        ]);

        return $this->fetch("/watch/providers/{$type}?{$queryString}");
    }

    public function findProviderIdByName(string $name, string $region = 'ID', string $type = 'movie'): ?int
    {
        $data = $this->getWatchProviders($type, $region);
        $results = $data['results'] ?? [];

        if (! is_array($results)) {
            return null;
        }

        $needle = mb_strtolower($name);

        foreach ($results as $provider) {
            $providerName = $provider['provider_name'] ?? null;
            $providerId = $provider['provider_id'] ?? null;

            if (! is_string($providerName) || $providerId === null) {
                continue;
            }

            if (str_contains(mb_strtolower($providerName), $needle)) {
                return (int) $providerId;
            }
        }

        return null;
    }

    public function searchMulti($query)
    {
        $queryString = http_build_query([
            'query' => $query,
            'include_adult' => 'false',
            'language' => 'en-US',
        ]);

        return $this->fetch("/search/multi?{$queryString}");
    }

    public function getMovieDetails($id)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/movie/{$id}?{$queryString}");
    }

    public function getTvDetails($id)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/tv/{$id}?{$queryString}");
    }

    public function getMovieVideos($id)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/movie/{$id}/videos?{$queryString}");
    }

    public function getTvVideos($id)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/tv/{$id}/videos?{$queryString}");
    }

    public function getTvSeason($id, $seasonNumber)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/tv/{$id}/season/{$seasonNumber}?{$queryString}");
    }

    protected function fetch($endpoint)
    {
        if (empty($this->apiKey)) {
            return $this->getMockData($endpoint);
        }

        $cacheKey = "tmdb_request_{$endpoint}";
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        $response = $this->token
            ? Http::withToken($this->token)->get("{$this->baseUrl}{$endpoint}")
            : Http::get("{$this->baseUrl}{$endpoint}", ['api_key' => $this->apiKey]);

        if ($response->successful()) {
            $json = $response->json();
            Cache::put($cacheKey, $json, 3600);

            return $json;
        }

        return $this->getMockData($endpoint);
    }

    protected function getMockData($endpoint)
    {
        if (str_starts_with($endpoint, '/search/')) {
            return [
                'page' => 1,
                'results' => [],
                'total_pages' => 1,
                'total_results' => 0,
            ];
        }

        if (str_contains($endpoint, '/videos')) {
            return [
                'id' => 0,
                'results' => [],
            ];
        }

        $mockMovies = [];
        for ($i = 1; $i <= 10; $i++) {
            $mockMovies[] = [
                'id' => $i,
                'title' => "Mock Movie Title {$i}",
                'original_name' => "Mock Series Title {$i}",
                'media_type' => 'movie',
                'backdrop_path' => null, // Frontend should handle null or show placeholder
                'poster_path' => null,
                'overview' => "This is a mock description for movie {$i}. Please add a valid TMDB API Key to your .env file to see real data.",
                'vote_average' => rand(50, 100) / 10,
            ];
        }

        return [
            'results' => $mockMovies,
            'page' => 1,
            'total_pages' => 1,
        ];
    }
}
