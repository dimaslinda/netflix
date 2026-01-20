<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenSubtitlesService
{
    protected $baseUrl = 'https://api.opensubtitles.com/api/v1';
    protected $apiKey;
    protected $username;
    protected $password;

    public function __construct()
    {
        $this->apiKey = config('services.opensubtitles.api_key');
        $this->username = config('services.opensubtitles.username');
        $this->password = config('services.opensubtitles.password');
    }

    /**
     * Get authentication token for downloads
     */
    protected function getAuthToken(): ?string
    {
        if (empty($this->apiKey) || empty($this->username) || empty($this->password)) {
            return null;
        }

        return Cache::remember('opensubtitles_token', 3600, function () {
            try {
                $response = Http::withHeaders([
                    'Api-Key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])->post("{$this->baseUrl}/login", [
                            'username' => $this->username,
                            'password' => $this->password,
                        ]);

                if ($response->successful()) {
                    $data = $response->json();
                    return $data['token'] ?? null;
                }

                Log::warning('OpenSubtitles login failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            } catch (\Exception $e) {
                Log::error('OpenSubtitles login error', ['error' => $e->getMessage()]);
                return null;
            }
        });
    }

    /**
     * Search for subtitles by TMDB ID
     */
    public function searchByTmdbId(string $tmdbId, string $type = 'movie', ?int $season = null, ?int $episode = null, ?string $language = null): array
    {
        $cacheKey = "opensubtitles_tmdb_{$type}_{$tmdbId}_{$season}_{$episode}_{$language}";

        return Cache::remember($cacheKey, 3600, function () use ($tmdbId, $type, $season, $episode, $language) {
            $params = [
                'tmdb_id' => $tmdbId,
                'type' => $type === 'tv' ? 'episode' : 'movie',
            ];

            if ($type === 'tv' && $season !== null) {
                $params['season_number'] = $season;
            }

            if ($type === 'tv' && $episode !== null) {
                $params['episode_number'] = $episode;
            }

            // Filter by language if specified
            if ($language) {
                $params['languages'] = $language;
            }

            return $this->search($params);
        });
    }

    /**
     * Search for subtitles by IMDB ID
     */
    public function searchByImdbId(string $imdbId, ?string $language = null): array
    {
        $cacheKey = "opensubtitles_imdb_{$imdbId}_{$language}";

        return Cache::remember($cacheKey, 3600, function () use ($imdbId, $language) {
            $params = [
                'imdb_id' => $imdbId,
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
            'query' => $query,
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
    public function getDownloadLink(int $fileId): ?array
    {
        if (empty($this->apiKey)) {
            return $this->getMockDownloadLink($fileId);
        }

        // Get auth token for download
        $token = $this->getAuthToken();

        try {
            $headers = [
                'Api-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ];

            // Add bearer token if available
            if ($token) {
                $headers['Authorization'] = "Bearer {$token}";
            }

            $response = Http::withHeaders($headers)->post("{$this->baseUrl}/download", [
                'file_id' => $fileId,
                'sub_format' => 'webvtt',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('OpenSubtitles download success', ['file_id' => $fileId, 'data' => $data]);
                return $data;
            }

            // Log the actual error for debugging
            Log::warning('OpenSubtitles download failed', [
                'file_id' => $fileId,
                'status' => $response->status(),
                'body' => $response->body(),
                'has_token' => !empty($token),
            ]);

            // Return error info instead of null for better debugging
            return [
                'error' => true,
                'status' => $response->status(),
                'message' => $response->json()['message'] ?? 'Download failed',
            ];
        } catch (\Exception $e) {
            Log::error('OpenSubtitles download error', [
                'file_id' => $fileId,
                'error' => $e->getMessage(),
            ]);
            return [
                'error' => true,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get available subtitle languages
     */
    public function getAvailableLanguages(): array
    {
        return Cache::remember('opensubtitles_languages', 86400, function () {
            if (empty($this->apiKey)) {
                return $this->getMockLanguages();
            }

            try {
                $response = Http::withHeaders([
                    'Api-Key' => $this->apiKey,
                ])->get("{$this->baseUrl}/infos/languages");

                if ($response->successful()) {
                    return $response->json()['data'] ?? [];
                }
            } catch (\Exception $e) {
                Log::error('OpenSubtitles languages error', ['error' => $e->getMessage()]);
            }

            return $this->getMockLanguages();
        });
    }

    /**
     * Perform search request
     */
    protected function search(array $params): array
    {
        if (empty($this->apiKey)) {
            return $this->getMockSubtitles($params);
        }

        try {
            $response = Http::withHeaders([
                'Api-Key' => $this->apiKey,
            ])->get("{$this->baseUrl}/subtitles", $params);

            if ($response->successful()) {
                $data = $response->json();
                return $this->formatResults($data['data'] ?? []);
            }

            Log::warning('OpenSubtitles search failed', [
                'params' => $params,
                'status' => $response->status(),
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('OpenSubtitles search error', [
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
            $attributes = $item['attributes'] ?? [];
            $files = $attributes['files'] ?? [];

            foreach ($files as $file) {
                $results[] = [
                    'id' => $item['id'] ?? null,
                    'file_id' => $file['file_id'] ?? null,
                    'file_name' => $file['file_name'] ?? 'Unknown',
                    'language' => $attributes['language'] ?? 'Unknown',
                    'language_name' => $this->getLanguageName($attributes['language'] ?? ''),
                    'release' => $attributes['release'] ?? '',
                    'download_count' => $attributes['download_count'] ?? 0,
                    'ratings' => $attributes['ratings'] ?? 0,
                    'from_trusted' => $attributes['from_trusted'] ?? false,
                    'hearing_impaired' => $attributes['hearing_impaired'] ?? false,
                    'uploader' => $attributes['uploader']['name'] ?? 'Anonymous',
                    'fps' => $attributes['fps'] ?? null,
                ];
            }
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
        ];

        return $languages[$code] ?? ucfirst($code);
    }

    /**
     * Mock subtitles when API key is not available
     */
    protected function getMockSubtitles(array $params): array
    {
        $mockLanguages = ['en', 'id', 'es', 'fr', 'de'];
        $results = [];

        foreach ($mockLanguages as $lang) {
            $results[] = [
                'id' => random_int(10000, 99999),
                'file_id' => random_int(100000, 999999),
                'file_name' => "subtitle_{$lang}.srt",
                'language' => $lang,
                'language_name' => $this->getLanguageName($lang),
                'release' => 'MOCK.RELEASE.720p.WEB-DL',
                'download_count' => random_int(1000, 50000),
                'ratings' => random_int(0, 10),
                'from_trusted' => $lang === 'en',
                'hearing_impaired' => false,
                'uploader' => 'MockUploader',
                'fps' => 23.976,
            ];
        }

        return $results;
    }

    /**
     * Mock download link result
     */
    protected function getMockDownloadLink(int $fileId): array
    {
        return [
            'link' => "https://dl.opensubtitles.org/en/download/sub/{$fileId}",
            'file_name' => "subtitle_{$fileId}.vtt",
            'requests' => 1,
            'remaining' => 19,
            'message' => 'Mock download link - configure OpenSubtitles credentials in .env for real subtitles',
        ];
    }

    /**
     * Mock languages
     */
    protected function getMockLanguages(): array
    {
        return [
            ['language_code' => 'en', 'language_name' => 'English'],
            ['language_code' => 'id', 'language_name' => 'Indonesian'],
            ['language_code' => 'es', 'language_name' => 'Spanish'],
            ['language_code' => 'fr', 'language_name' => 'French'],
            ['language_code' => 'de', 'language_name' => 'German'],
            ['language_code' => 'it', 'language_name' => 'Italian'],
            ['language_code' => 'pt', 'language_name' => 'Portuguese'],
            ['language_code' => 'ja', 'language_name' => 'Japanese'],
            ['language_code' => 'ko', 'language_name' => 'Korean'],
            ['language_code' => 'zh', 'language_name' => 'Chinese'],
        ];
    }
}
