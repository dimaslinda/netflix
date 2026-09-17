<?php

declare(strict_types=1);

namespace App\Support\Subtitle;

/**
 * Satu-satunya pengubah takarir di aplikasi ini.
 *
 * Sebelumnya logika SRT ke VTT ditulis ulang di beberapa kelas dan masing-masing
 * membawa bug sendiri. Semua pemanggil sekarang lewat sini.
 */
final class VttConverter
{
    /**
     * Ubah isi SRT atau VTT apa adanya menjadi VTT yang bersih.
     */
    public static function normalize(string $raw): string
    {
        $text = preg_replace('/^\xEF\xBB\xBF/', '', $raw) ?? $raw;
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        if (str_contains($text, 'WEBVTT')) {
            return trim($text);
        }

        // Samakan pemisah milidetik: 00:00:20,000 menjadi 00:00:20.000
        $text = preg_replace('/(\d{2}:\d{2}:\d{2}),(\d{3})/', '$1.$2', $text) ?? $text;

        $lines = explode("\n", $text);
        $kept = [];
        $total = count($lines);

        for ($index = 0; $index < $total; $index++) {
            $line = rtrim($lines[$index]);

            // Nomor urut SRT hanya dibuang bila baris sesudahnya benar-benar
            // baris waktu. Tanpa syarat ini, dialog yang isinya hanya angka
            // (misalnya sebuah tahun) ikut terhapus dari takarir.
            if (preg_match('/^\d+$/', trim($line)) === 1
                && isset($lines[$index + 1])
                && self::isTimingLine($lines[$index + 1])) {
                continue;
            }

            $kept[] = $line;
        }

        $body = preg_replace("/\n{3,}/", "\n\n", trim(implode("\n", $kept))) ?? '';

        return "WEBVTT\n\n".$body;
    }

    /**
     * Ambil teks dialog setiap cue, berurutan.
     *
     * Baris waktu dan nomor urut tidak ikut, jadi hasilnya aman dikirim ke
     * mesin penerjemah tanpa merusak penanda waktu.
     *
     * @return array<int, string>
     */
    public static function cueTexts(string $vtt): array
    {
        $texts = [];
        $buffer = [];
        $inCue = false;

        foreach (explode("\n", self::normalize($vtt)) as $line) {
            if (self::isTimingLine($line)) {
                if ($inCue && $buffer !== []) {
                    $texts[] = implode("\n", $buffer);
                }

                $buffer = [];
                $inCue = true;

                continue;
            }

            if (! $inCue) {
                continue;
            }

            if (trim($line) === '') {
                if ($buffer !== []) {
                    $texts[] = implode("\n", $buffer);
                    $buffer = [];
                }

                $inCue = false;

                continue;
            }

            $buffer[] = $line;
        }

        if ($inCue && $buffer !== []) {
            $texts[] = implode("\n", $buffer);
        }

        return $texts;
    }

    /**
     * Tulis ulang VTT dengan teks dialog pengganti, urutannya sama seperti
     * hasil cueTexts(). Cue yang tidak punya pengganti dibiarkan apa adanya,
     * jadi terjemahan yang gagal separuh tidak merusak berkas.
     *
     * @param  array<int, string>  $replacements
     */
    public static function replaceCueTexts(string $vtt, array $replacements): string
    {
        $output = [];
        $buffer = [];
        $inCue = false;
        $cursor = 0;

        $flush = function () use (&$output, &$buffer, &$cursor, $replacements): void {
            if ($buffer === []) {
                return;
            }

            $output[] = $replacements[$cursor] ?? implode("\n", $buffer);
            $cursor++;
            $buffer = [];
        };

        foreach (explode("\n", self::normalize($vtt)) as $line) {
            if (self::isTimingLine($line)) {
                $flush();
                $inCue = true;
                $output[] = $line;

                continue;
            }

            if (! $inCue) {
                $output[] = $line;

                continue;
            }

            if (trim($line) === '') {
                $flush();
                $inCue = false;
                $output[] = '';

                continue;
            }

            $buffer[] = $line;
        }

        $flush();

        return rtrim(implode("\n", $output))."\n";
    }

    /**
     * Baris waktu WebVTT, contoh: 00:00:20.000 --> 00:00:24.400
     */
    public static function isTimingLine(string $line): bool
    {
        return preg_match('/^\s*\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->/', $line) === 1;
    }
}
