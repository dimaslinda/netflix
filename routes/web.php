<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\LocalMediaController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\PlaybackController;
use App\Http\Controllers\SubtitleController;
use App\Http\Controllers\UserAccountController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [MovieController::class, 'index'])->name('home');

Route::prefix('api/user')->group(function () {
    Route::get('watch-history', [UserAccountController::class, 'getWatchHistory'])->name('user.history.get');
    Route::post('watch-history', [UserAccountController::class, 'saveWatchHistory'])->name('user.history.save');
    Route::delete('watch-history', [UserAccountController::class, 'deleteWatchHistory'])->name('user.history.delete');
    Route::post('watch-history/sync', [UserAccountController::class, 'syncWatchHistory'])->name('user.history.sync');

    Route::get('bookmarks', [UserAccountController::class, 'getBookmarks'])->name('user.bookmarks.get');
    Route::post('bookmarks/toggle', [UserAccountController::class, 'toggleBookmark'])->name('user.bookmarks.toggle');
    Route::post('bookmarks/sync', [UserAccountController::class, 'syncBookmarks'])->name('user.bookmarks.sync');

    Route::post('profile', [UserAccountController::class, 'updateProfile'])->name('user.profile.update');
    Route::post('password', [UserAccountController::class, 'updatePassword'])->name('user.password.update');
    Route::post('pin', [UserAccountController::class, 'updatePin'])->name('user.pin.update');
});

// Rute /streaming/select dicabut. Halaman itu menampilkan enam merek layanan
// siaran sungguhan sebagai pilihan sumber, padahal tidak satu pun darinya
// pernah menjadi sumber aplikasi ini. Berkas halamannya masih ada di
// resources/js/pages/StreamingSelect.tsx bila ingin diperiksa dulu.

Route::get('/search', [MovieController::class, 'searchPage'])->name('search');

Route::get('title/{type}/{id}', function ($type, $id) {
    return Inertia::render('MovieDetail', [
        'type' => $type,
        'id' => (string) $id,
    ]);
})
    ->whereIn('type', ['movie', 'tv'])
    ->whereNumber('id')
    ->name('title.show');

/*
 | Menonton berkas yang sudah punya sumber pasti, tanpa lewat TMDB. Dipakai
 | katalog film terbuka, yang judulnya tidak selalu ada di TMDB dan karena itu
 | tidak punya id untuk dipasang di rute watch di bawah.
 */
Route::get('tonton', function () {
    return Inertia::render('Watch', [
        'type' => 'movie',
        'id' => '',
        'provider' => request()->query('provider'),
        'reference' => request()->query('reference'),
    ]);
})->name('watch.direct');

Route::get('watch/{type}/{id}', function ($type, $id) {
    return Inertia::render('Watch', [
        'type' => $type,
        'id' => $id,
        'season' => request()->query('season', '1'),
        'episode' => request()->query('episode', '1'),
        'provider' => request()->query('provider'),
        'reference' => request()->query('reference'),
    ]);
})->whereIn('type', ['movie', 'tv'])->whereNumber('id')->name('watch');

Route::prefix('api/tmdb')->group(function () {
    Route::get('search', [MovieController::class, 'search'])->name('tmdb.search');
    Route::get('{type}/{id}', [MovieController::class, 'details'])
        ->whereIn('type', ['movie', 'tv'])
        ->whereNumber('id')
        ->name('tmdb.details');
    Route::get('{type}/{id}/videos', [MovieController::class, 'videos'])
        ->whereIn('type', ['movie', 'tv'])
        ->whereNumber('id')
        ->name('tmdb.videos');
    Route::get('tv/{id}/season/{season}', [MovieController::class, 'tvSeason'])
        ->whereNumber('id')
        ->whereNumber('season')
        ->name('tmdb.tv-season');
});

Route::get('browse/{category}', [MovieController::class, 'browseCategory'])
    ->whereIn('category', [
        'trending',
        'top-rated',
        'tv-trending',
        'tv-top-rated',
        'action',
        'comedy',
        'horror',
        'romance',
        'documentaries',
        'animation',
        'anime',
        'thriller',
        'scifi',
        'drama',
        'crime',
        'family',
        'fantasy',
        'mystery',
        'korean',
        'popular-tv',
        'now-playing',
        'disney'
    ])
    ->name('browse.category');

Route::prefix('api/subtitles')->group(function () {
    Route::get('search', [SubtitleController::class, 'searchByTmdb'])->name('subtitles.search');
    Route::get('search/query', [SubtitleController::class, 'searchByQuery'])->name('subtitles.search-query');
    Route::get('languages', [SubtitleController::class, 'languages'])->name('subtitles.languages');
    Route::get('stream', [SubtitleController::class, 'stream'])->name('subtitles.stream');
});

/*
|--------------------------------------------------------------------------
| Pemutaran
|--------------------------------------------------------------------------
|
| Pemutar internal hanya bicara ke endpoint di bawah ini. Tidak ada iframe
| pihak ketiga, jadi tidak ada iklan atau popup yang bisa disuntikkan ke
| halaman tonton. Setiap asal baru cukup didaftarkan sebagai StreamResolver.
|
*/
Route::prefix('api/playback')->group(function () {
    Route::get('providers', [PlaybackController::class, 'providers'])->name('playback.providers');
    Route::get('resolve', [PlaybackController::class, 'resolve'])->name('playback.resolve');
});

Route::prefix('api/library')->group(function () {
    Route::get('/', [LocalMediaController::class, 'index'])->name('media.index');
    Route::get('stream', [LocalMediaController::class, 'stream'])->name('media.stream');
});

Route::prefix('api/catalog')->group(function () {
    Route::get('open-movies', [ArchiveController::class, 'catalog'])->name('catalog.open-movies');
    Route::get('playable', [ArchiveController::class, 'playable'])->name('catalog.playable');
    Route::get('archive', [ArchiveController::class, 'search'])->name('catalog.archive');
    Route::get('archive/{identifier}', [ArchiveController::class, 'metadata'])
        ->where('identifier', '[A-Za-z0-9._-]+')
        ->name('catalog.archive-metadata');
});

Route::middleware(['auth'])->group(function () {
    Route::get('account', [UserAccountController::class, 'accountPage'])->name('account');
    Route::get('dashboard', function () {
        return redirect()->route('account');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
