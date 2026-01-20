<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubDLService
{
    protected $baseUrl = 'https://api.subdl.com/api/v1/subtitles';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.subdl.api_key');
    }

    /**
     * Search for subtitles by TMDB ID
     */
    public function searchByTmdbId(string $tmdbId, string $type = 'movie', ?int $season = null, ?int $episode = null, ?string $language = null): array
    {
        $cacheKey = "subdl_tmdb_{$type}_{$tmdbId}_{$season}_{$episode}_{$language}";

        return Cache::remember($cacheKey, 3600, function () use ($tmdbId, $type, $season, $episode, $language) {
            $params = [
                'tmdb_id' => $tmdbId,
                'type' => $type,
            ];

            if ($type === 'tv' && $season !== null) {
                $params['season_number'] = $season;
            }

            if ($type === 'tv' && $episode !== null) {
                $params['episode_number'] = $episode;
            }

            if ($language) {
                $params['languages'] = $language;
            }

            // Add subs_per_page to get more results
            $params['subs_per_page'] = 30;

            return $this->search($params);
        });
    }

    /**
     * Search for subtitles by IMDB ID
     */
    public function searchByImdbId(string $imdbId, ?string $language = null): array
    {
        $cacheKey = "subdl_imdb_{$imdbId}_{$language}";

        return Cache::remember($cacheKey, 3600, function () use ($imdbId, $language) {
            $params = [
                'imdb_id' => $imdbId,
                'subs_per_page' => 30,
            ];

            if ($language) {
                $params['languages'] = $language;
            }

            return $this->search($params);
        });
    }

    /**
     * Search for subtitles by query text
     */
    public function searchByQuery(string $query, ?string $language = null, ?int $year = null): array
    {
        $params = [
            'film_name' => $query,
            'subs_per_page' => 30,
        ];

        if ($language) {
            $params['languages'] = $language;
        }

        if ($year) {
            $params['year'] = $year;
        }

        return $this->search($params);
    }

    /**
     * Get download link for a subtitle file
     */
    public function getDownloadLink(string $url): array
    {
        // SubDL provides direct download URLs
        // The URL is already the download link from search results
        return [
            'link' => $url,
            'success' => true,
        ];
    }

    /**
     * Get available subtitle languages
     */
    public function getAvailableLanguages(): array
    {
        return [
            ['language_code' => 'en', 'language_name' => 'English'],
            ['language_code' => 'id', 'language_name' => 'Indonesian'],
            ['language_code' => 'ms', 'language_name' => 'Malay'],
            ['language_code' => 'es', 'language_name' => 'Spanish'],
            ['language_code' => 'fr', 'language_name' => 'French'],
            ['language_code' => 'de', 'language_name' => 'German'],
            ['language_code' => 'it', 'language_name' => 'Italian'],
            ['language_code' => 'pt', 'language_name' => 'Portuguese'],
            ['language_code' => 'ru', 'language_name' => 'Russian'],
            ['language_code' => 'ja', 'language_name' => 'Japanese'],
            ['language_code' => 'ko', 'language_name' => 'Korean'],
            ['language_code' => 'zh', 'language_name' => 'Chinese'],
            ['language_code' => 'ar', 'language_name' => 'Arabic'],
            ['language_code' => 'hi', 'language_name' => 'Hindi'],
            ['language_code' => 'th', 'language_name' => 'Thai'],
            ['language_code' => 'vi', 'language_name' => 'Vietnamese'],
            ['language_code' => 'nl', 'language_name' => 'Dutch'],
            ['language_code' => 'pl', 'language_name' => 'Polish'],
            ['language_code' => 'tr', 'language_name' => 'Turkish'],
            ['language_code' => 'sv', 'language_name' => 'Swedish'],
        ];
    }

    /**
     * Perform search request
     */
    protected function search(array $params): array
    {
        try {
            $headers = [
                'Accept' => 'application/json',
            ];

            // Add API key if available
            if ($this->apiKey) {
                $headers['Api-Key'] = $this->apiKey;
            }

            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->get($this->baseUrl, $params);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['status']) && $data['status'] === true && isset($data['subtitles'])) {
                    return $this->formatResults($data['subtitles']);
                }

                Log::info('SubDL search response', ['data' => $data]);
                return [];
            }

            Log::warning('SubDL search failed', [
                'params' => $params,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('SubDL search error', [
                'params' => $params,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Format search results for frontend
     */
    protected function formatResults(array $data): array
    {
        $results = [];

        foreach ($data as $item) {
            $results[] = [
                'id' => $item['sd_id'] ?? null,
                'file_id' => $item['sd_id'] ?? null,
                'file_name' => $item['release_name'] ?? $item['name'] ?? 'Unknown',
                'language' => $item['lang'] ?? 'Unknown',
                'language_name' => $this->getLanguageName($item['lang'] ?? ''),
                'release' => $item['release_name'] ?? '',
                'download_count' => $item['download_count'] ?? 0,
                'ratings' => $item['rating'] ?? 0,
                'from_trusted' => ($item['author']['uploader_badge'] ?? '') === 'trusted',
                'hearing_impaired' => $item['hi'] ?? false,
                'uploader' => $item['author']['name'] ?? 'Anonymous',
                'fps' => null,
                // SubDL provides direct download URL
                'download_url' => isset($item['url']) ? 'https://dl.subdl.com' . $item['url'] : null,
                'subtitle_page' => $item['subtitlePage'] ?? null,
            ];
        }

        // Sort by download count (popularity)
        usort($results, function ($a, $b) {
            return $b['download_count'] <=> $a['download_count'];
        });

        return $results;
    }

    /**
     * Get language name from code
     */
    protected function getLanguageName(string $code): string
    {
        $languages = [
            'en' => 'English',
            'id' => 'Indonesian',
            'ms' => 'Malay',
            'es' => 'Spanish',
            'fr' => 'French',
            'de' => 'German',
            'it' => 'Italian',
            'pt' => 'Portuguese',
            'ru' => 'Russian',
            'ja' => 'Japanese',
            'ko' => 'Korean',
            'zh' => 'Chinese',
            'ar' => 'Arabic',
            'hi' => 'Hindi',
            'th' => 'Thai',
            'vi' => 'Vietnamese',
            'nl' => 'Dutch',
            'pl' => 'Polish',
            'tr' => 'Turkish',
            'sv' => 'Swedish',
            'fa' => 'Persian',
            'he' => 'Hebrew',
            'ro' => 'Romanian',
            'el' => 'Greek',
            'hu' => 'Hungarian',
            'cs' => 'Czech',
            'bg' => 'Bulgarian',
        ];

        return $languages[$code] ?? ucfirst($code);
    }
}
