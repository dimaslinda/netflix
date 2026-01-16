<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\MovieController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [MovieController::class, 'index'])->name('home');

Route::get('/streaming/select', function () {
    return Inertia::render('StreamingSelect');
})->name('streaming.select');

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

Route::prefix('api/archive')->group(function () {
    Route::get('public-domain', [ArchiveController::class, 'publicDomain'])->name('archive.public-domain');
    Route::get('metadata/{identifier}', [ArchiveController::class, 'metadata'])->name('archive.metadata');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
