/**
 * Kontrak pemutaran, cerminan App\Support\Playback\StreamSource di backend.
 *
 * Pemutar tidak pernah tahu asal berkas. Ia hanya membaca `kind` lalu memilih
 * jalur pemuatan yang tepat. Menambah asal baru di backend tidak mengubah tipe
 * ini, jadi frontend tidak perlu ikut berubah.
 */
export type StreamKind = 'hls' | 'progressive';

export interface StreamSource {
    kind: StreamKind;
    url: string;
    provider: string;
    label: string;
    mime_type: string | null;
    poster: string | null;
}

export interface PlaybackProvider {
    provider: string;
    label: string;
}

export interface SubtitleTrack {
    id?: string | number;
    provider: 'subdl' | 'opensubtitles';
    /** Kode bahasa berkas takarir ini, misalnya "id" atau "en". */
    language: string;
    language_name?: string;
    release?: string | null;
    download_url: string;
    /**
     * True berarti bahasa sasaran tidak tersedia di penyedia mana pun, dan
     * berkas ini akan diterjemahkan lebih dulu sebelum sampai ke pemutar.
     */
    needs_translation: boolean;
}

export interface SubtitleMeta {
    target_language: string;
    translator: string;
    translator_available: boolean;
}

/** Satu judul yang bisa dipilih di pemilih sumber. */
export interface CatalogEntry {
    provider: string;
    reference: string;
    title: string;
    year?: number | string | null;
    license?: string | null;
    studio?: string | null;
    poster: string | null;
}

export interface LibraryEntry {
    path: string;
    name: string;
    size: number;
    modified_at: number;
}

export interface ApiEnvelope<T> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: Record<string, unknown>;
}
