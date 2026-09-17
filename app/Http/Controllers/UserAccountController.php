<?php

namespace App\Http\Controllers;

use App\Models\UserBookmark;
use App\Models\WatchHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserAccountController extends Controller
{
    /**
     * Get watch history for authenticated user
     */
    public function getWatchHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $histories = $user->watchHistories()
            ->orderByDesc('last_watched_at')
            ->limit(40)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    /**
     * Save / update a watch history item
     */
    public function saveWatchHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'tmdb_id' => 'required|string',
            'media_type' => 'required|string|in:movie,tv',
            'title' => 'required|string|max:255',
            'poster_path' => 'nullable|string',
            'backdrop_path' => 'nullable|string',
            'season' => 'nullable|integer',
            'episode' => 'nullable|integer',
            'progress_seconds' => 'nullable|integer',
            'duration_seconds' => 'nullable|integer',
        ]);

        $season = $validated['season'] ?? 1;
        $episode = $validated['episode'] ?? 1;

        $history = WatchHistory::updateOrCreate(
            [
                'user_id' => $user->id,
                'tmdb_id' => (string) $validated['tmdb_id'],
                'media_type' => $validated['media_type'],
                'season' => $season,
                'episode' => $episode,
            ],
            [
                'title' => $validated['title'],
                'poster_path' => $validated['poster_path'] ?? null,
                'backdrop_path' => $validated['backdrop_path'] ?? null,
                'progress_seconds' => $validated['progress_seconds'] ?? 0,
                'duration_seconds' => $validated['duration_seconds'] ?? 0,
                'last_watched_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Delete an item from watch history
     */
    public function deleteWatchHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'tmdb_id' => 'required|string',
            'media_type' => 'nullable|string',
        ]);

        $query = $user->watchHistories()->where('tmdb_id', (string) $validated['tmdb_id']);
        if (!empty($validated['media_type'])) {
            $query->where('media_type', $validated['media_type']);
        }

        $query->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Bulk sync watch history from guest localStorage to user database
     */
    public function syncWatchHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required',
            'items.*.type' => 'required|string',
            'items.*.title' => 'required|string',
            'items.*.poster_path' => 'nullable|string',
            'items.*.season' => 'nullable|integer',
            'items.*.episode' => 'nullable|integer',
            'items.*.progress_seconds' => 'nullable|integer',
            'items.*.duration_seconds' => 'nullable|integer',
        ]);

        foreach ($validated['items'] as $item) {
            WatchHistory::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'tmdb_id' => (string) $item['id'],
                    'media_type' => $item['type'],
                    'season' => $item['season'] ?? 1,
                    'episode' => $item['episode'] ?? 1,
                ],
                [
                    'title' => $item['title'],
                    'poster_path' => $item['poster_path'] ?? null,
                    'progress_seconds' => $item['progress_seconds'] ?? 0,
                    'duration_seconds' => $item['duration_seconds'] ?? 0,
                    'last_watched_at' => now(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'data' => $user->watchHistories()->limit(40)->get(),
        ]);
    }

    /**
     * Get all bookmarks / favorites for authenticated user
     */
    public function getBookmarks(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => true, 'data' => []]);
        }

        return response()->json([
            'success' => true,
            'data' => $user->bookmarks()->get(),
        ]);
    }

    /**
     * Toggle bookmark (add or remove)
     */
    public function toggleBookmark(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'tmdb_id' => 'required',
            'media_type' => 'nullable|string|in:movie,tv',
            'title' => 'required|string',
            'poster_path' => 'nullable|string',
            'backdrop_path' => 'nullable|string',
            'vote_average' => 'nullable|numeric',
            'overview' => 'nullable|string',
            'release_date' => 'nullable|string',
        ]);

        $tmdbId = (string) $validated['tmdb_id'];
        $mediaType = $validated['media_type'] ?? 'movie';

        $existing = UserBookmark::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->where('media_type', $mediaType)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'bookmarked' => false,
            ]);
        }

        $bookmark = UserBookmark::create([
            'user_id' => $user->id,
            'tmdb_id' => $tmdbId,
            'media_type' => $mediaType,
            'title' => $validated['title'],
            'poster_path' => $validated['poster_path'] ?? null,
            'backdrop_path' => $validated['backdrop_path'] ?? null,
            'vote_average' => $validated['vote_average'] ?? null,
            'overview' => $validated['overview'] ?? null,
            'release_date' => $validated['release_date'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'bookmarked' => true,
            'data' => $bookmark,
        ]);
    }

    /**
     * Bulk sync bookmarks from guest localStorage to user database
     */
    public function syncBookmarks(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required',
            'items.*.title' => 'nullable|string',
            'items.*.name' => 'nullable|string',
            'items.*.media_type' => 'nullable|string',
            'items.*.poster_path' => 'nullable|string',
            'items.*.backdrop_path' => 'nullable|string',
            'items.*.vote_average' => 'nullable|numeric',
            'items.*.overview' => 'nullable|string',
            'items.*.release_date' => 'nullable|string',
        ]);

        foreach ($validated['items'] as $item) {
            $tmdbId = (string) $item['id'];
            $mediaType = $item['media_type'] ?? 'movie';
            $title = $item['title'] ?? $item['name'] ?? 'Untitled';

            UserBookmark::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'tmdb_id' => $tmdbId,
                    'media_type' => $mediaType,
                ],
                [
                    'title' => $title,
                    'poster_path' => $item['poster_path'] ?? null,
                    'backdrop_path' => $item['backdrop_path'] ?? null,
                    'vote_average' => $item['vote_average'] ?? null,
                    'overview' => $item['overview'] ?? null,
                    'release_date' => $item['release_date'] ?? null,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'data' => $user->bookmarks()->get(),
        ]);
    }

    /**
     * Render the Netflix-style Account page
     */
    public function accountPage(Request $request)
    {
        $user = $request->user();
        $histories = $user->watchHistories()->orderByDesc('last_watched_at')->limit(50)->get();
        $bookmarks = $user->bookmarks()->orderByDesc('created_at')->get();

        return \Inertia\Inertia::render('Account', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar ?? 'red_smile',
                'has_pin' => (bool) $user->has_pin,
                'created_at' => $user->created_at?->format('d M Y') ?? 'Member',
            ],
            'watchHistories' => $histories,
            'bookmarks' => $bookmarks,
            'initialTab' => $request->query('tab', 'profile'),
        ]);
    }

    /**
     * Update user name, email, and avatar
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'avatar' => 'nullable|string|in:red_smile,blue_classic,yellow_chill,green_zen,purple_mystic,dark_ninja',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'avatar' => $validated['avatar'] ?? $user->avatar ?? 'red_smile',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'has_pin' => (bool) $user->has_pin,
            ],
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui',
        ]);
    }

    /**
     * Set, update, or remove 4-digit profile PIN
     */
    public function updatePin(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'remove' => 'nullable|boolean',
            'pin' => 'nullable|string|digits:4',
            'current_pin' => 'nullable|string|digits:4',
        ]);

        if (!empty($validated['remove'])) {
            if ($user->has_pin && !empty($validated['current_pin'])) {
                if (!\Illuminate\Support\Facades\Hash::check($validated['current_pin'], $user->pin)) {
                    return response()->json(['success' => false, 'error' => 'PIN saat ini salah'], 422);
                }
            }
            $user->update(['pin' => null]);
            return response()->json(['success' => true, 'message' => 'PIN berhasil dihapus', 'has_pin' => false]);
        }

        if (empty($validated['pin'])) {
            return response()->json(['success' => false, 'error' => 'PIN 4-digit harus diisi'], 422);
        }

        if ($user->has_pin) {
            if (empty($validated['current_pin']) || !\Illuminate\Support\Facades\Hash::check($validated['current_pin'], $user->pin)) {
                return response()->json(['success' => false, 'error' => 'PIN lama salah'], 422);
            }
        }

        $user->update([
            'pin' => \Illuminate\Support\Facades\Hash::make($validated['pin']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'PIN profil berhasil disimpan',
            'has_pin' => true,
        ]);
    }
}
