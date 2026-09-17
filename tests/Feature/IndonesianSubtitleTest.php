<?php

declare(strict_types=1);

use App\Contracts\SubtitleTranslator;
use App\Services\OpenSubtitlesService;
use App\Services\SubDLService;
use App\Services\Subtitle\NullSubtitleTranslator;
use App\Services\Subtitle\SubtitleLibrary;
use Illuminate\Support\Facades\Cache;

/** Penerjemah palsu yang menandai tiap teks, supaya hasilnya mudah diperiksa. */
final class FakeTranslator implements SubtitleTranslator
{
    public function isAvailable(): bool
    {
        return true;
    }

    public function name(): string
    {
        return 'palsu';
    }

    public function translate(array $texts, string $from, string $to): array
    {
        return array_map(static fn (string $text): string => "[{$to}] {$text}", $texts);
    }
}

beforeEach(function () {
    Cache::flush();
});

/** Bentuk satu hasil pencarian SubDL. */
function subdlTrack(string $release): array
{
    return [
        'id' => $release,
        'release' => $release,
        'download_url' => "https://example.test/{$release}.srt",
    ];
}

describe('jaminan takarir bahasa sasaran', function () {
    it('memakai takarir Indonesia asli bila tersedia, tanpa mencari bahasa lain', function () {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('searchByTmdbId')
            ->once()
            ->with('603', 'movie', null, null, 'id', null)
            ->andReturn([subdlTrack('Asli.Indonesia')]);

        $opensubtitles = Mockery::mock(OpenSubtitlesService::class);
        $opensubtitles->shouldReceive('searchByTmdbId')->once()->andReturn([]);

        $library = new SubtitleLibrary($subdl, $opensubtitles, new FakeTranslator);

        $result = $library->search('603', 'movie');

        expect($result['tracks'])->toHaveCount(1)
            ->and($result['tracks'][0]['language'])->toBe('id')
            ->and($result['tracks'][0]['needs_translation'])->toBeFalse();
    });

    it('jatuh ke bahasa Inggris dan menandainya untuk diterjemahkan', function () {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('searchByTmdbId')
            ->with('603', 'movie', null, null, 'id', null)
            ->andReturn([]);
        $subdl->shouldReceive('searchByTmdbId')
            ->with('603', 'movie', null, null, 'en', null)
            ->andReturn([subdlTrack('English.Release')]);

        $opensubtitles = Mockery::mock(OpenSubtitlesService::class);
        $opensubtitles->shouldReceive('searchByTmdbId')->andReturn([]);

        $library = new SubtitleLibrary($subdl, $opensubtitles, new FakeTranslator);

        $result = $library->search('603', 'movie');

        expect($result['tracks'])->toHaveCount(1)
            ->and($result['tracks'][0]['language'])->toBe('en')
            ->and($result['tracks'][0]['needs_translation'])->toBeTrue()
            ->and($result['translator_available'])->toBeTrue();
    });

    it('menggabungkan hasil SubDL dan OpenSubtitles', function () {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('searchByTmdbId')->andReturn([subdlTrack('Dari.SubDL')]);

        $opensubtitles = Mockery::mock(OpenSubtitlesService::class);
        $opensubtitles->shouldReceive('searchByTmdbId')->andReturn([
            ['file_id' => 4242, 'release' => 'Dari.OpenSubtitles'],
        ]);

        $library = new SubtitleLibrary($subdl, $opensubtitles, new NullSubtitleTranslator);

        $tracks = $library->search('603', 'movie')['tracks'];

        expect($tracks)->toHaveCount(2)
            ->and($tracks[1]['provider'])->toBe('opensubtitles')
            ->and($tracks[1]['download_url'])->toBe('os://4242');
    });

    it('melaporkan mesin penerjemah mati saat memakai NullSubtitleTranslator', function () {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('searchByTmdbId')->andReturn([]);

        $opensubtitles = Mockery::mock(OpenSubtitlesService::class);
        $opensubtitles->shouldReceive('searchByTmdbId')->andReturn([]);

        $library = new SubtitleLibrary($subdl, $opensubtitles, new NullSubtitleTranslator);

        expect($library->search('603', 'movie')['translator_available'])->toBeFalse();
    });
});

describe('penyajian isi takarir', function () {
    $srt = "1\n00:00:01,000 --> 00:00:02,000\nGood morning\n";

    it('menerjemahkan teks dialog dan mempertahankan penanda waktu', function () use ($srt) {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('downloadAndConvert')->andReturn($srt);

        $library = new SubtitleLibrary(
            $subdl,
            Mockery::mock(OpenSubtitlesService::class),
            new FakeTranslator,
        );

        $vtt = $library->content('https://example.test/a.srt', 'en', translate: true);

        expect($vtt)->toContain('[id] Good morning')
            ->and($vtt)->toContain('00:00:01.000 --> 00:00:02.000');
    });

    it('tidak menerjemahkan bila mesin penerjemah mati', function () use ($srt) {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('downloadAndConvert')->andReturn($srt);

        $library = new SubtitleLibrary(
            $subdl,
            Mockery::mock(OpenSubtitlesService::class),
            new NullSubtitleTranslator,
        );

        $vtt = $library->content('https://example.test/a.srt', 'en', translate: true);

        expect($vtt)->toContain('Good morning')->and($vtt)->not->toContain('[id]');
    });

    it('tidak menerjemahkan bila bahasa asalnya sudah bahasa sasaran', function () use ($srt) {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('downloadAndConvert')->andReturn($srt);

        $library = new SubtitleLibrary(
            $subdl,
            Mockery::mock(OpenSubtitlesService::class),
            new FakeTranslator,
        );

        $vtt = $library->content('https://example.test/a.srt', 'id', translate: true);

        expect($vtt)->not->toContain('[id]');
    });

    it('mengembalikan null saat berkas takarir kosong', function () {
        $subdl = Mockery::mock(SubDLService::class);
        $subdl->shouldReceive('downloadAndConvert')->andReturn('');

        $library = new SubtitleLibrary(
            $subdl,
            Mockery::mock(OpenSubtitlesService::class),
            new NullSubtitleTranslator,
        );

        expect($library->content('https://example.test/a.srt'))->toBeNull();
    });
});
