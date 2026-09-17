<?php

declare(strict_types=1);

use App\Services\Catalog\PlayableCatalogService;
use App\Support\Catalog\ArchiveTitle;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
});

describe('pembersihan judul Archive', function () {
    it('membuang tahun di depan dan isi kurung, lalu menyimpan tahunnya', function () {
        $parsed = ArchiveTitle::parse(
            '1940 Das Leichte Madchen ( Willy Fritsch, Max Gulstorff, Paul Kemp)',
        );

        expect($parsed->clean)->toBe('Das Leichte Madchen')
            ->and($parsed->year)->toBe(1940);
    });

    it('membuang penanda teknis dari nama berkas', function () {
        expect(ArchiveTitle::parse('Elephants Dream 1080p h264/h265/h266 aac')->clean)
            ->toBe('Elephants Dream')
            ->and(ArchiveTitle::parse('Big Buck Bunny 4k With Captions')->clean)
            ->toBe('Big Buck Bunny')
            ->and(ArchiveTitle::parse('big buck bunny 720p h264')->clean)
            ->toBe('big buck bunny');
    });

    it('membuang sisa antarmuka Archive yang ikut tersalin ke judul', function () {
        expect(
            ArchiveTitle::parse(
                'Nosferatu Free Download Borrow And Streaming Internet Archive',
            )->clean,
        )->toBe('Nosferatu');
    });

    it('mengambil tahun dari kurung maupun dari kolom metadata', function () {
        expect(ArchiveTitle::parse('Tears of Steel (2012)')->year)->toBe(2012)
            ->and(ArchiveTitle::parse('Night Alarm', '1934')->year)->toBe(1934);
    });

    it('membiarkan judul yang memang sudah bersih', function () {
        $parsed = ArchiveTitle::parse('Night Alarm');

        expect($parsed->clean)->toBe('Night Alarm')->and($parsed->year)->toBeNull();
    });

    it('menyamakan kata sandang saat membandingkan judul', function () {
        expect(ArchiveTitle::comparable('The Kid'))->toBe('kid')
            ->and(ArchiveTitle::comparable('His Girl Friday!'))->toBe(
                'his girl friday',
            );
    });
});

/**
 * Balasan palsu untuk satu item Archive dan satu hasil TMDB.
 *
 * @param  array<int, array<string, mixed>>  $tmdbResults
 */
function fakeCatalog(string $archiveTitle, array $tmdbResults): void
{
    Http::fake([
        'archive.org/advancedsearch*' => Http::response([
            'response' => [
                'numFound' => 1,
                'docs' => [['identifier' => 'film-uji', 'title' => $archiveTitle]],
            ],
        ]),
        'archive.org/metadata/*' => Http::response([
            'metadata' => ['title' => $archiveTitle],
            'files' => [['name' => 'film.mp4', 'format' => 'h.264']],
        ]),
        'api.themoviedb.org/*' => Http::response(['results' => $tmdbResults]),
    ]);
}

describe('pencocokan berkas Archive ke judul TMDB', function () {
    it('menerima padanan dengan judul dan tahun yang cocok', function () {
        fakeCatalog('His Girl Friday (1940)', [
            [
                'id' => 3061,
                'title' => 'His Girl Friday',
                'release_date' => '1940-01-11',
                'poster_path' => '/poster.jpg',
                'vote_average' => 7.4,
            ],
        ]);

        $result = app(PlayableCatalogService::class)->page();

        expect($result['items'])->toHaveCount(1)
            ->and($result['items'][0]['title'])->toBe('His Girl Friday')
            ->and($result['items'][0]['reference'])->toBe('film-uji')
            ->and($result['items'][0]['provider'])->toBe('archive');
    });

    it('menolak padanan yang judulnya jauh berbeda', function () {
        fakeCatalog('Night Alarm', [
            [
                'id' => 1,
                'title' => 'Blade Runner',
                'release_date' => '1982-06-25',
                'poster_path' => '/poster.jpg',
            ],
        ]);

        expect(app(PlayableCatalogService::class)->page()['items'])->toBeEmpty();
    });

    it('menolak pembuatan ulang berjudul sama dari tahun yang jauh', function () {
        // Berkas Archive dari 1954, sedangkan TMDB mengembalikan film 2001
        // berjudul sama. Memasang poster yang salah di berkas yang akan diputar
        // lebih merusak daripada kartu yang tidak muncul.
        fakeCatalog('The Fast and the Furious (1954)', [
            [
                'id' => 9799,
                'title' => 'The Fast and the Furious',
                'release_date' => '2001-06-22',
                'poster_path' => '/poster.jpg',
            ],
        ]);

        expect(app(PlayableCatalogService::class)->page()['items'])->toBeEmpty();
    });

    it('menolak padanan tanpa poster', function () {
        fakeCatalog('His Girl Friday (1940)', [
            [
                'id' => 3061,
                'title' => 'His Girl Friday',
                'release_date' => '1940-01-11',
            ],
        ]);

        expect(app(PlayableCatalogService::class)->page()['items'])->toBeEmpty();
    });

    it('melewati item Archive yang tidak punya turunan video', function () {
        Http::fake([
            'archive.org/advancedsearch*' => Http::response([
                'response' => [
                    'numFound' => 1,
                    'docs' => [
                        ['identifier' => 'hanya-teks', 'title' => 'His Girl Friday'],
                    ],
                ],
            ]),
            'archive.org/metadata/*' => Http::response([
                'metadata' => ['title' => 'His Girl Friday'],
                'files' => [['name' => 'catatan.txt', 'format' => 'Text']],
            ]),
            'api.themoviedb.org/*' => Http::response(['results' => []]),
        ]);

        $result = app(PlayableCatalogService::class)->page();

        expect($result['items'])->toBeEmpty()->and($result['scanned'])->toBe(1);
    });

    it('melaporkan berapa yang ditelusuri, bukan hanya yang cocok', function () {
        fakeCatalog('His Girl Friday (1940)', [
            [
                'id' => 3061,
                'title' => 'His Girl Friday',
                'release_date' => '1940-01-11',
                'poster_path' => '/poster.jpg',
            ],
        ]);

        $this->getJson(route('catalog.playable'))
            ->assertOk()
            ->assertJsonPath('meta.matched', 1)
            ->assertJsonPath('meta.scanned', 1)
            ->assertJsonPath('data.0.title', 'His Girl Friday');
    });
});

describe('kueri pencarian Internet Archive', function () {
    it('tidak pernah mengirim sort kosong yang ditolak Archive', function () {
        Http::fake([
            'archive.org/advancedsearch*' => Http::response([
                'response' => ['docs' => [], 'numFound' => 0],
            ]),
        ]);

        app(App\Services\InternetArchiveService::class)->search('nosferatu');

        Http::assertSent(
            fn ($request) => ! str_contains($request->url(), 'sort%5B%5D=&')
                && ! str_ends_with($request->url(), 'sort%5B%5D='),
        );
    });

    it('mengirim setiap kolom sebagai fl[] terpisah, bukan larik bersarang', function () {
        Http::fake([
            'archive.org/advancedsearch*' => Http::response([
                'response' => ['docs' => [], 'numFound' => 0],
            ]),
        ]);

        app(App\Services\InternetArchiveService::class)->search();

        Http::assertSent(function ($request) {
            $url = urldecode($request->url());

            return str_contains($url, 'fl[]=identifier')
                && str_contains($url, 'fl[]=title')
                && ! str_contains($url, 'fl[][0]');
        });
    });
});
