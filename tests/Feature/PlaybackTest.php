<?php

declare(strict_types=1);

use App\Services\Playback\ArchiveStreamResolver;
use App\Services\Playback\LocalLibraryResolver;
use App\Support\Playback\StreamSource;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->libraryPath = storage_path('framework/testing/media');

    if (! is_dir($this->libraryPath)) {
        mkdir($this->libraryPath, 0o777, true);
    }

    config()->set('media.library_path', $this->libraryPath);

    Cache::flush();
});

afterEach(function () {
    foreach (glob($this->libraryPath.'/*') ?: [] as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }
});

/** Tulis berkas uji ke dalam pustaka dan kembalikan nama berkasnya. */
function putLibraryFile(string $name, string $contents): string
{
    file_put_contents(config('media.library_path').DIRECTORY_SEPARATOR.$name, $contents);

    return $name;
}

describe('pustaka lokal', function () {
    it('menolak referensi yang keluar dari folder pustaka', function () {
        $resolver = app(LocalLibraryResolver::class);

        expect($resolver->resolvePath('../../../.env'))->toBeNull()
            ->and($resolver->resolvePath('..\\..\\.env'))->toBeNull()
            ->and($resolver->resolvePath('/etc/passwd'))->toBeNull()
            ->and($resolver->resolvePath(''))->toBeNull();
    });

    it('menolak nama berkas yang mengandung null byte', function () {
        putLibraryFile('film.mp4', 'data');

        expect(app(LocalLibraryResolver::class)->resolvePath("film.mp4\0.txt"))->toBeNull();
    });

    it('menolak ekstensi yang tidak bisa diputar peramban', function () {
        putLibraryFile('film.mkv', 'data');

        expect(app(LocalLibraryResolver::class)->resolve('film.mkv'))->toBeNull();
    });

    it('mengembalikan sumber progresif untuk berkas mp4', function () {
        putLibraryFile('film.mp4', 'data');

        $source = app(LocalLibraryResolver::class)->resolve('film.mp4');

        expect($source)->toBeInstanceOf(StreamSource::class)
            ->and($source->kind)->toBe(StreamSource::KIND_PROGRESSIVE)
            ->and($source->mimeType)->toBe('video/mp4')
            ->and($source->provider)->toBe('library');
    });

    it('mengembalikan sumber hls untuk playlist m3u8', function () {
        putLibraryFile('film.m3u8', '#EXTM3U');

        $source = app(LocalLibraryResolver::class)->resolve('film.m3u8');

        expect($source->kind)->toBe(StreamSource::KIND_HLS);
    });
});

describe('penyajian berkas lokal', function () {
    it('melayani permintaan Range dengan status 206 dan potongan yang benar', function () {
        putLibraryFile('film.mp4', '0123456789');

        $response = $this->withHeaders(['Range' => 'bytes=2-5'])
            ->get(route('media.stream', ['path' => 'film.mp4']));

        $response->assertStatus(206)
            ->assertHeader('Content-Range', 'bytes 2-5/10')
            ->assertHeader('Content-Length', '4');

        expect($response->streamedContent())->toBe('2345');
    });

    it('melayani permintaan tanpa Range dengan berkas utuh', function () {
        putLibraryFile('film.mp4', '0123456789');

        $response = $this->get(route('media.stream', ['path' => 'film.mp4']));

        $response->assertOk()->assertHeader('Accept-Ranges', 'bytes');

        expect($response->streamedContent())->toBe('0123456789');
    });

    it('memahami bentuk sufiks bytes=-3 sebagai tiga byte terakhir', function () {
        putLibraryFile('film.mp4', '0123456789');

        $response = $this->withHeaders(['Range' => 'bytes=-3'])
            ->get(route('media.stream', ['path' => 'film.mp4']));

        $response->assertStatus(206)->assertHeader('Content-Range', 'bytes 7-9/10');

        expect($response->streamedContent())->toBe('789');
    });

    it('menolak rentang di luar ukuran berkas dengan status 416', function () {
        putLibraryFile('film.mp4', '0123456789');

        $this->withHeaders(['Range' => 'bytes=50-60'])
            ->get(route('media.stream', ['path' => 'film.mp4']))
            ->assertStatus(416)
            ->assertHeader('Content-Range', 'bytes */10');
    });

    it('menolak berkas di luar pustaka dengan status 404', function () {
        $this->get(route('media.stream', ['path' => '../../.env']))->assertNotFound();
    });
});

describe('endpoint resolusi sumber', function () {
    it('menolak penyedia yang tidak terdaftar', function () {
        $this->getJson(route('playback.resolve', [
            'provider' => 'vidlink',
            'reference' => '123',
        ]))->assertNotFound();
    });

    it('mengembalikan 404 saat berkas tidak ada di pustaka', function () {
        $this->getJson(route('playback.resolve', [
            'provider' => 'library',
            'reference' => 'tidak-ada.mp4',
        ]))->assertNotFound();
    });

    it('mengembalikan sumber siap putar untuk berkas yang ada', function () {
        putLibraryFile('film.mp4', 'data');

        $this->getJson(route('playback.resolve', [
            'provider' => 'library',
            'reference' => 'film.mp4',
        ]))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kind', 'progressive')
            ->assertJsonPath('data.provider', 'library');
    });

    it('mendaftar penyedia yang aktif sesuai urutan prioritas', function () {
        $this->getJson(route('playback.providers'))
            ->assertOk()
            ->assertJsonPath('data.0.provider', 'open')
            ->assertJsonPath('data.1.provider', 'archive')
            ->assertJsonPath('data.2.provider', 'library');
    });
});

describe('resolver internet archive', function () {
    it('memilih turunan h.264 dan menyusun URL unduhan', function () {
        Http::fake([
            'archive.org/metadata/*' => Http::response([
                'metadata' => ['title' => 'Film Domain Publik'],
                'files' => [
                    ['name' => 'film.ogv', 'format' => 'Ogg Video'],
                    ['name' => 'sub folder/film.mp4', 'format' => 'h.264'],
                ],
            ]),
        ]);

        $source = app(ArchiveStreamResolver::class)->resolve('film-lama');

        expect($source->kind)->toBe(StreamSource::KIND_PROGRESSIVE)
            ->and($source->label)->toBe('Film Domain Publik')
            ->and($source->url)->toBe('https://archive.org/download/film-lama/sub%20folder/film.mp4');
    });

    it('menolak identifier yang tidak sah tanpa memanggil jaringan', function () {
        Http::fake();

        expect(app(ArchiveStreamResolver::class)->resolve('../rahasia'))->toBeNull();

        Http::assertNothingSent();
    });

    it('mengembalikan null bila item tidak punya turunan video yang didukung', function () {
        Http::fake([
            'archive.org/metadata/*' => Http::response([
                'metadata' => ['title' => 'Hanya Teks'],
                'files' => [['name' => 'catatan.txt', 'format' => 'Text']],
            ]),
        ]);

        expect(app(ArchiveStreamResolver::class)->resolve('hanya-teks'))->toBeNull();
    });
});
