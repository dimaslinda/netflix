import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import type { ApiEnvelope } from '@/types/playback';
import type { Movie } from '@/types/tmdb';

import MovieRow from './MovieRow';

/** Bentuk yang dikirim /api/catalog/playable: metadata TMDB ditempel pada satu
 *  berkas Internet Archive yang sudah terbukti bisa diputar. */
interface PlayableEntry {
    provider: string;
    reference: string;
    tmdb_id: number | null;
    title: string;
    overview: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number | null;
    release_date: string | null;
}

interface PlayableCatalogRowProps {
    title: string;
    /** Kata kunci pencarian di koleksi Archive. Kosong berarti yang terpopuler. */
    query?: string;
    note?: string;
}

/**
 * Baris judul yang punya berkas sekaligus punya metadata TMDB.
 *
 * Ini jawaban atas keluhan yang wajar: baris TMDB biasa terlihat menarik tetapi
 * hampir tidak ada yang bisa diputar. Di sini urutannya dibalik. Berkasnya
 * dipastikan ada lebih dulu di Internet Archive, baru dicarikan padanan TMDB
 * untuk poster, sinopsis, dan penilaian. Jadi setiap kartu di baris ini
 * menepati janjinya saat ditekan.
 */
export default function PlayableCatalogRow({
    title,
    query,
    note,
}: PlayableCatalogRowProps) {
    const [state, setState] = useState<{
        loaded: boolean;
        movies: Movie[];
        references: Map<number, PlayableEntry>;
    }>({ loaded: false, movies: [], references: new Map() });

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ rows: '25' });

        if (query) {
            params.append('q', query);
        }

        fetch(`/api/catalog/playable?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body = (await response.json()) as ApiEnvelope<
                    PlayableEntry[]
                >;

                if (!response.ok || !body.success) {
                    throw new Error('Katalog gagal dimuat.');
                }

                const entries = body.data ?? [];
                const references = new Map<number, PlayableEntry>();

                // MovieCard bekerja dengan bentuk Movie milik TMDB, jadi setiap
                // entri dipetakan ke bentuk itu. Id TMDB dipakai sebagai kunci
                // untuk menemukan kembali berkas Archive-nya saat kartu ditekan.
                const movies = entries.map((entry, index): Movie => {
                    const id = entry.tmdb_id ?? -(index + 1);
                    references.set(id, entry);

                    return {
                        id,
                        title: entry.title,
                        overview: entry.overview ?? undefined,
                        poster_path: entry.poster_path,
                        backdrop_path: entry.backdrop_path,
                        vote_average: entry.vote_average ?? undefined,
                        release_date: entry.release_date ?? undefined,
                        media_type: 'movie',
                    } as Movie;
                });

                setState({ loaded: true, movies, references });
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setState({
                        loaded: true,
                        movies: [],
                        references: new Map(),
                    });
                }
            });

        return () => controller.abort();
    }, [query]);

    // Baris kosong tidak ditampilkan sama sekali. Rangka penahan yang tidak
    // pernah terisi lebih membingungkan daripada baris yang memang tidak ada.
    if (!state.loaded || state.movies.length === 0) {
        return null;
    }

    return (
        <MovieRow
            title={title}
            note={note}
            movies={state.movies}
            onSelect={(movie) => {
                const entry = state.references.get(movie.id);

                if (entry) {
                    router.visit(
                        `/tonton?provider=${encodeURIComponent(entry.provider)}&reference=${encodeURIComponent(entry.reference)}`,
                    );
                }
            }}
        />
    );
}
