<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Playback\StreamResolverManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Satu-satunya endpoint yang dipakai pemutar untuk memperoleh URL tontonan.
 */
final class PlaybackController extends Controller
{
    public function __construct(private readonly StreamResolverManager $resolvers) {}

    public function providers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->resolvers->available(),
        ]);
    }

    public function resolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'max:32'],
            'reference' => ['required', 'string', 'max:1024'],
        ]);

        if (! $this->resolvers->has($validated['provider'])) {
            return response()->json([
                'success' => false,
                'message' => 'Penyedia tidak dikenal.',
            ], 404);
        }

        $source = $this->resolvers->resolve($validated['provider'], $validated['reference']);

        if ($source === null) {
            return response()->json([
                'success' => false,
                'message' => 'Sumber tidak ditemukan atau formatnya tidak didukung.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $source,
        ]);
    }
}
