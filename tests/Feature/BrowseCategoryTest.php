<?php

namespace Tests\Feature;

use Tests\TestCase;

class BrowseCategoryTest extends TestCase
{
    public function test_browse_disney_category_loads_successfully(): void
    {
        $response = $this->get('/browse/disney');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('BrowseCategory')
            ->where('category', 'disney')
            ->where('title', 'Disney+ Hotstar')
            ->has('results.results')
        );

        $results = $response->original->getData()['page']['props']['results']['results'] ?? [];
        $this->assertNotEmpty($results, 'Disney+ results should not be empty');
        $this->assertGreaterThan(0, count($results));
    }

    public function test_home_page_with_disney_provider(): void
    {
        $response = $this->get('/?provider=disney');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Home')
            ->where('provider', 'disney')
            ->has('trending.results')
        );

        $trending = $response->original->getData()['page']['props']['trending']['results'] ?? [];
        $this->assertNotEmpty($trending, 'Trending results for Disney provider should not be empty');
    }

    public function test_browse_kids_category_loads_successfully(): void
    {
        $response = $this->get('/browse/kids');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('BrowseCategory')
            ->where('category', 'kids')
            ->where('title', 'Film & Acara Anak-anak')
            ->has('results.results')
        );

        $results = $response->original->getData()['page']['props']['results']['results'] ?? [];
        $this->assertNotEmpty($results, 'Kids category results should not be empty');
        $this->assertGreaterThan(0, count($results));
    }
}
