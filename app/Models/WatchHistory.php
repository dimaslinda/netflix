<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tmdb_id',
        'media_type',
        'title',
        'poster_path',
        'backdrop_path',
        'season',
        'episode',
        'progress_seconds',
        'duration_seconds',
        'last_watched_at',
    ];

    protected function casts(): array
    {
        return [
            'season' => 'integer',
            'episode' => 'integer',
            'progress_seconds' => 'integer',
            'duration_seconds' => 'integer',
            'last_watched_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
