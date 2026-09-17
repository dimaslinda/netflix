<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Katalog Film Terbuka
    |--------------------------------------------------------------------------
    |
    | Film berlisensi terbuka yang boleh diputar, digandakan, dan disajikan
    | ulang. Semuanya diinangi Internet Archive tanpa DRM, jadi pemutar internal
    | bisa memakai berkasnya langsung.
    |
    | Setiap entri memakai "identifier" Internet Archive. Berkas yang benar
    | dipilih saat dijalankan lewat ArchiveStreamResolver, jadi daftar ini tidak
    | pernah menyimpan URL berkas yang bisa basi.
    |
    | Tambah judul lain dengan menyalin bentuk yang sama. Entri yang identifier
    | atau turunannya tidak dapat diputar otomatis disembunyikan dari katalog.
    |
    */

    'titles' => [
        [
            'identifier' => 'Sintel_201809',
            'title' => 'Sintel',
            'year' => 2010,
            'license' => 'CC BY 3.0',
            'studio' => 'Blender Foundation',
        ],
        [
            'identifier' => 'tears-of-steel_202604',
            'title' => 'Tears of Steel',
            'year' => 2012,
            'license' => 'CC BY 3.0',
            'studio' => 'Blender Foundation',
        ],
        [
            'identifier' => 'big-buck-bunny_202406',
            'title' => 'Big Buck Bunny',
            'year' => 2008,
            'license' => 'CC BY 3.0',
            'studio' => 'Blender Foundation',
        ],
        [
            'identifier' => 'ed-1080p-h-264_265_266-aac',
            'title' => 'Elephants Dream',
            'year' => 2006,
            'license' => 'CC BY 2.5',
            'studio' => 'Blender Foundation',
        ],
        [
            'identifier' => 'cosmos-laundromat-first-cycle',
            'title' => 'Cosmos Laundromat: First Cycle',
            'year' => 2015,
            'license' => 'CC BY 4.0',
            'studio' => 'Blender Foundation',
        ],
    ],

];
