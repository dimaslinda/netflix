import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Loader2, Play, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import Navbar from '@/components/netflix/Navbar';
import { cn } from '@/lib/utils';
import {
    type TmdbDetails,
    type TmdbSeasonDetails,
    type TmdbVideosApiResponse,
} from '@/types/tmdb';

interface MovieDetailProps {
    type: 'movie' | 'tv';
    id: string;
}

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Halaman rincian satu judul.
 *
 * Irama halaman ini sengaja berbeda dari beranda: satu panel pembuka besar,
 * lalu dua kolom teks. Tidak ada baris carousel sama sekali, karena pemirsa
 * yang sampai di sini sudah memilih dan tidak perlu ditawari judul lain.
 */
export default function MovieDetail({ type, id }: MovieDetailProps) {
    const [status, setStatus] = useState<LoadStatus>('loading');
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [videos, setVideos] = useState<TmdbVideosApiResponse | null>(null);

    const [season, setSeason] = useState(1);
    const [loadedSeason, setLoadedSeason] = useState<{
        season: number;
        details: TmdbSeasonDetails | null;
    } | null>(null);

    // Status memuat diturunkan dari perbandingan nomor musim, bukan disetel di
    // dalam efek. Respons musim lama juga tidak bisa menimpa musim yang baru.
    const seasonDetails =
        loadedSeason?.season === season ? loadedSeason.details : null;
    const isSeasonLoading = type === 'tv' && loadedSeason?.season !== season;

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            fetch(`/api/tmdb/${type}/${id}`, {
                signal: controller.signal,
            }).then((response) => response.json()),
            fetch(`/api/tmdb/${type}/${id}/videos`, {
                signal: controller.signal,
            }).then((response) => response.json()),
        ])
            .then(([detailJson, videoJson]) => {
                setDetails(detailJson as TmdbDetails);
                setVideos(videoJson as TmdbVideosApiResponse);
                setStatus('ready');
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setStatus('error');
                }
            });

        return () => controller.abort();
    }, [type, id]);

    useEffect(() => {
        if (type !== 'tv') {
            return;
        }

        const controller = new AbortController();

        fetch(`/api/tmdb/tv/${id}/season/${season}`, {
            signal: controller.signal,
        })
            .then((response) => response.json())
            .then((json: TmdbSeasonDetails) =>
                setLoadedSeason({ season, details: json }),
            )
            .catch(() => {
                if (!controller.signal.aborted) {
                    // Musim yang gagal dimuat tetap dicatat sebagai selesai,
                    // supaya daftar tidak berputar tanpa akhir.
                    setLoadedSeason({ season, details: null });
                }
            });

        return () => controller.abort();
    }, [type, id, season]);

    const title =
        details?.title ?? details?.name ?? details?.original_name ?? '';
    const year = (details?.release_date ?? details?.first_air_date)?.slice(
        0,
        4,
    );
    const rating =
        typeof details?.vote_average === 'number' && details.vote_average > 0
            ? details.vote_average.toFixed(1)
            : null;

    const artPath = details?.backdrop_path ?? details?.poster_path;
    const artUrl = artPath
        ? `https://image.tmdb.org/t/p/original${artPath}`
        : null;

    const trailerEmbed = videos?.best?.embed_url ?? null;

    const play = () =>
        router.visit(
            type === 'tv'
                ? `/watch/tv/${id}?season=${season}&episode=1`
                : `/watch/movie/${id}`,
        );

    if (status === 'loading') {
        return (
            <PageShell title="Memuat">
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[var(--cinema-ink-faint)]">
                    <Loader2
                        className="h-8 w-8 animate-spin"
                        aria-hidden="true"
                    />
                    <p className="text-sm">Memuat rincian judul...</p>
                </div>
            </PageShell>
        );
    }

    if (status === 'error' || !details) {
        return (
            <PageShell title="Gagal memuat">
                <div className="mx-auto mt-24 max-w-lg rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-8 py-14 text-center">
                    <p className="font-semibold">Rincian tidak terbaca</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--cinema-ink-soft)]">
                        TMDB tidak merespons, atau judul ini tidak ada di sana.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="cinema-focus mt-6 inline-flex min-h-11 items-center rounded bg-[var(--cinema-accent)] px-5 text-sm font-bold text-[var(--cinema-accent-ink)] transition hover:brightness-110"
                    >
                        Muat ulang
                    </button>
                </div>
            </PageShell>
        );
    }

    const genres = details.genres ?? [];

    return (
        <PageShell title={title}>
            <div className="relative h-[58vh] min-h-[420px] w-full bg-[var(--cinema-raised)]">
                {trailerEmbed ? (
                    <iframe
                        src={trailerEmbed}
                        title={`Cuplikan ${title}`}
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        className="h-full w-full"
                    />
                ) : artUrl ? (
                    <img
                        src={artUrl}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                ) : null}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--cinema-base)] via-[var(--cinema-base)]/50 to-transparent" />

                <button
                    type="button"
                    onClick={() => window.history.back()}
                    aria-label="Kembali"
                    className="cinema-focus absolute top-20 left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-[var(--cinema-ink)] transition hover:bg-black/80 md:left-12"
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="absolute inset-x-0 bottom-0 px-4 pb-8 md:px-12 md:pb-12 lg:px-16">
                    <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                        {title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--cinema-ink-soft)]">
                        {rating && (
                            <span className="flex items-center gap-1.5 text-[var(--cinema-accent)]">
                                <Star
                                    className="h-3.5 w-3.5 fill-current"
                                    aria-hidden="true"
                                />
                                {rating}
                                <span className="text-[var(--cinema-ink-faint)]">
                                    dari 10 di TMDB
                                </span>
                            </span>
                        )}
                        {year && <span>{year}</span>}
                        {details.runtime && (
                            <span>{details.runtime} menit</span>
                        )}
                        <span>{type === 'tv' ? 'Serial' : 'Film'}</span>
                    </div>

                    <button
                        type="button"
                        onClick={play}
                        className="cinema-focus mt-5 flex min-h-11 items-center gap-2 rounded bg-[var(--cinema-ink)] px-6 text-[15px] font-bold text-[var(--cinema-base)] transition hover:bg-white active:scale-[0.98]"
                    >
                        <Play
                            className="h-5 w-5"
                            fill="currentColor"
                            aria-hidden="true"
                        />
                        Putar
                    </button>
                </div>
            </div>

            <main className="grid gap-10 px-4 py-12 md:grid-cols-[2fr_1fr] md:px-12 lg:px-16">
                <div className="space-y-10">
                    <section>
                        <h2 className="text-lg font-bold">Sinopsis</h2>
                        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--cinema-ink-soft)]">
                            {details.overview ??
                                'Sinopsis belum tersedia di TMDB.'}
                        </p>
                    </section>

                    {type === 'tv' && (
                        <section>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-bold">Episode</h2>

                                <label className="flex items-center gap-2 text-sm">
                                    <span className="text-[var(--cinema-ink-faint)]">
                                        Musim
                                    </span>
                                    <select
                                        value={season}
                                        onChange={(event) =>
                                            setSeason(
                                                Number(event.target.value),
                                            )
                                        }
                                        className="cinema-focus min-h-11 rounded bg-[var(--cinema-raised)] px-3 text-sm font-semibold text-[var(--cinema-ink)]"
                                    >
                                        {(details.seasons ?? []).map(
                                            (entry) => (
                                                <option
                                                    key={entry.id}
                                                    value={entry.season_number}
                                                >
                                                    Musim {entry.season_number}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                            </div>

                            {isSeasonLoading ? (
                                <p className="mt-6 flex items-center gap-2 text-sm text-[var(--cinema-ink-faint)]">
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                    Memuat daftar episode...
                                </p>
                            ) : (seasonDetails?.episodes?.length ?? 0) === 0 ? (
                                <p className="mt-6 text-sm text-[var(--cinema-ink-faint)]">
                                    Daftar episode musim ini belum ada di TMDB.
                                </p>
                            ) : (
                                <ul className="mt-5 space-y-2.5">
                                    {seasonDetails?.episodes.map((episode) => (
                                        <li key={episode.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.visit(
                                                        `/watch/tv/${id}?season=${episode.season_number}&episode=${episode.episode_number}`,
                                                    )
                                                }
                                                className="cinema-focus flex w-full gap-4 rounded-[var(--cinema-radius-panel)] bg-[var(--cinema-raised)] p-3 text-left transition hover:bg-[var(--cinema-overlay)]"
                                            >
                                                <span className="aspect-video w-32 flex-none overflow-hidden rounded bg-[var(--cinema-overlay)]">
                                                    {episode.still_path && (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                                            alt=""
                                                            loading="lazy"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-semibold">
                                                        {episode.episode_number}
                                                        . {episode.name}
                                                    </span>
                                                    {episode.overview && (
                                                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[var(--cinema-ink-faint)]">
                                                            {episode.overview}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}
                </div>

                <aside className="space-y-8">
                    {genres.length > 0 && (
                        <section>
                            <h2 className="text-[11px] font-bold tracking-widest text-[var(--cinema-ink-faint)] uppercase">
                                Genre
                            </h2>
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {genres.map((genre) => (
                                    <li
                                        key={genre.id}
                                        className="rounded-full bg-[var(--cinema-raised)] px-3 py-1 text-xs text-[var(--cinema-ink-soft)]"
                                    >
                                        {genre.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {type === 'tv' && (details.seasons?.length ?? 0) > 0 && (
                        <section>
                            <h2 className="text-[11px] font-bold tracking-widest text-[var(--cinema-ink-faint)] uppercase">
                                Musim
                            </h2>
                            <ul className="mt-3 space-y-1.5">
                                {details.seasons?.map((entry) => (
                                    <li
                                        key={entry.id}
                                        className={cn(
                                            'flex items-center justify-between rounded bg-[var(--cinema-raised)] px-3 py-2 text-xs',
                                            entry.season_number === season &&
                                                'ring-1 ring-[var(--cinema-accent)]/50',
                                        )}
                                    >
                                        <span>Musim {entry.season_number}</span>
                                        <span className="text-[var(--cinema-ink-faint)]">
                                            {entry.episode_count} episode
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </main>
        </PageShell>
    );
}

function PageShell({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--cinema-base)] text-[var(--cinema-ink)]">
            <Head title={title} />
            <Navbar />
            {children}
        </div>
    );
}
