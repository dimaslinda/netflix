<?php

declare(strict_types=1);

namespace App\Support\Playback;

use JsonSerializable;

/**
 * Hasil akhir resolusi satu sumber tontonan.
 *
 * Objek ini sengaja dibuat immutable supaya resolver tidak bisa saling
 * mengubah hasil resolver lain saat manager melakukan iterasi.
 */
final readonly class StreamSource implements JsonSerializable
{
    /** Playlist adaptif (.m3u8) yang diputar lewat hls.js. */
    public const KIND_HLS = 'hls';

    /** Berkas tunggal (mp4/webm/ogv) yang diputar langsung oleh <video>. */
    public const KIND_PROGRESSIVE = 'progressive';

    /**
     * @param  string  $kind      self::KIND_HLS atau self::KIND_PROGRESSIVE
     * @param  string  $url       URL yang dikonsumsi pemutar di browser
     * @param  string  $provider  Identitas resolver asal, untuk telemetri dan UI
     * @param  string  $label     Teks yang tampil di pemilih sumber
     * @param  string|null  $mimeType  Diisi untuk progressive, membantu Safari
     * @param  string|null  $poster    Gambar sampul opsional
     */
    public function __construct(
        public string $kind,
        public string $url,
        public string $provider,
        public string $label,
        public ?string $mimeType = null,
        public ?string $poster = null,
    ) {}

    public static function hls(string $url, string $provider, string $label, ?string $poster = null): self
    {
        return new self(self::KIND_HLS, $url, $provider, $label, 'application/vnd.apple.mpegurl', $poster);
    }

    public static function progressive(
        string $url,
        string $provider,
        string $label,
        string $mimeType = 'video/mp4',
        ?string $poster = null,
    ): self {
        return new self(self::KIND_PROGRESSIVE, $url, $provider, $label, $mimeType, $poster);
    }

    /**
     * @return array{kind: string, url: string, provider: string, label: string, mime_type: string|null, poster: string|null}
     */
    public function jsonSerialize(): array
    {
        return [
            'kind' => $this->kind,
            'url' => $this->url,
            'provider' => $this->provider,
            'label' => $this->label,
            'mime_type' => $this->mimeType,
            'poster' => $this->poster,
        ];
    }
}
