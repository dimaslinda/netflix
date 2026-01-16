<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class InternetArchiveService
{
    public function searchPublicDomain($page = 1, $rows = 20)
    {
        $query = 'collection:feature_films AND mediatype:movies';

        $response = Http::get('https://archive.org/advancedsearch.php', [
            'q' => $query,
            'fl[]' => ['identifier', 'title', 'description'],
            'rows' => $rows,
            'page' => $page,
            'output' => 'json',
        ]);

        if (! $response->successful()) {
            return [
                'response' => [
                    'docs' => [],
                ],
            ];
        }

        return $response->json();
    }

    public function getMetadata($identifier)
    {
        $response = Http::get("https://archive.org/metadata/{$identifier}");

        if (! $response->successful()) {
            return [
                'metadata' => null,
                'files' => [],
            ];
        }

        return $response->json();
    }
}
