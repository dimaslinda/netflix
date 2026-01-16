<?php

namespace App\Http\Controllers;

use App\Services\InternetArchiveService;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    protected $archive;

    public function __construct(InternetArchiveService $archive)
    {
        $this->archive = $archive;
    }

    public function publicDomain(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $rows = min(50, max(1, (int) $request->query('rows', 20)));

        $json = $this->archive->searchPublicDomain($page, $rows);
        $docs = $json['response']['docs'] ?? [];

        $items = array_values(array_map(function ($doc) {
            $identifier = $doc['identifier'] ?? null;

            return [
                'identifier' => $identifier,
                'title' => $doc['title'] ?? $identifier,
                'description' => $doc['description'] ?? null,
                'thumbnail' => $identifier ? "https://archive.org/services/img/{$identifier}" : null,
            ];
        }, is_array($docs) ? $docs : []));

        return response()->json([
            'page' => $page,
            'rows' => $rows,
            'items' => $items,
        ]);
    }

    public function metadata($identifier)
    {
        return response()->json($this->archive->getMetadata($identifier));
    }
}
