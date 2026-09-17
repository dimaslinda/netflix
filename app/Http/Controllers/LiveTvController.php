<?php

namespace App\Http\Controllers;

use App\Services\LiveTvService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveTvController extends Controller
{
    protected LiveTvService $liveTvService;

    public function __construct(LiveTvService $liveTvService)
    {
        $this->liveTvService = $liveTvService;
    }

    /**
     * Halaman antarmuka siaran langsung Live TV.
     */
    public function index(Request $request): Response
    {
        $channels = $this->liveTvService->getChannels();
        $categories = $this->liveTvService->getCategories();

        $selectedChannelId = $request->query('channel');
        $selectedCategory = $request->query('category', 'all');

        // Jika channel yang dipilih tidak ditemukan, pakai channel pertama
        $channelExists = collect($channels)->firstWhere('id', $selectedChannelId);
        $activeChannelId = $channelExists ? $selectedChannelId : ($channels[0]['id'] ?? '');

        return Inertia::render('LiveTv', [
            'channels' => $channels,
            'categories' => $categories,
            'initialChannelId' => $activeChannelId,
            'initialCategory' => $selectedCategory,
        ]);
    }

    /**
     * Endpoint API data channel siaran langsung.
     */
    public function channels(): JsonResponse
    {
        return response()->json([
            'categories' => $this->liveTvService->getCategories(),
            'channels' => $this->liveTvService->getChannels(),
        ]);
    }
}
