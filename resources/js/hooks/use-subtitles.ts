import { useCallback, useEffect, useState } from 'react';

import type {
    ApiEnvelope,
    SubtitleMeta,
    SubtitleTrack,
} from '@/types/playback';

interface UseSubtitlesOptions {
    /** Kosong berarti judul ini tidak ada di TMDB; pencarian memakai judulnya. */
    tmdbId: string;
    type: 'movie' | 'tv';
    title?: string;
    /** Tahun rilis, mempersempit pencarian berbasis judul. */
    year?: number | null;
    season?: string;
    episode?: string;
    enabled?: boolean;
}

interface UseSubtitlesResult {
    tracks: SubtitleTrack[];
    selected: SubtitleTrack | null;
    select: (track: SubtitleTrack | null) => void;
    isSearching: boolean;
    error: string | null;
    meta: SubtitleMeta | null;
    trackUrl: (track: SubtitleTrack) => string;
}

interface SearchState {
    /** Kunci pencarian yang menghasilkan isi di bawah ini. */
    key: string | null;
    tracks: SubtitleTrack[];
    meta: SubtitleMeta | null;
    error: string | null;
}

interface SelectionState {
    key: string | null;
    track: SubtitleTrack | null;
}

/**
 * Mencari takarir untuk satu judul atau episode.
 *
 * Backend menjamin hasilnya: bila bahasa sasaran tidak ada di penyedia mana
 * pun, ia mengembalikan takarir bahasa cadangan dengan tanda needs_translation.
 * Hook ini meneruskan tanda itu ke URL pemutar supaya penerjemahan terjadi saat
 * berkas disajikan, bukan saat pencarian.
 *
 * Hasil dan pilihan pengguna sama-sama disimpan bersama kunci pencariannya,
 * jadi berpindah episode otomatis mengosongkan pilihan lama tanpa efek tambahan.
 */
export function useSubtitles({
    tmdbId,
    type,
    title,
    year,
    season,
    episode,
    enabled = true,
}: UseSubtitlesOptions): UseSubtitlesResult {
    const [search, setSearch] = useState<SearchState>({
        key: null,
        tracks: [],
        meta: null,
        error: null,
    });
    const [selection, setSelection] = useState<SelectionState>({
        key: null,
        track: null,
    });

    // Dua jalur pencarian. Judul yang ada di TMDB dicari lewat id, yang paling
    // tepat. Judul katalog terbuka tidak punya id sama sekali, jadi dicari
    // lewat judul dan tahunnya. Tanpa jalur kedua, justru film yang paling siap
    // ditonton yang tidak pernah kebagian takarir.
    const byTitle = !tmdbId || tmdbId === '0';
    const canSearch = enabled && (byTitle ? Boolean(title) : Boolean(tmdbId));

    const key = canSearch
        ? [
              byTitle ? 'title' : 'tmdb',
              byTitle ? (title ?? '') : tmdbId,
              year ?? '',
              type,
              season ?? '',
              episode ?? '',
          ].join('|')
        : null;

    useEffect(() => {
        if (key === null) {
            return;
        }

        const controller = new AbortController();

        let endpoint: string;

        if (byTitle) {
            const params = new URLSearchParams({ query: title ?? '' });

            if (year) {
                params.append('year', String(year));
            }

            endpoint = `/api/subtitles/search/query?${params.toString()}`;
        } else {
            const params = new URLSearchParams({ tmdb_id: tmdbId, type });

            if (title) {
                params.append('title', title);
            }

            if (type === 'tv' && season && episode) {
                params.append('season', season);
                params.append('episode', episode);
            }

            endpoint = `/api/subtitles/search?${params.toString()}`;
        }

        fetch(endpoint, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body = (await response.json()) as ApiEnvelope<
                    SubtitleTrack[]
                > & {
                    meta?: SubtitleMeta;
                };

                if (!response.ok || !body.success) {
                    throw new Error(body.message ?? 'Pencarian takarir gagal.');
                }

                setSearch({
                    key,
                    tracks: body.data ?? [],
                    meta: body.meta ?? null,
                    error: null,
                });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setSearch({
                    key,
                    tracks: [],
                    meta: null,
                    error:
                        cause instanceof Error
                            ? cause.message
                            : 'Pencarian takarir gagal.',
                });
            });

        return () => controller.abort();
    }, [key, byTitle, tmdbId, type, title, year, season, episode]);

    const isCurrent = search.key === key;
    const meta = isCurrent ? search.meta : null;

    const trackUrl = useCallback(
        (track: SubtitleTrack) => {
            const params = new URLSearchParams({
                url: track.download_url,
                from: track.language,
            });

            // Terjemahkan hanya bila memang perlu dan mesinnya siap. Tanpa
            // syarat kedua, backend akan menyajikan teks asli dan pemirsa
            // mengira takarirnya rusak.
            if (track.needs_translation && meta?.translator_available) {
                params.append('translate', '1');
            }

            return `/api/subtitles/stream?${params.toString()}`;
        },
        [meta],
    );

    const select = useCallback(
        (track: SubtitleTrack | null) => setSelection({ key, track }),
        [key],
    );

    return {
        tracks: isCurrent ? search.tracks : [],
        error: isCurrent ? search.error : null,
        isSearching: key !== null && !isCurrent,
        meta,
        // Pilihan dari episode sebelumnya otomatis gugur karena kuncinya beda.
        selected: selection.key === key ? selection.track : null,
        select,
        trackUrl,
    };
}
