<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Playback\LocalLibraryResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan berkas video dari pustaka lokal dengan dukungan HTTP Range.
 *
 * Tanpa Range, browser hanya bisa memutar dari awal dan seek akan memuat ulang
 * seluruh berkas. Dengan Range, seek pada berkas 20 GB hanya memindahkan offset.
 * Pengiriman memakai potongan tetap supaya memori PHP tidak ikut membesar.
 */
final class LocalMediaController extends Controller
{
    public function __construct(private readonly LocalLibraryResolver $library) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->library->listLibrary(),
        ]);
    }

    public function stream(Request $request): Response
    {
        $reference = (string) $request->query('path', '');
        $path = $this->library->resolvePath($reference);

        if ($path === null) {
            abort(404, 'Berkas tidak ada di dalam pustaka.');
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeType = $this->library->allowedExtensions()[$extension] ?? null;

        if ($mimeType === null) {
            abort(415, 'Format berkas tidak didukung pemutar.');
        }

        $size = filesize($path);

        if ($size === false) {
            abort(500, 'Ukuran berkas tidak terbaca.');
        }

        [$start, $end] = $this->resolveRange($request->header('Range'), $size);

        if ($start === null) {
            return response('', Response::HTTP_REQUESTED_RANGE_NOT_SATISFIABLE, [
                'Content-Range' => "bytes */{$size}",
            ]);
        }

        $isPartial = $request->hasHeader('Range');
        $length = $end - $start + 1;

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $length,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'private, max-age=3600',
        ];

        if ($isPartial) {
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
        }

        return new StreamedResponse(
            fn () => $this->sendFileRange($path, $start, $length),
            $isPartial ? Response::HTTP_PARTIAL_CONTENT : Response::HTTP_OK,
            $headers,
        );
    }

    /**
     * Terjemahkan header Range menjadi offset absolut.
     *
     * Hanya satu rentang yang didukung. Rentang majemuk ditolak karena tidak
     * ada pemutar browser yang memintanya, dan multipart/byteranges hanya akan
     * menambah permukaan bug.
     *
     * @return array{0: int|null, 1: int}  [null, 0] berarti rentang tidak sah
     */
    private function resolveRange(?string $header, int $size): array
    {
        if ($size === 0) {
            return [null, 0];
        }

        if ($header === null || $header === '') {
            return [0, $size - 1];
        }

        if (preg_match('/^bytes=(\d*)-(\d*)$/', trim($header), $matches) !== 1) {
            return [null, 0];
        }

        [, $rawStart, $rawEnd] = $matches;

        // Bentuk sufiks "bytes=-500": 500 byte terakhir.
        if ($rawStart === '') {
            if ($rawEnd === '') {
                return [null, 0];
            }

            $length = min((int) $rawEnd, $size);

            return $length === 0 ? [null, 0] : [$size - $length, $size - 1];
        }

        $start = (int) $rawStart;
        $end = $rawEnd === '' ? $size - 1 : (int) $rawEnd;

        if ($start > $end || $start >= $size) {
            return [null, 0];
        }

        return [$start, min($end, $size - 1)];
    }

    private function sendFileRange(string $path, int $start, int $length): void
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            return;
        }

        try {
            fseek($handle, $start);
            $chunkSize = (int) config('media.chunk_size', 512 * 1024);
            $remaining = $length;

            while ($remaining > 0 && ! feof($handle)) {
                $buffer = fread($handle, min($chunkSize, $remaining));

                if ($buffer === false || $buffer === '') {
                    break;
                }

                echo $buffer;
                $remaining -= strlen($buffer);
                flush();

                // Pemirsa yang menutup tab tidak boleh menyisakan proses PHP
                // yang terus membaca berkas sampai selesai.
                if (connection_aborted() === 1) {
                    break;
                }
            }
        } finally {
            fclose($handle);
        }
    }
}
