<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Support\Playback\StreamSource;

/**
 * Kontrak tunggal untuk setiap asal tontonan.
 *
 * Menambah sumber baru berarti menambah satu implementasi, tanpa menyentuh
 * controller atau frontend. Pemutar hanya tahu StreamSource, tidak tahu asalnya.
 */
interface StreamResolver
{
    /** Kunci stabil yang dipakai frontend untuk meminta sumber tertentu. */
    public function provider(): string;

    /** Nama yang tampil di pemilih sumber. */
    public function label(): string;

    /**
     * Kembalikan null bila referensi tidak dikenal atau berkas tidak layak putar.
     * Jangan melempar exception untuk kasus "tidak ketemu" — itu keadaan normal.
     *
     * @param  array<string, string>  $options
     */
    public function resolve(string $reference, array $options = []): ?StreamSource;
}
