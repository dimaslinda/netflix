<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Akar Pustaka Lokal
    |--------------------------------------------------------------------------
    |
    | Folder berisi berkas video milik Anda sendiri. Pemutar menyajikan berkas
    | dari sini secara langsung, tanpa iframe pihak ketiga dan tanpa iklan.
    | Isi MEDIA_LIBRARY_PATH di .env bila pustaka ada di drive atau NAS lain.
    |
    */

    'library_path' => env('MEDIA_LIBRARY_PATH', storage_path('app/media')),

    /*
    |--------------------------------------------------------------------------
    | Ekstensi yang Diputar
    |--------------------------------------------------------------------------
    |
    | Hanya wadah yang bisa dibaca <video> di browser modern. MKV sengaja tidak
    | ada: Chrome menolaknya tanpa transcode, dan transcode di luar cakupan ini.
    |
    */

    'extensions' => [
        'mp4' => 'video/mp4',
        'm4v' => 'video/mp4',
        'webm' => 'video/webm',
        'ogv' => 'video/ogg',
        'm3u8' => 'application/vnd.apple.mpegurl',
    ],

    /*
    |--------------------------------------------------------------------------
    | Ukuran Potongan Streaming
    |--------------------------------------------------------------------------
    |
    | Besar blok yang dikirim per iterasi saat melayani permintaan Range.
    | 512 KB menahan penggunaan memori tetap rata walau berkas berukuran puluhan GB.
    |
    */

    'chunk_size' => 512 * 1024,

];
