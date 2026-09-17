<?php

declare(strict_types=1);

namespace App\Services\Subtitle;

use App\Contracts\SubtitleTranslator;

/**
 * Dipakai saat terjemahan otomatis dimatikan.
 *
 * Mengembalikan teks asli tanpa perubahan, jadi pemanggil tidak perlu menulis
 * cabang khusus untuk keadaan "tidak ada mesin penerjemah".
 */
final class NullSubtitleTranslator implements SubtitleTranslator
{
    public function isAvailable(): bool
    {
        return false;
    }

    public function name(): string
    {
        return 'nonaktif';
    }

    public function translate(array $texts, string $from, string $to): array
    {
        return $texts;
    }
}
