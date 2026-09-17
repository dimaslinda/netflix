<?php

declare(strict_types=1);

namespace App\Services\Subtitle;

use App\Contracts\SubtitleTranslator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Mesin penerjemah sumber terbuka yang dijalankan sendiri.
 *
 * LibreTranslate berlisensi AGPL dan bisa dijalankan lewat Docker, jadi tidak
 * ada teks takarir yang keluar ke layanan pihak ketiga.
 */
final class LibreTranslateTranslator implements SubtitleTranslator
{
    public function isAvailable(): bool
    {
        return $this->baseUrl() !== '';
    }

    public function name(): string
    {
        return 'LibreTranslate';
    }

    public function translate(array $texts, string $from, string $to): array
    {
        if ($texts === [] || ! $this->isAvailable()) {
            return $texts;
        }

        $batchSize = max(1, (int) config('subtitles.libretranslate.batch_size', 40));
        $translated = [];

        foreach (array_chunk($texts, $batchSize, true) as $chunk) {
            $result = $this->translateChunk(array_values($chunk), $from, $to);

            // Kunci asli dipertahankan supaya urutan cue tidak bergeser walau
            // ada potongan yang gagal diterjemahkan.
            $position = 0;

            foreach (array_keys($chunk) as $key) {
                $translated[$key] = $result[$position] ?? $chunk[$key];
                $position++;
            }
        }

        ksort($translated);

        return array_values($translated);
    }

    /**
     * @param  array<int, string>  $chunk
     * @return array<int, string>
     */
    private function translateChunk(array $chunk, string $from, string $to): array
    {
        try {
            $payload = [
                'q' => $chunk,
                'source' => $from,
                'target' => $to,
                'format' => 'text',
            ];

            $apiKey = config('subtitles.libretranslate.api_key');

            if (is_string($apiKey) && $apiKey !== '') {
                $payload['api_key'] = $apiKey;
            }

            $response = Http::timeout((int) config('subtitles.libretranslate.timeout', 60))
                ->acceptJson()
                ->post($this->baseUrl().'/translate', $payload);

            if (! $response->successful()) {
                Log::warning('LibreTranslate menolak permintaan', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 300),
                ]);

                return $chunk;
            }

            $translated = $response->json('translatedText');

            // Endpoint mengembalikan array bila masukannya array, dan string
            // bila masukannya satu teks.
            if (is_string($translated)) {
                return [$translated];
            }

            return is_array($translated) ? array_map(strval(...), $translated) : $chunk;
        } catch (Throwable $exception) {
            Log::warning('LibreTranslate tidak dapat dihubungi', [
                'error' => $exception->getMessage(),
            ]);

            return $chunk;
        }
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('subtitles.libretranslate.url', ''), '/');
    }
}
