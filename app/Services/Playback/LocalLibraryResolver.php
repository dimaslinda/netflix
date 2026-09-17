<?php

declare(strict_types=1);

namespace App\Services\Playback;

use App\Contracts\StreamResolver;
use App\Support\Playback\StreamSource;
use SplFileInfo;
use Symfony\Component\Finder\Finder;

/**
 * Memutar berkas video milik pengguna sendiri dari folder pustaka lokal.
 *
 * Tidak ada DRM, tidak ada perantara, tidak ada iklan. Berkas dilayani oleh
 * LocalMediaController yang mendukung HTTP Range, jadi seek tetap jalan pada
 * berkas besar tanpa memuat seluruhnya ke memori.
 */
final class LocalLibraryResolver implements StreamResolver
{
    public function provider(): string
    {
        return 'library';
    }

    public function label(): string
    {
        return 'Pustaka Lokal';
    }

    public function resolve(string $reference, array $options = []): ?StreamSource
    {
        $path = $this->resolvePath($reference);

        if ($path === null) {
            return null;
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeType = $this->allowedExtensions()[$extension] ?? null;

        if ($mimeType === null) {
            return null;
        }

        $url = route('media.stream', ['path' => $reference]);
        $label = pathinfo($path, PATHINFO_FILENAME);

        return $extension === 'm3u8'
            ? StreamSource::hls($url, $this->provider(), $label)
            : StreamSource::progressive($url, $this->provider(), $label, $mimeType);
    }

    /**
     * Ubah referensi relatif menjadi path absolut yang terbukti ada di dalam
     * folder pustaka. Kembalikan null bila di luar, termasuk lewat symlink.
     *
     * Ini satu-satunya gerbang antara masukan pengguna dan filesystem, jadi
     * setiap pemanggil wajib lewat sini.
     */
    public function resolvePath(string $reference): ?string
    {
        $root = realpath($this->libraryPath());

        if ($root === false) {
            return null;
        }

        // Tolak null byte sebelum menyentuh filesystem.
        if (str_contains($reference, "\0")) {
            return null;
        }

        $relative = ltrim(preg_replace('#[\\\\/]+#', '/', $reference) ?? '', '/');

        if ($relative === '') {
            return null;
        }

        $candidate = realpath($root.DIRECTORY_SEPARATOR.$relative);

        if ($candidate === false || ! is_file($candidate)) {
            return null;
        }

        // realpath sudah meratakan '..' dan symlink, jadi perbandingan awalan
        // di sini cukup untuk menjamin berkas berada di dalam pustaka.
        $rootPrefix = rtrim($root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        return str_starts_with($candidate, $rootPrefix) ? $candidate : null;
    }

    /**
     * Daftar isi pustaka untuk halaman pemilihan sumber.
     *
     * @return array<int, array{path: string, name: string, size: int, modified_at: int}>
     */
    public function listLibrary(): array
    {
        $root = realpath($this->libraryPath());

        if ($root === false) {
            return [];
        }

        $finder = (new Finder)
            ->files()
            ->in($root)
            ->name($this->extensionGlobs())
            ->sortByName();

        return array_values(array_map(
            fn (SplFileInfo $file): array => [
                'path' => str_replace(DIRECTORY_SEPARATOR, '/', $file->getRelativePathname()),
                'name' => $file->getBasename('.'.$file->getExtension()),
                'size' => (int) $file->getSize(),
                'modified_at' => (int) $file->getMTime(),
            ],
            iterator_to_array($finder, false),
        ));
    }

    /** @return array<string, string> */
    public function allowedExtensions(): array
    {
        /** @var array<string, string> $extensions */
        $extensions = config('media.extensions', []);

        return $extensions;
    }

    private function libraryPath(): string
    {
        return (string) config('media.library_path', storage_path('app/media'));
    }

    /** @return array<int, string> */
    private function extensionGlobs(): array
    {
        return array_map(
            static fn (string $extension): string => '*.'.$extension,
            array_keys($this->allowedExtensions()),
        );
    }
}
