<?php

namespace App\Providers;

use App\Contracts\SubtitleTranslator;
use App\Services\Playback\ArchiveStreamResolver;
use App\Services\Playback\LocalLibraryResolver;
use App\Services\Playback\OpenMovieResolver;
use App\Services\Playback\StreamResolverManager;
use App\Services\Subtitle\LibreTranslateTranslator;
use App\Services\Subtitle\NullSubtitleTranslator;
use Illuminate\Support\Facades\URL;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->registerStreamResolvers();
        $this->registerSubtitleTranslator();

        $this->app->bind('db.connector.pgsql', fn () => new \App\Database\Connectors\NeonPostgresConnector);
    }

    /**
     * Pilih mesin penerjemah takarir sesuai config/subtitles.php.
     *
     * Bila mesinnya tidak dikenal, jatuh ke NullSubtitleTranslator. Salah ketik
     * di .env tidak boleh menjatuhkan seluruh halaman tonton.
     */
    protected function registerSubtitleTranslator(): void
    {
        $this->app->singleton(SubtitleTranslator::class, function ($app) {
            return match (config('subtitles.translator', 'null')) {
                'libretranslate' => $app->make(LibreTranslateTranslator::class),
                default => $app->make(NullSubtitleTranslator::class),
            };
        });
    }

    /**
     * Daftar asal tontonan, berurutan sesuai prioritas tampil di pemilih sumber.
     *
     * Semua asal di sini menyajikan berkas tanpa DRM, jadi pemutar internal
     * dapat memakainya langsung tanpa iframe pihak ketiga.
     */
    protected function registerStreamResolvers(): void
    {
        $this->app->singleton(StreamResolverManager::class, fn ($app): StreamResolverManager => new StreamResolverManager([
            $app->make(OpenMovieResolver::class),
            $app->make(ArchiveStreamResolver::class),
            $app->make(LocalLibraryResolver::class),
        ]));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            URL::forceScheme('https');
        }
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): Password => Password::min(8)
        );
    }
}
