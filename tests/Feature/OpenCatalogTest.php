<?php

declare(strict_types=1);

use App\Services\Playback\OpenMovieResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();

    config()->set('open-movies.titles', [
        [
            'identifier' => 'film-bagus',
            'title' => 'Film Bagus',
            'year' => 2010,
            'license' => 'CC BY 3.0',
            'studio' => 'Studio Uji',
        ],
        [
            'identifier' => 'film-rusak',
            'title' => 'Film Rusak',
            'year' => 2011,
            'license' => 'CC BY 3.0',
        ],
    ]);
});

/** Balasan metadata Archive untuk item yang punya turunan h.264. */
function archiveMetadataFake(): Closure
{
    return function ($request) {
        if (str_contains($request->url(), 'film-rusak')) {
            return Http::response(['metadata' => ['title' => 'Film Rusak'], 'files' => []]);
        }

        return Http::response([
            'metadata' => ['title' => 'Judul Mentah Archive 1080p h264'],
            'files' => [['name' => 'film.mp4', 'format' => 'h.264']],
        ]);
    };
}

describe('katalog film terbuka', function () {
    it('menyembunyikan judul yang tidak punya turunan video yang bisa diputar', function () {
        Http::fake(['archive.org/metadata/*' => archiveMetadataFake()]);

        $catalog = app(OpenMovieResolver::class)->catalog();

        expect($catalog)->toHaveCount(1)
            ->and($catalog[0]['reference'])->toBe('film-bagus')
            ->and($catalog[0]['license'])->toBe('CC BY 3.0');
    });

    it('memakai judul hasil kurasi, bukan judul mentah Archive', function () {
        Http::fake(['archive.org/metadata/*' => archiveMetadataFake()]);

        $source = app(OpenMovieResolver::class)->resolve('film-bagus');

        expect($source->label)->toBe('Film Bagus')
            ->and($source->provider)->toBe('open')
            ->and($source->url)->toBe('https://archive.org/download/film-bagus/film.mp4');
    });

    it('menolak identifier di luar katalog walau ada di Archive', function () {
        Http::fake(['archive.org/metadata/*' => archiveMetadataFake()]);

        expect(app(OpenMovieResolver::class)->resolve('judul-liar'))->toBeNull();
    });

    it('menyajikan katalog lewat endpoint', function () {
        Http::fake(['archive.org/metadata/*' => archiveMetadataFake()]);

        $this->getJson(route('catalog.open-movies'))
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Film Bagus')
            ->assertJsonPath('data.0.provider', 'open');
    });
});

describe('pencarian Internet Archive', function () {
    it('membatasi pencarian pada koleksi film yang boleh diunduh', function () {
        Http::fake(['archive.org/advancedsearch*' => Http::response([
            'response' => ['docs' => [], 'numFound' => 0],
        ])]);

        $this->getJson(route('catalog.archive', ['q' => 'sintel']))->assertOk();

        Http::assertSent(function ($request) {
            $query = $request->data()['q'] ?? '';

            return str_contains($query, 'collection:feature_films')
                && str_contains($query, 'mediatype:movies')
                && str_contains($query, 'sintel');
        });
    });

    it('membersihkan karakter khusus agar kueri tidak rusak', function () {
        Http::fake(['archive.org/advancedsearch*' => Http::response([
            'response' => ['docs' => [], 'numFound' => 0],
        ])]);

        $this->getJson(route('catalog.archive', ['q' => 'judul") OR (1=1']))->assertOk();

        Http::assertSent(function ($request) {
            $query = $request->data()['q'] ?? '';

            return ! str_contains($query, '"') && ! str_contains($query, '=');
        });
    });

    it('memetakan hasil menjadi entri katalog siap pilih', function () {
        Http::fake(['archive.org/advancedsearch*' => Http::response([
            'response' => [
                'numFound' => 1,
                'docs' => [['identifier' => 'film-lama', 'title' => 'Film Lama', 'year' => '1950']],
            ],
        ])]);

        $this->getJson(route('catalog.archive'))
            ->assertOk()
            ->assertJsonPath('data.0.provider', 'archive')
            ->assertJsonPath('data.0.reference', 'film-lama')
            ->assertJsonPath('data.0.poster', 'https://archive.org/services/img/film-lama')
            ->assertJsonPath('meta.total', 1);
    });

    it('bertahan saat Archive tidak merespons', function () {
        Http::fake(['archive.org/advancedsearch*' => Http::response('', 503)]);

        $this->getJson(route('catalog.archive'))
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 0);
    });
});
