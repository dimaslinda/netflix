<?php

declare(strict_types=1);

namespace App\Support\Catalog;

/**
 * Membersihkan judul mentah Internet Archive supaya bisa dicari di TMDB.
 *
 * Judul di Archive ditulis pengunggah, bukan katalogis, jadi isinya bercampur
 * tahun, nama pemeran, dan penanda teknis. Contoh nyata dari koleksi mereka:
 *
 *   "1940 Das Leichte Madchen ( Willy Fritsch, Max Gulstorff, Paul Kemp)"
 *   "Elephants Dream 1080p h264/h265/h266 aac"
 *   "Big Buck Bunny 4k With Captions"
 *
 * Tanpa pembersihan, pencarian TMDB untuk judul semacam itu selalu nihil.
 */
final readonly class ArchiveTitle
{
    private function __construct(
        public string $clean,
        public ?int $year,
    ) {}

    /** Penanda teknis dan sisa antarmuka yang tidak pernah bagian dari judul. */
    private const NOISE = [
        '4k', '2160p', '1080p', '720p', '480p', '360p',
        'h264', 'h265', 'h266', 'x264', 'x265', 'avc', 'hevc',
        'aac', 'ac3', 'mp3', 'mp4', 'mkv', 'avi', 'xvid', 'divx', 'ogv', 'webm',
        'hd', 'hq', 'sd', 'dvd', 'vhs', 'bluray', 'brrip', 'dvdrip', 'webrip',
        'remastered', 'restored', 'colorized', 'uncut',
        'full movie', 'full length', 'complete movie',
        'with captions', 'with subtitles', 'english subtitles',
        'free download borrow and streaming internet archive',
        'free download', 'internet archive', 'archive org',
        'public domain', 'silent film', 'official',
    ];

    public static function parse(string $raw, ?string $yearHint = null): self
    {
        $title = str_replace(['_', '/'], ' ', $raw);

        // Tahun bisa muncul di depan judul, di dalam kurung, atau di kolom
        // metadata terpisah. Yang pertama ketemu dipakai, lalu dibuang dari
        // judul supaya tidak ikut jadi kata kunci pencarian.
        $year = self::extractYear($title) ?? self::toYear($yearHint);

        $title = preg_replace('/^\s*(18|19|20)\d{2}\s+/', '', $title) ?? $title;
        $title = preg_replace('/\([^)]*\)/', ' ', $title) ?? $title;
        $title = preg_replace('/\[[^\]]*\]/', ' ', $title) ?? $title;

        $title = self::stripNoise($title);

        // Sisa tanda baca di tepi muncul setelah kurung dibuang.
        $title = trim(preg_replace('/\s+/', ' ', $title) ?? $title);
        $title = trim($title, " \t\n\r\0\x0B-,.:;|");

        return new self($title, $year);
    }

    /**
     * Bentuk banding untuk menilai kemiripan dua judul.
     *
     * Huruf besar, tanda baca, dan kata sandang di depan dibuang supaya
     * "The Kid" dan "kid, the" dinilai sama.
     */
    public static function comparable(string $title): string
    {
        $value = mb_strtolower($title);
        $value = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $value) ?? $value;
        $value = preg_replace('/^(the|a|an)\s+/', '', trim($value)) ?? $value;
        $value = preg_replace('/\s+(the|a|an)$/', '', $value) ?? $value;

        return trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    }

    private static function stripNoise(string $title): string
    {
        foreach (self::NOISE as $noise) {
            $title = preg_replace(
                '/(?<![\p{L}\p{N}])'.preg_quote($noise, '/').'(?![\p{L}\p{N}])/iu',
                ' ',
                $title,
            ) ?? $title;
        }

        return $title;
    }

    private static function extractYear(string $title): ?int
    {
        if (preg_match('/\b(18|19|20)\d{2}\b/', $title, $matches) === 1) {
            return (int) $matches[0];
        }

        return null;
    }

    private static function toYear(?string $hint): ?int
    {
        if ($hint === null || preg_match('/\b(18|19|20)\d{2}\b/', $hint, $m) !== 1) {
            return null;
        }

        return (int) $m[0];
    }
}
