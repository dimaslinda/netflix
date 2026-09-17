<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Bahasa Takarir
    |--------------------------------------------------------------------------
    |
    | Bahasa yang wajib tersedia untuk setiap tontonan, dan bahasa cadangan
    | yang dicari lebih dulu bila bahasa utama tidak ditemukan di penyedia.
    |
    */

    'target_language' => env('SUBTITLE_TARGET_LANGUAGE', 'id'),

    'fallback_languages' => ['en'],

    /*
    |--------------------------------------------------------------------------
    | Mesin Penerjemah
    |--------------------------------------------------------------------------
    |
    | Dipakai hanya bila takarir bahasa utama tidak ada di penyedia mana pun.
    |
    | "null"          : matikan terjemahan otomatis. Takarir cadangan disajikan
    |                   apa adanya dalam bahasa aslinya.
    | "libretranslate": mesin sumber terbuka (AGPL) yang Anda jalankan sendiri.
    |                   Jalankan dengan Docker, lalu isi SUBTITLE_TRANSLATOR_URL.
    |
    */

    'translator' => env('SUBTITLE_TRANSLATOR', 'null'),

    'libretranslate' => [
        'url' => env('SUBTITLE_TRANSLATOR_URL', 'http://localhost:5000'),
        'api_key' => env('SUBTITLE_TRANSLATOR_KEY'),

        // Jumlah cue per permintaan. Terlalu besar membuat permintaan gagal
        // karena batas ukuran badan; terlalu kecil membuat terjemahan lambat.
        'batch_size' => 40,

        'timeout' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Masa Simpan Cache
    |--------------------------------------------------------------------------
    |
    | Menerjemahkan satu film butuh ratusan permintaan ke mesin penerjemah.
    | Hasilnya disimpan lama supaya biaya itu dibayar sekali saja per judul.
    |
    */

    'cache_ttl' => 60 * 60 * 24 * 30,

];
