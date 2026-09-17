<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScraperApiService
{
    protected string $baseUrl;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.scraper_api.url', 'https://scraperapi-murex.vercel.app');
        $this->apiKey = config('services.scraper_api.key');
    }

    /**
     * Search for content on NetMirror
     */
    public function searchNetMirror(string $query): array
    {
        $cacheKey = "netmirror_search_" . md5($query);

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            try {
                $response = Http::withHeaders($this->getHeaders())
                    ->timeout(30)
                    ->get("{$this->baseUrl}/api/netmirror/search", [
                        'q' => $query,
                    ]);

                if ($response->successful()) {
                    $data = $response->json();

                    Log::info('ScraperAPI search response', ['data' => $data]);

                    // Handle different response structures
                    if (isset($data['success']) && $data['success']) {
                        // API returns { success: true, data: {...} }
                        $searchResults = $data['data'] ?? [];

                        // Check if searchResults contains the actual results
                        if (isset($searchResults['searchResults'])) {
                            $results = $searchResults['searchResults'];
                            // If it's an associative array with 'head' and other fields, extract items
                            if (isset($results['items'])) {
                                return $results['items'];
                            }
                            // Return as-is if it's already an array of items
                            if (is_array($results) && !isset($results['head'])) {
                                return $results;
                            }
                        }

                        // Return raw data if it's an array
                        if (is_array($searchResults) && !isset($searchResults['searchUrl'])) {
                            return $searchResults;
                        }
                    }

                    // Fallback: return raw response if it's an array
                    if (is_array($data) && !isset($data['success'])) {
                        return $data;
                    }

                    return [];
                }

                Log::warning('ScraperAPI search failed', [
                    'query' => $query,
                    'status' => $response->status(),
                ]);

                return [];
            } catch (\Exception $e) {
                Log::error('ScraperAPI search error', [
                    'query' => $query,
                    'error' => $e->getMessage(),
                ]);
                return [];
            }
        });
    }

    /**
     * Get post details from NetMirror
     */
    public function getPost(string $id): ?array
    {
        $cacheKey = "netmirror_post_{$id}";

        return Cache::remember($cacheKey, 1800, function () use ($id) {
            try {
                $response = Http::withHeaders($this->getHeaders())
                    ->timeout(30)
                    ->get("{$this->baseUrl}/api/netmirror/getpost", [
                        'id' => $id,
                    ]);

                if ($response->successful()) {
                    return $response->json();
                }

                return null;
            } catch (\Exception $e) {
                Log::error('ScraperAPI getPost error', [
                    'id' => $id,
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }

    /**
     * Get stream URLs from NetMirror
     */
    public function getStream(string $id): ?array
    {
        // Don't cache stream URLs as they might expire
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(30)
                ->get("{$this->baseUrl}/api/netmirror/stream", [
                    'id' => $id,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('ScraperAPI stream response', ['data' => $data]);
                return $data;
            }

            Log::warning('ScraperAPI getStream failed', [
                'id' => $id,
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ScraperAPI getStream error', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Search and find best match for a movie/show title
     */
    public function findByTitle(string $title, ?int $year = null): ?array
    {
        $searchQuery = $title;
        if ($year) {
            $searchQuery .= " {$year}";
        }

        $results = $this->searchNetMirror($searchQuery);

        if (empty($results)) {
            return null;
        }

        // Try to find best match
        $normalizedTitle = strtolower(trim($title));

        foreach ($results as $result) {
            $resultTitle = strtolower(trim($result['title'] ?? $result['name'] ?? ''));

            // Exact match
            if ($resultTitle === $normalizedTitle) {
                return $result;
            }

            // Contains match
            if (str_contains($resultTitle, $normalizedTitle) || str_contains($normalizedTitle, $resultTitle)) {
                return $result;
            }
        }

        // Return first result as fallback
        return $results[0] ?? null;
    }

    /**
     * Get headers for API requests
     */
    protected function getHeaders(): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($this->apiKey) {
            $headers['x-api-key'] = $this->apiKey;
        }

        return $headers;
    }
}
