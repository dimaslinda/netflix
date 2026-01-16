import { Head } from '@inertiajs/react';
import { ArrowLeft, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    type TmdbDetails,
    type TmdbSeasonDetails,
    type TmdbVideosApiResponse,
} from '@/types/tmdb';

interface MovieDetailProps {
    type: 'movie' | 'tv';
    id: string;
}

export default function MovieDetail({ type, id }: MovieDetailProps) {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [videos, setVideos] = useState<TmdbVideosApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [seasonDetails, setSeasonDetails] =
        useState<TmdbSeasonDetails | null>(null);
    const [seasonLoading, setSeasonLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            fetch(`/api/tmdb/${type}/${id}`).then((r) => r.json()),
            fetch(`/api/tmdb/${type}/${id}/videos`).then((r) => r.json()),
        ])
            .then(([detailJson, videosJson]) => {
                if (cancelled) return;
                setDetails(detailJson as TmdbDetails);
                setVideos(videosJson as TmdbVideosApiResponse);
            })
            .catch(() => {
                if (cancelled) return;
                setDetails(null);
                setVideos(null);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [type, id]);

    useEffect(() => {
        if (type !== 'tv') return;
        if (!id) return;
        if (!season) return;

        const controller = new AbortController();

        Promise.resolve()
            .then(() => {
                if (!controller.signal.aborted) {
                    setSeasonLoading(true);
                }
            })
            .then(() =>
                fetch(`/api/tmdb/tv/${id}/season/${season}`, {
                    signal: controller.signal,
                }),
            )
            .then((r) => r.json())
            .then((json: TmdbSeasonDetails) => {
                if (!controller.signal.aborted) {
                    setSeasonDetails(json);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSeasonLoading(false);
                }
            });

        return () => controller.abort();
    }, [type, id, season]);

    const title = useMemo(() => {
        if (!details) return 'Detail';
        return (
            details.title || details.name || details.original_name || 'Detail'
        );
    }, [details]);

    const year = useMemo(() => {
        if (!details) return '';
        const date = details.release_date || details.first_air_date || '';
        return date ? date.slice(0, 4) : '';
    }, [details]);

    const backdropPath = details?.backdrop_path || details?.poster_path || null;
    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/original${backdropPath}`
        : 'https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image';

    const trailerEmbed = videos?.best?.embed_url || null;

    const handleBack = () => {
        window.history.back();
    };

    const handlePlay = () => {
        const baseType = type === 'tv' ? 'tv' : 'movie';
        const url =
            baseType === 'tv'
                ? `/watch/tv/${id}?season=${season}&episode=${episode}`
                : `/watch/movie/${id}`;
        window.location.href = url;
    };

    const genres = details?.genres || [];
    const durationMinutes = details?.runtime || null;

    return (
        <div className="min-h-screen bg-[#141414] text-white">
            <Head title={title} />

            <div className="relative">
                <div className="relative h-[60vh] w-full bg-black md:h-[70vh]">
                    {trailerEmbed ? (
                        <iframe
                            src={trailerEmbed}
                            className="h-full w-full"
                            title={title}
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                        />
                    ) : (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

                    <button
                        type="button"
                        onClick={handleBack}
                        className="absolute top-4 left-4 z-20 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 md:top-8 md:left-8"
                    >
                        <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                    </button>

                    <div className="absolute right-0 bottom-0 left-0 px-4 pb-8 md:px-16 md:pb-12">
                        <h1 className="text-2xl font-bold md:text-4xl lg:text-6xl">
                            {title}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-200 md:text-base">
                            {year ? <span>{year}</span> : null}
                            {durationMinutes ? (
                                <span>{durationMinutes} min</span>
                            ) : null}
                            <span className="rounded border border-zinc-500 px-2 py-0.5 text-xs tracking-wide uppercase">
                                {type === 'tv' ? 'TV Series' : 'Movie'}
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-x-2 rounded bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-[#e6e6e6] md:px-8 md:py-2.5 md:text-base"
                                onClick={handlePlay}
                            >
                                <Play className="h-4 w-4 text-black" />
                                Play
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="px-4 py-8 md:px-16 md:py-12">
                <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
                    <section className="space-y-8">
                        <div>
                            <h2 className="mb-3 text-lg font-semibold md:text-xl">
                                About
                            </h2>
                            <p className="text-sm leading-relaxed text-zinc-200 md:text-base">
                                {!loading && details?.overview
                                    ? details.overview
                                    : loading
                                      ? 'Loading...'
                                      : 'No description available.'}
                            </p>
                        </div>

                        {type === 'tv' && seasonDetails ? (
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold md:text-xl">
                                        Episodes
                                    </h2>
                                    <select
                                        className="rounded bg-zinc-800 px-3 py-1 text-sm text-white ring-0 outline-none"
                                        value={season}
                                        onChange={(e) => {
                                            const next = Number(e.target.value);
                                            setSeason(
                                                Number.isFinite(next) &&
                                                    next > 0
                                                    ? next
                                                    : 1,
                                            );
                                            setEpisode(1);
                                        }}
                                    >
                                        {(details?.seasons || []).map((s) => (
                                            <option
                                                key={s.id}
                                                value={s.season_number}
                                            >
                                                Season {s.season_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {seasonLoading ? (
                                    <p className="text-sm text-zinc-400">
                                        Loading episodes...
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {seasonDetails.episodes.map((ep) => (
                                            <button
                                                key={ep.id}
                                                type="button"
                                                className="flex w-full items-start gap-3 rounded bg-zinc-800/60 p-3 text-left transition hover:bg-zinc-700/80"
                                                onClick={() => {
                                                    setSeason(ep.season_number);
                                                    setEpisode(
                                                        ep.episode_number,
                                                    );
                                                    window.location.href = `/watch/tv/${id}?season=${ep.season_number}&episode=${ep.episode_number}`;
                                                }}
                                            >
                                                <div className="flex h-20 w-32 flex-none items-center justify-center overflow-hidden rounded bg-zinc-900">
                                                    {ep.still_path ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                                            alt={ep.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-zinc-500">
                                                            No image
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold">
                                                            {ep.episode_number}.{' '}
                                                            {ep.name}
                                                        </span>
                                                    </div>
                                                    <p className="line-clamp-2 text-xs text-zinc-300">
                                                        {ep.overview ||
                                                            'No description.'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </section>

                    <aside className="space-y-4 text-sm text-zinc-200">
                        {genres.length > 0 ? (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                                    Genres
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {genres.map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="rounded-full bg-zinc-800 px-3 py-1 text-xs"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {type === 'tv' && details?.seasons?.length ? (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                                    Seasons
                                </h3>
                                <ul className="space-y-1 text-xs md:text-sm">
                                    {details.seasons.map((s) => (
                                        <li
                                            key={s.id}
                                            className="flex items-center justify-between rounded bg-zinc-800/60 px-3 py-2"
                                        >
                                            <span>
                                                Season {s.season_number}
                                            </span>
                                            <span className="text-zinc-400">
                                                {s.episode_count} episodes
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </main>
        </div>
    );
}
