<?php

namespace Tests\Feature;

use Tests\TestCase;

class LiveTvTest extends TestCase
{
    public function test_live_tv_page_renders_successfully(): void
    {
        $response = $this->get('/live-tv');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('LiveTv')
            ->has('channels')
            ->has('categories')
            ->has('initialChannelId')
            ->has('initialCategory')
        );

        $channels = $response->original->getData()['page']['props']['channels'] ?? [];
        $this->assertNotEmpty($channels, 'Channels list should not be empty');
        $this->assertGreaterThanOrEqual(20, count($channels), 'Channels list should have comprehensive lineup');
        $this->assertArrayHasKey('name', $channels[0]);
        $this->assertArrayHasKey('type', $channels[0]);
    }

    public function test_live_tv_api_channels_returns_json(): void
    {
        $response = $this->getJson('/api/live-tv/channels');

        $response->assertOk();
        $response->assertJsonStructure([
            'categories',
            'channels' => [
                '*' => ['id', 'name', 'category', 'type'],
            ],
        ]);
    }
}
