<?php

namespace App\Services;

class LiveTvService
{
    /**
     * Kategori channel siaran langsung.
     */
    public function getCategories(): array
    {
        return [
            ['id' => 'all', 'name' => 'Semua Channel'],
            ['id' => 'nasional', 'name' => 'Nasional & Berita'],
            ['id' => 'hiburan', 'name' => 'Hiburan'],
            ['id' => 'anak', 'name' => 'Anak & Edukasi'],
            ['id' => 'internasional', 'name' => 'Internasional'],
            ['id' => 'olahraga', 'name' => 'Olahraga'],
        ];
    }

    /**
     * Daftar channel TV kurasi berkualitas HD bebas iklan.
     * Logo disimpan secara lokal di /images/tv-logos/ untuk kecepatan dan stabilitas maksimal.
     */
    public function getChannels(): array
    {
        $channels = [
            // ==================== NASIONAL & BERITA ====================
            [
                'id' => 'trans-tv',
                'name' => 'Trans TV HD',
                'category' => 'nasional',
                'stream_url' => 'https://green-night-d2b4.iontv.workers.dev/transtv.m3u8',
                'logo' => '/images/tv-logos/trans-tv.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Milik Kita Bersama - Bioskop Trans TV, variety show populer, Brownis, dan program hiburan keluarga.',
            ],
            [
                'id' => 'trans-7',
                'name' => 'Trans 7 HD',
                'category' => 'nasional',
                'stream_url' => 'https://green-night-d2b4.iontv.workers.dev/trans7.m3u8',
                'logo' => '/images/tv-logos/trans-7.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Aktif, Cerdas, dan Menghibur - Lapor Pak!, On The Spot, Jejak Petualang, dan MotoGP.',
            ],
            [
                'id' => 'metro-tv',
                'name' => 'Metro TV HD',
                'category' => 'nasional',
                'stream_url' => 'https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8',
                'logo' => '/images/tv-logos/metro-tv.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Stasiun televisi berita nasional 24 jam pertama di Indonesia dengan jurnalisme kredibel.',
            ],
            [
                'id' => 'magna-channel',
                'name' => 'Magna Channel FHD',
                'category' => 'nasional',
                'stream_url' => 'https://edge.medcom.id/live-edge/smil:magna.smil/playlist.m3u8',
                'logo' => '/images/tv-logos/magna-channel.svg',
                'badge' => 'FHD',
                'is_live' => true,
                'description' => 'Saluran televisi digital terestrial dari Media Group yang menyajikan program berita, teknologi, dan gaya hidup.',
            ],
            [
                'id' => 'cnn-indonesia',
                'name' => 'CNN Indonesia HD',
                'category' => 'nasional',
                'stream_url' => 'https://green-night-d2b4.iontv.workers.dev/cnn.m3u8',
                'logo' => '/images/tv-logos/cnn-indonesia.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Menyajikan Berita Terkini, Tajam, Menyeluruh, dan Terpercaya dari dalam dan luar negeri.',
            ],
            [
                'id' => 'cnbc-indonesia',
                'name' => 'CNBC Indonesia HD',
                'category' => 'nasional',
                'stream_url' => 'https://green-night-d2b4.iontv.workers.dev/cnbc.m3u8',
                'logo' => '/images/tv-logos/cnbc-indonesia.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Saluran berita pasar modal, ekonomi, perbankan, dan investasi bisnis nomor satu di Indonesia.',
            ],
            [
                'id' => 'inews',
                'name' => 'iNews TV HD',
                'category' => 'nasional',
                'stream_url' => 'https://live.i-news.tv/hls/stream.m3u8',
                'logo' => '/images/tv-logos/inews.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Inspiring & Informative - Jaringan televisi berita nasional dan daerah terbesar di Indonesia.',
            ],
            [
                'id' => 'nusantara-tv',
                'name' => 'Nusantara TV FHD',
                'category' => 'nasional',
                'stream_url' => 'https://nusantaratv.siar.us/nusantaratv/live/playlist.m3u8',
                'logo' => '/images/tv-logos/nusantara-tv.svg',
                'badge' => 'FHD',
                'is_live' => true,
                'description' => 'Sahabat Kita - Televisi digital swasta nasional dengan liputan berita nusantara dan hiburan bermutu.',
            ],
            [
                'id' => 'btv',
                'name' => 'BTV (BeritaSatu) FHD',
                'category' => 'nasional',
                'stream_url' => 'https://lnd0t3b922.tenbytecdn.com/ta-sg1/90369cf5-6ac2-411d-b3d0-15fae10a2e2c/master.m3u8',
                'logo' => '/images/tv-logos/btv.png',
                'badge' => 'FHD',
                'is_live' => true,
                'description' => 'Bersatu Menginspirasi - Berita nasional, ekonomi, hiburan, dan siaran langsung berkualitas 1080p.',
            ],
            [
                'id' => 'tvri-nasional',
                'name' => 'TVRI Nasional HD',
                'category' => 'nasional',
                'stream_url' => 'https://ott-balancer.tvri.go.id/live/eds/DKI/hls/DKI.m3u8',
                'logo' => '/images/tv-logos/tvri-nasional.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Saluran Pemersatu Bangsa, siaran berita resmi kenegaraan, kebudayaan nusantara, dan edukasi.',
            ],
            [
                'id' => 'rri-net',
                'name' => 'RRI Net HD',
                'category' => 'nasional',
                'stream_url' => 'https://private-streaming.rri.go.id/memfs/6f77c7b5-feb2-4935-9f89-e7e9fca0a54a_output_0.m3u8',
                'logo' => '/images/tv-logos/rri-net.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Tonton yang Anda Dengar - siaran visual radio nasional, konser musik, dan berita terkini dari RRI.',
            ],

            // ==================== HIBURAN & DAERAH ====================
            [
                'id' => 'daai-tv',
                'name' => 'DAAI TV HD',
                'category' => 'hiburan',
                'stream_url' => 'https://pull.daaiplus.com/live-DAAIPLUS/live-DAAIPLUS_HD.m3u8',
                'logo' => '/images/tv-logos/daai-tv.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Televisi Cinta Kasih dengan tayangan inspiratif, dokumenter humaniora, dan nilai kemanusiaan universal.',
            ],
            [
                'id' => 'jawapos-tv',
                'name' => 'Jawa Pos TV',
                'category' => 'hiburan',
                'stream_url' => 'http://122.248.43.242:1935/JAWAPOSTVJKT/_definst_/myStream/playlist.m3u8',
                'logo' => '/images/tv-logos/jawapos-tv.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Jaringan televisi regional terluas menyajikan liputan budaya, kearifan lokal, dan informasi daerah.',
            ],
            [
                'id' => 'jtv',
                'name' => 'JTV Surabaya HD',
                'category' => 'hiburan',
                'stream_url' => 'http://122.248.43.242:1935/JTVSURABAYA/_definst_/myStream/playlist.m3u8',
                'logo' => '/images/tv-logos/jtv.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Jawa Timur Televisi - Saluran televisi regional pertama di Indonesia dengan bahasa daerah yang khas dan menghibur.',
            ],
            [
                'id' => 'tv9',
                'name' => 'TV9 Nusantara',
                'category' => 'hiburan',
                'stream_url' => 'https://5bf7b725107e5.streamlock.net/tv9/tv9/playlist.m3u8',
                'logo' => '/images/tv-logos/tv9.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Santun Menyejukkan - Siaran dakwah nusantara, kajian Islam moderat, dan kebudayaan santri.',
            ],
            [
                'id' => 'tvmu',
                'name' => 'TV Mu (Muhammadiyah TV)',
                'category' => 'hiburan',
                'stream_url' => 'https://e.siar.us/live/tvmu.m3u8',
                'logo' => '/images/tv-logos/tvmu.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Cerdas Mencerahkan - Media siaran dakwah, pendidikan, dan kebudayaan berkemajuan.',
            ],
            [
                'id' => 'rodja-tv',
                'name' => 'Rodja TV HD',
                'category' => 'hiburan',
                'stream_url' => 'https://rodjatv.com/rodjatv/live.m3u8',
                'logo' => '/images/tv-logos/rodja-tv.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Menebar Cahaya Sunnah - Saluran televisi dakwah Islam ilmiah dan kajian Al-Qur\'an.',
            ],

            // ==================== ANAK & EDUKASI ====================
            [
                'id' => 'rtv',
                'name' => 'RTV (Rajawali TV)',
                'category' => 'anak',
                'stream_url' => 'https://rtvstream.rtv.co.id:4555/hls/rtv.m3u8',
                'logo' => '/images/tv-logos/rtv.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Makin Cakep - Rumah bagi kartun favorit anak, tokusatsu Ultraman, Kamen Rider, dan serial keluarga.',
            ],
            [
                'id' => 'indonesiana-tv',
                'name' => 'Indonesiana TV HD',
                'category' => 'anak',
                'stream_url' => 'https://tvstreamcast.com/indonesiana.m3u8',
                'logo' => '/images/tv-logos/indonesiana-tv.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Kanal media kebudayaan Indonesia resmi dari Kemendikbudristek RI menyajikan seni, tradisi, dan edukasi.',
            ],
            [
                'id' => 'ugtv',
                'name' => 'UGTV Edukasi',
                'category' => 'anak',
                'stream_url' => 'https://cdn.gunadarma.ac.id/streams/ugtv/ingestugtv.m3u8',
                'logo' => '/images/tv-logos/ugtv.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Televisi komunitas edukasi dan teknologi informasi Universitas Gunadarma.',
            ],
            [
                'id' => 'abc-kids',
                'name' => 'ABC Kids HD',
                'category' => 'anak',
                'stream_url' => 'https://c.mjh.nz/abc-kids.m3u8',
                'logo' => '/images/tv-logos/abc-kids.svg',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Saluran hiburan anak-anak terkemuka dengan program animasi interaktif, aman, dan mendidik.',
            ],

            // ==================== INTERNASIONAL ====================
            [
                'id' => 'tvri-world',
                'name' => 'TVRI World FHD',
                'category' => 'internasional',
                'stream_url' => 'https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8',
                'logo' => '/images/tv-logos/tvri-world.png',
                'badge' => 'FHD',
                'is_live' => true,
                'description' => 'Saluran siaran internasional berbahasa Inggris yang mempromosikan Indonesia ke kancah global.',
            ],
            [
                'id' => 'dw-english',
                'name' => 'DW English HD',
                'category' => 'internasional',
                'stream_url' => 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
                'logo' => '/images/tv-logos/dw-english.png',
                'badge' => 'HD',
                'is_live' => true,
                'description' => 'Siaran berita independen Jerman untuk pemirsa global dengan liputan mendalam dan wawasan dunia.',
            ],

            // ==================== OLAHRAGA ====================
            [
                'id' => 'redbull-tv',
                'name' => 'Red Bull TV FHD',
                'category' => 'olahraga',
                'stream_url' => 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
                'logo' => '/images/tv-logos/redbull-tv.svg',
                'badge' => 'FHD',
                'is_live' => true,
                'description' => 'Aksi olahraga ekstrem global, balap motor, festival musik, dan dokumenter petualangan spektakuler.',
            ],
        ];

        return array_map(fn ($ch) => array_merge(['type' => 'hls'], $ch), $channels);
    }
}
