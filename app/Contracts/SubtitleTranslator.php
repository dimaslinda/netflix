<?php

declare(strict_types=1);

namespace App\Contracts;

/**
 * Mesin penerjemah takarir.
 *
 * Dipisah jadi kontrak karena pilihan mesinnya soal selera dan biaya, bukan
 * soal arsitektur. Bagian lain aplikasi tidak perlu tahu mesin mana yang aktif.
 */
interface SubtitleTranslator
{
    /** False berarti terjemahan otomatis dimatikan atau belum dikonfigurasi. */
    public function isAvailable(): bool;

    /** Nama mesin, untuk ditampilkan di antarmuka dan dicatat di log. */
    public function name(): string;

    /**
     * Terjemahkan sekumpulan teks sekaligus.
     *
     * Kembalikan array dengan panjang dan urutan yang sama seperti masukan.
     * Untuk potongan yang gagal, kembalikan teks aslinya, jangan string kosong:
     * takarir yang sebagian asli masih jauh lebih berguna daripada yang bolong.
     *
     * @param  array<int, string>  $texts
     * @return array<int, string>
     */
    public function translate(array $texts, string $from, string $to): array;
}
