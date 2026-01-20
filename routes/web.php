<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\SubtitleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [MovieController::class, 'index'])->name('home');

Route::get('/streaming/select', function () {
    return Inertia::render('StreamingSelect');
})->name('streaming.select');

// NetMirror watch route (for multi-audio playback)
Route::get('/netmirror/watch/{contentId}', function ($contentId) {
    return Inertia::render('NetMirrorWatch', [
        'contentId' => $contentId,
    ]);
})->name('netmirror.watch');

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

Route::get('watch/{type}/{id}', function ($type, $id) {
    return Inertia::render('Watch', [
        'type' => $type,
        'id' => $id,
        'season' => request()->query('season', '1'),
        'episode' => request()->query('episode', '1'),
        'source' => request()->query('source', 'vidlink'),
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
        'now-playing'
    ])
    ->name('browse.category');

Route::prefix('api/subtitles')->group(function () {
    Route::get('search', [SubtitleController::class, 'searchByTmdb'])->name('subtitles.search');
    Route::get('search/query', [SubtitleController::class, 'searchByQuery'])->name('subtitles.search-query');
    Route::post('download', [SubtitleController::class, 'download'])->name('subtitles.download');
    Route::get('languages', [SubtitleController::class, 'languages'])->name('subtitles.languages');
});

Route::prefix('api/archive')->group(function () {
    Route::get('public-domain', [ArchiveController::class, 'publicDomain'])->name('archive.public-domain');
    Route::get('metadata/{identifier}', [ArchiveController::class, 'metadata'])->name('archive.metadata');
});

Route::prefix('api/stream')->group(function () {
    Route::get('search', [\App\Http\Controllers\StreamController::class, 'search'])->name('stream.search');
    Route::get('get', [\App\Http\Controllers\StreamController::class, 'getStream'])->name('stream.get');
    Route::get('find', [\App\Http\Controllers\StreamController::class, 'findByTitle'])->name('stream.find');
    Route::get('proxy', [\App\Http\Controllers\StreamProxyController::class, 'proxy'])->name('stream.proxy');
    Route::get('proxied', [\App\Http\Controllers\StreamProxyController::class, 'getProxiedStream'])->name('stream.proxied');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
