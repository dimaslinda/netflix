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

    public function getTrending(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        if ($providerId === null) {
            $params = [
                'language' => 'en-US',
                'page' => $page,
            ];

            $queryString = http_build_query($params);

            return $this->fetch("/trending/all/week?{$queryString}");
        }

        $params = [
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'with_watch_providers' => $providerId,
            'watch_region' => $region,
            'with_watch_monetization_types' => 'flatrate',
            'page' => $page,
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getTrendingTv(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        if ($providerId === null) {
            $params = [
                'language' => 'en-US',
                'page' => $page,
            ];

            $queryString = http_build_query($params);

            return $this->fetch("/trending/tv/week?{$queryString}");
        }

        $params = [
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'with_watch_providers' => $providerId,
            'watch_region' => $region,
            'with_watch_monetization_types' => 'flatrate',
            'page' => $page,
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/discover/tv?{$queryString}");
    }

    public function getTopRated(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'sort_by' => 'vote_average.desc',
            'vote_count.gte' => 500,
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getTopRatedTv(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'sort_by' => 'vote_average.desc',
            'vote_count.gte' => 200,
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/tv?{$queryString}");
    }

    public function getActionMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 28,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getComedyMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 35,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getHorrorMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 27,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getRomanceMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 10749,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getDocumentaries(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 99,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getAnimationMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 16,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getAnimeMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 16,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'with_original_language' => 'ja',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    // NEW CATEGORIES

    public function getThrillerMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 53,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getSciFiMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 878,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getDramaMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 18,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getCrimeMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 80,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getFamilyMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 10751,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getKidsContent(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => '10751|16',
            'certification_country' => 'US',
            'certification.lte' => 'PG',
            'include_adult' => 'false',
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getFantasyMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 14,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getMysteryMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 9648,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getWarMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 10752,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getMusicMovies(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'with_genres' => 10402,
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/movie?{$queryString}");
    }

    public function getKoreanContent(?int $providerId = null, string $region = 'ID', int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'sort_by' => 'popularity.desc',
            'with_original_language' => 'ko',
            'page' => $page,
        ];

        if ($providerId !== null) {
            $params['with_watch_providers'] = $providerId;
            $params['watch_region'] = $region;
            $params['with_watch_monetization_types'] = 'flatrate';
        }

        $queryString = http_build_query($params);

        return $this->fetch("/discover/tv?{$queryString}");
    }

    public function getUpcoming(int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'page' => $page,
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/movie/upcoming?{$queryString}");
    }

    public function getNowPlaying(int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'page' => $page,
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/movie/now_playing?{$queryString}");
    }

    public function getPopularTv(int $page = 1)
    {
        $params = [
            'language' => 'en-US',
            'page' => $page,
        ];

        $queryString = http_build_query($params);

        return $this->fetch("/tv/popular?{$queryString}");
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
        $staticMap = [
            'netflix' => 8,
            'amazon prime video' => 119,
            'prime' => 119,
            'disney' => 122,
            'disney+' => 122,
            'disney+ hotstar' => 122,
            'apple tv' => 350,
            'apple' => 350,
            'viu' => 158,
            'vidio' => 489,
            'hbo max' => 1899,
            'max' => 1899,
        ];

        $needle = mb_strtolower(trim($name));
        if (isset($staticMap[$needle])) {
            return $staticMap[$needle];
        }

        $data = $this->getWatchProviders($type, $region);
        $results = $data['results'] ?? [];

        if (!is_array($results)) {
            return null;
        }

        $needle = mb_strtolower($name);

        foreach ($results as $provider) {
            $providerName = $provider['provider_name'] ?? null;
            $providerId = $provider['provider_id'] ?? null;

            if (!is_string($providerName) || $providerId === null) {
                continue;
            }

            if (str_contains(mb_strtolower($providerName), $needle)) {
                return (int) $providerId;
            }
        }

        return null;
    }

    public function searchMulti($query, int $page = 1)
    {
        $queryString = http_build_query([
            'query' => $query,
            'include_adult' => 'false',
            'language' => 'en-US',
            'page' => $page,
        ]);

        return $this->fetch("/search/multi?{$queryString}");
    }

    /**
     * Pencarian khusus film, dengan saringan tahun opsional.
     *
     * Dipakai untuk mencocokkan berkas Internet Archive ke satu judul TMDB.
     * Berbeda dari searchMulti yang mencampur film, serial, dan orang, di sini
     * hanya film yang relevan.
     *
     * @return array<string, mixed>
     */
    public function searchMovie(string $query, ?int $year = null): array
    {
        $parameters = [
            'query' => $query,
            'include_adult' => 'false',
            'language' => 'en-US',
            'page' => 1,
        ];

        if ($year !== null) {
            $parameters['year'] = $year;
        }

        $result = $this->fetch('/search/movie?'.http_build_query($parameters));

        return is_array($result) ? $result : ['results' => []];
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

    public function getExternalIds($type, $id)
    {
        $queryString = http_build_query(['language' => 'en-US']);

        return $this->fetch("/{$type}/{$id}/external_ids?{$queryString}");
    }
    /**
     * Ambil seluruh katalog beranda (22 kategori) secara paralel menggunakan Http::pool.
     * Mengubah eksekusi beruntun (4-6 detik) menjadi eksekusi bersamaan (< 1 detik).
     *
     * @return array<string, mixed>
     */
    public function getHomeCatalog(?int $providerId = null, string $region = 'ID', int $page = 1): array
    {
        $providerParams = $providerId ? [
            'with_watch_providers' => $providerId,
            'watch_region' => $region,
            'with_watch_monetization_types' => 'flatrate',
        ] : [];

        $disneyId = $this->findProviderIdByName('disney', $region) ?? 122;

        $endpoints = [];

        if ($providerId === null || $providerId === $disneyId) {
            $endpoints['disneyCollection'] = '/discover/movie?' . http_build_query([
                'language' => 'en-US',
                'sort_by' => 'popularity.desc',
                'with_watch_providers' => $disneyId,
                'watch_region' => $region,
                'with_watch_monetization_types' => 'flatrate',
                'page' => 1,
            ]);
        }

        $endpoints = array_merge($endpoints, [
            'trending' => $providerId === null
                ? "/trending/all/week?language=en-US&page={$page}"
                : '/discover/movie?' . http_build_query(array_merge(['language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'topRated' => '/discover/movie?' . http_build_query(array_merge(['language' => 'en-US', 'sort_by' => 'vote_average.desc', 'vote_count.gte' => 500, 'page' => $page], $providerParams)),
            'trendingTv' => $providerId === null
                ? "/trending/tv/week?language=en-US&page={$page}"
                : '/discover/tv?' . http_build_query(array_merge(['language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'topRatedTv' => '/discover/tv?' . http_build_query(array_merge(['language' => 'en-US', 'sort_by' => 'vote_average.desc', 'vote_count.gte' => 200, 'page' => $page], $providerParams)),
            'actionMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 28, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'comedyMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 35, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'horrorMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 27, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'romanceMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 10749, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'documentaries' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 99, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'animationMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 16, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'animeMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 16, 'with_original_language' => 'ja', 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'thrillerMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 53, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'sciFiMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 878, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'dramaMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 18, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'crimeMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 80, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'familyMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 10751, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'fantasyMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 14, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'mysteryMovies' => '/discover/movie?' . http_build_query(array_merge(['with_genres' => 9648, 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'koreanContent' => '/discover/movie?' . http_build_query(array_merge(['with_original_language' => 'ko', 'language' => 'en-US', 'sort_by' => 'popularity.desc', 'page' => $page], $providerParams)),
            'popularTv' => "/tv/popular?language=en-US&page={$page}",
            'nowPlaying' => "/movie/now_playing?language=en-US&page={$page}",
        ]);

        return $this->fetchMultiple($endpoints);
    }

    /**
     * Eksekusi banyak endpoint TMDB secara bersamaan (parallel multi-socket).
     *
     * @param  array<string, string>  $endpoints
     * @return array<string, mixed>
     */
    public function fetchMultiple(array $endpoints): array
    {
        if (empty($this->apiKey)) {
            $mocked = [];
            foreach ($endpoints as $key => $ep) {
                $mocked[$key] = $this->getMockData($ep);
            }
            return $mocked;
        }

        $results = [];
        $toFetch = [];

        foreach ($endpoints as $key => $endpoint) {
            $cacheKey = "tmdb_request_{$endpoint}";
            $cached = Cache::get($cacheKey);
            if ($cached) {
                $results[$key] = $this->injectMediaType($cached, $endpoint);
            } else {
                $toFetch[$key] = $endpoint;
            }
        }

        if (empty($toFetch)) {
            return $results;
        }

        // Jalankan seluruh request yang belum ada di cache secara paralel
        $responses = Http::pool(function ($pool) use ($toFetch) {
            $poolRequests = [];
            foreach ($toFetch as $key => $endpoint) {
                $url = "{$this->baseUrl}{$endpoint}";
                $poolRequests[$key] = $this->token
                    ? $pool->as($key)->withToken($this->token)->get($url)
                    : $pool->as($key)->get($url, ['api_key' => $this->apiKey]);
            }
            return $poolRequests;
        });

        foreach ($toFetch as $key => $endpoint) {
            $response = $responses[$key] ?? null;
            if ($response && $response instanceof \Illuminate\Http\Client\Response && $response->successful()) {
                $json = $response->json();
                Cache::put("tmdb_request_{$endpoint}", $json, 3600);
                $results[$key] = $this->injectMediaType($json, $endpoint);
            } else {
                $results[$key] = $this->getMockData($endpoint);
            }
        }

        return $results;
    }

    protected function fetch($endpoint)
    {
        if (empty($this->apiKey)) {
            return $this->getMockData($endpoint);
        }

        $cacheKey = "tmdb_request_{$endpoint}";
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $this->injectMediaType($cached, $endpoint);
        }

        $response = $this->token
            ? Http::withToken($this->token)->get("{$this->baseUrl}{$endpoint}")
            : Http::get("{$this->baseUrl}{$endpoint}", ['api_key' => $this->apiKey]);

        if ($response->successful()) {
            $json = $response->json();
            Cache::put($cacheKey, $json, 3600);

            return $this->injectMediaType($json, $endpoint);
        }

        return $this->getMockData($endpoint);
    }

    /**
     * Inject media_type into results based on endpoint.
     * TMDB doesn't always include media_type for /discover/tv, /trending/tv, etc.
     */
    protected function injectMediaType(array $data, string $endpoint): array
    {
        // Determine media type from endpoint
        $mediaType = null;

        if (str_contains($endpoint, '/tv/') || str_contains($endpoint, '/discover/tv') || str_contains($endpoint, '/trending/tv')) {
            $mediaType = 'tv';
        } elseif (str_contains($endpoint, '/movie/') || str_contains($endpoint, '/discover/movie') || str_contains($endpoint, '/trending/movie')) {
            $mediaType = 'movie';
        }

        // For /trending/all, media_type is already included by TMDB
        // For /search/multi, media_type is already included by TMDB

        if ($mediaType && isset($data['results']) && is_array($data['results'])) {
            foreach ($data['results'] as &$item) {
                if (!isset($item['media_type'])) {
                    $item['media_type'] = $mediaType;
                }
            }
        }

        return $data;
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
        for ($i = 1; $i <= 20; $i++) {
            $mockMovies[] = [
                'id' => $i,
                'title' => "Mock Movie Title {$i}",
                'original_name' => "Mock Series Title {$i}",
                'media_type' => 'movie',
                'backdrop_path' => null,
                'poster_path' => null,
                'overview' => "This is a mock description for movie {$i}. Please add a valid TMDB API Key to your .env file to see real data.",
                'vote_average' => rand(50, 100) / 10,
                'release_date' => '2024-01-01',
            ];
        }

        return [
            'results' => $mockMovies,
            'page' => 1,
            'total_pages' => 1,
        ];
    }
}
