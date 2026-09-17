<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('tmdb_id');
            $table->string('media_type')->default('movie'); // 'movie' | 'tv'
            $table->string('title');
            $table->string('poster_path')->nullable();
            $table->string('backdrop_path')->nullable();
            $table->decimal('vote_average', 3, 1)->nullable();
            $table->text('overview')->nullable();
            $table->string('release_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'tmdb_id', 'media_type'], 'user_bookmark_unique');
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_bookmarks');
    }
};
