<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StreamProxyController extends Controller
{
    private const NETMIRROR_BASE = 'https://net51.cc';
    private const NETMIRROR_BASE_HOST = 'net51.cc';

    /**
     * Proxy HLS playlist/segment requests to bypass CORS
     */
    public function proxy(Request $request)
    {
        $url = $request->query('url');

        if (empty($url)) {
            return response()->json(['error' => 'URL required'], 400);
        }

        // Fix malformed URLs with triple slashes (https:///)
        // This happens when host is missing from URL
        if (preg_match('#^https?:///(.+)$#', $url, $matches)) {
            // URL like "https:///files/..." should become "https://net51.cc/files/..."
            $url = self::NETMIRROR_BASE . '/' . ltrim($matches[1], '/');
            Log::debug('Fixed malformed URL', ['original' => $request->query('url'), 'fixed' => $url]);
        }

        // Handle relative URLs starting with /
        if (str_starts_with($url, '/')) {
            $url = self::NETMIRROR_BASE . $url;
        }

        try {
            // Determine appropriate Referer based on target URL
            $parsed = parse_url($url);
            $targetHost = $parsed['host'] ?? 'net51.cc';
            $referer = 'https://' . $targetHost . '/';

            // For CDN requests, use net51.cc as referer (the origin)
            if (str_contains($targetHost, 'freecdn') || str_contains($targetHost, 'cdn')) {
                $referer = 'https://net51.cc/';
            }

            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => '*/*',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Referer' => $referer,
                'Origin' => 'https://net51.cc',
            ])->timeout(30)->get($url);

            if (!$response->successful()) {
                Log::warning('Stream proxy failed', ['url' => $url, 'status' => $response->status(), 'referer' => $referer]);
                return response()->json(['error' => 'Failed to fetch', 'status' => $response->status()], 502);
            }

            $contentType = $response->header('Content-Type') ?? 'application/octet-stream';
            $body = $response->body();

            // If it's an M3U8 playlist, rewrite URLs to use proxy
            if (
                str_contains($contentType, 'mpegurl') ||
                str_contains($contentType, 'x-mpegURL') ||
                str_ends_with(parse_url($url, PHP_URL_PATH) ?? '', '.m3u8')
            ) {
                $body = $this->rewritePlaylist($body, $url);
                $contentType = 'application/vnd.apple.mpegurl';
            }

            return response($body)
                ->header('Content-Type', $contentType)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                ->header('Access-Control-Allow-Headers', '*');

        } catch (\Exception $e) {
            Log::error('Stream proxy error', ['url' => $url, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Proxy error'], 500);
        }
    }

    /**
     * Rewrite relative URLs in M3U8 playlist to use proxy
     * Only M3U8 files go through proxy, .ts segments are accessed directly
     */
    private function rewritePlaylist(string $content, string $baseUrl): string
    {
        // Parse base URL to get host and path
        $parsed = parse_url($baseUrl);

        // Handle empty or missing host explicitly (not just null)
        $scheme = !empty($parsed['scheme']) ? $parsed['scheme'] : 'https';
        $host = !empty($parsed['host']) ? $parsed['host'] : self::NETMIRROR_BASE_HOST;
        $baseHost = $scheme . '://' . $host;
        $basePath = dirname($parsed['path'] ?? '/');

        Log::debug('Rewriting playlist', ['baseUrl' => $baseUrl, 'baseHost' => $baseHost, 'basePath' => $basePath]);

        // FIX: NetMirror returns malformed URLs like "https:///files/..." 
        // Replace all occurrences of https:/// or http:/// with correct base
        $content = preg_replace('#https?:///([^"\s]+)#', self::NETMIRROR_BASE . '/$1', $content);

        $lines = explode("\n", $content);
        $result = [];

        foreach ($lines as $line) {
            $line = trim($line);

            if (empty($line)) {
                $result[] = $line;
                continue;
            }

            // Handle EXT tags with URI (like encryption keys and audio tracks)
            if (str_starts_with($line, '#') && preg_match('/URI="([^"]+)"/', $line, $matches)) {
                $uri = $this->resolveUrl($matches[1], $baseHost, $basePath);
                // Proxy all URIs through our server
                $proxyUrl = url('/api/stream/proxy?url=' . urlencode($uri));
                $line = str_replace($matches[1], $proxyUrl, $line);
                $result[] = $line;
                continue;
            }

            // Skip other comments/tags
            if (str_starts_with($line, '#')) {
                $result[] = $line;
                continue;
            }

            // Handle segment/playlist URLs
            $segmentUrl = $this->resolveUrl($line, $baseHost, $basePath);

            // Proxy ALL M3U8 files through our server
            if (str_contains($segmentUrl, '.m3u8')) {
                $result[] = url('/api/stream/proxy?url=' . urlencode($segmentUrl));
            } else {
                // Use direct URL for .ts segments only
                $result[] = $segmentUrl;
            }
        }

        return implode("\n", $result);
    }

    /**
     * Resolve relative URL to absolute using NetMirror base
     */
    private function resolveUrl(string $url, string $baseHost, string $basePath): string
    {
        // Already absolute URL - return as-is
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        // Absolute path (starts with /) - prepend base host only
        if (str_starts_with($url, '/')) {
            return $baseHost . $url;
        }

        // Relative path - prepend base host and base path
        return $baseHost . $basePath . '/' . $url;
    }

    /**
     * Get proxied stream URL for NetMirror content
     */
    public function getProxiedStream(Request $request)
    {
        $id = $request->query('id');

        if (empty($id)) {
            return response()->json(['success' => false, 'error' => 'ID required'], 400);
        }

        try {
            $scraperApi = app(\App\Services\ScraperApiService::class);
            $streamData = $scraperApi->getStream($id);

            if (!$streamData) {
                return response()->json(['success' => false, 'error' => 'Stream not found'], 404);
            }

            Log::info('Stream API response', ['data' => $streamData]);

            $hlsUrl = null;
            $title = 'NetMirror';
            $sources = [];

            // Check if sources are directly in API response
            $data = $streamData['data'] ?? $streamData;

            if (isset($data['sources']) && is_array($data['sources'])) {
                // Sources directly available
                $sources = $data['sources'];
                $title = $data['title'] ?? 'NetMirror';
            } elseif (isset($data['playlistUrl'])) {
                // Need to fetch playlist.php
                $playlistPhpUrl = $data['playlistUrl'];

                $playlistResponse = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer' => 'https://net20.cc/',
                ])->timeout(30)->get($playlistPhpUrl);

                if ($playlistResponse->successful()) {
                    $playlistData = $playlistResponse->json();
                    Log::info('Playlist data', ['data' => $playlistData]);

                    // Handle array or object response
                    if (is_array($playlistData) && isset($playlistData[0])) {
                        $item = $playlistData[0];
                        $title = $item['title'] ?? 'NetMirror';
                        $sources = $item['sources'] ?? [];
                    } elseif (isset($playlistData['sources'])) {
                        $title = $playlistData['title'] ?? 'NetMirror';
                        $sources = $playlistData['sources'];
                    }
                }
            }

            // Extract HLS URL from sources
            foreach ($sources as $source) {
                if (isset($source['file'])) {
                    $file = $source['file'];
                    if (str_starts_with($file, 'http://') || str_starts_with($file, 'https://')) {
                        $hlsUrl = $file;
                    } elseif (str_starts_with($file, '/')) {
                        $hlsUrl = self::NETMIRROR_BASE . $file;
                    } else {
                        $hlsUrl = self::NETMIRROR_BASE . '/' . $file;
                    }
                    break; // Take first source
                }
            }

            if (!$hlsUrl) {
                Log::warning('No HLS source', ['sources' => $sources, 'data' => $data]);
                return response()->json(['success' => false, 'error' => 'No HLS source found'], 404);
            }

            Log::info('HLS URL found', ['url' => $hlsUrl]);

            // Return proxied HLS URL
            $proxiedUrl = url('/api/stream/proxy?url=' . urlencode($hlsUrl));

            return response()->json([
                'success' => true,
                'data' => [
                    'playlistUrl' => $proxiedUrl,
                    'originalUrl' => $hlsUrl,
                    'title' => $title,
                    'sources' => $sources,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Proxied stream error', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
}
