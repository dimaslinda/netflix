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
    public function searchByTmdbId(string $tmdbId, string $type = 'movie', ?int $season = null, ?int $episode = null, ?string $language = null, ?string $title = null): array
    {
        $cacheKey = "subdl_tmdb_{$type}_{$tmdbId}_{$season}_{$episode}_{$language}";

        $results = Cache::remember($cacheKey, 3600, function () use ($tmdbId, $type, $season, $episode, $language) {
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
                $params['languages'] = $this->getThreeLetterCode($language);
            }

            $params['subs_per_page'] = 30;

            return $this->search($params);
        });

        // Fallback to search by title if no results and title provided
        if (empty($results) && $title) {
            Log::info("SubDL: No results for TMDB ID $tmdbId, trying title: $title");
            return $this->searchByQuery($title, $language);
        }

        return $results;
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
                $params['languages'] = $this->getThreeLetterCode($language);
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
            $params['languages'] = $this->getThreeLetterCode($language);
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
        return [
            'link' => $url,
            'success' => true,
        ];
    }

    /**
     * Download and convert subtitle to VTT
     */
    public function downloadAndConvert(string $url): ?string
    {
        try {
            Log::info("SubDL: Downloading subtitle from $url");
            $response = Http::timeout(20)->get($url);

            if (!$response->successful()) {
                Log::error("SubDL: Failed to download subtitle", ['status' => $response->status()]);
                return null;
            }

            $content = $response->body();
            $filename = parse_url($url, PHP_URL_PATH);

            // Handle ZIP files
            if (str_ends_with($url, '.zip') || str_contains($response->header('Content-Type'), 'zip')) {
                $tempFile = tempnam(sys_get_temp_dir(), 'sub');
                file_put_contents($tempFile, $content);

                $zip = new \ZipArchive();
                if ($zip->open($tempFile) === true) {
                    // Find the first .srt or .vtt file
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $name = $zip->getNameIndex($i);
                        if (str_ends_with($name, '.srt') || str_ends_with($name, '.vtt')) {
                            $content = $zip->getFromIndex($i);
                            $filename = $name;
                            break;
                        }
                    }
                    $zip->close();
                }
                unlink($tempFile);
            }

            // Convert SRT to VTT if needed
            if (str_ends_with(strtolower($filename), '.srt') || !str_contains($content, 'WEBVTT')) {
                $content = $this->srtToVtt($content);
            }

            return $content;
        } catch (\Exception $e) {
            Log::error("SubDL: Error in downloadAndConvert: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Ubah SRT menjadi VTT.
     *
     * Implementasinya satu untuk seluruh aplikasi. Versi lama di kelas ini
     * membuang setiap baris yang isinya hanya angka, sehingga dialog berupa
     * angka ikut hilang dari takarir.
     */
    protected function srtToVtt(string $srt): string
    {
        return \App\Support\Subtitle\VttConverter::normalize($srt);
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
                'User-Agent' => 'Antigravity-Netflix-Clone/1.0',
            ];

            // Some versions of SubDL prefer the key in the URL, others in Header
            if ($this->apiKey) {
                $headers['Api-Key'] = $this->apiKey;
                $params['api_key'] = $this->apiKey; // Send in both to be safe
            }

            Log::info('SubDL Request:', ['url' => $this->baseUrl, 'params' => $params]);

            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->get($this->baseUrl, $params);

            if ($response->successful()) {
                $data = $response->json();

                // Add debug logging
                Log::info('SubDL Response Data:', ['data' => $data]);

                if (isset($data['status']) && $data['status'] === true && isset($data['subtitles'])) {
                    return $this->formatResults($data['subtitles']);
                }

                return [];
            }

            Log::error('SubDL search failed', [
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

    /**
     * Get 3-letter ISO code for SubDL
     */
    protected function getThreeLetterCode(string $code): string
    {
        $map = [
            'en' => 'eng',
            'id' => 'ind',
            'ms' => 'msa',
            'es' => 'spa',
            'fr' => 'fra',
            'de' => 'deu',
            'it' => 'ita',
            'pt' => 'por',
            'ru' => 'rus',
            'ja' => 'jpn',
            'ko' => 'kor',
            'zh' => 'chi',
            'ar' => 'ara',
            'hi' => 'hin',
            'th' => 'tha',
            'vi' => 'vie',
            'nl' => 'dut',
            'pl' => 'pol',
            'tr' => 'tur',
            'sv' => 'swe',
        ];

        return $map[$code] ?? $code;
    }
}
