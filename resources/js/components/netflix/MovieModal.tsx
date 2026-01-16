import { Info, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Movie,
    TmdbDetails,
    TmdbSeasonDetails,
    TmdbVideosApiResponse,
} from '@/types/tmdb';

interface MovieModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    movie: Movie | null;
}

type MediaType = 'movie' | 'tv';

function getMediaType(movie: Movie): MediaType {
    return movie.media_type === 'tv' ? 'tv' : 'movie';
}

function getTitle(movie: Movie): string {
    return movie.title || movie.name || movie.original_name || 'Untitled';
}

export default function MovieModal({
    open,
    onOpenChange,
    movie,
}: MovieModalProps) {
    const mediaType = useMemo(
        () => (movie ? getMediaType(movie) : 'movie'),
        [movie],
    );
    const id = movie?.id;

    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [videos, setVideos] = useState<TmdbVideosApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [seasonDetails, setSeasonDetails] =
        useState<TmdbSeasonDetails | null>(null);
    const [seasonLoading, setSeasonLoading] = useState(false);

    useEffect(() => {
        if (!open || !id || !movie) return;

        let cancelled = false;

        Promise.all([
            fetch(`/api/tmdb/${mediaType}/${id}`).then((r) => r.json()),
            fetch(`/api/tmdb/${mediaType}/${id}/videos`).then((r) => r.json()),
        ])
            .then(([detailJson, videosJson]) => {
                if (cancelled) return;
                setDetails(detailJson as TmdbDetails);
                setVideos(videosJson as TmdbVideosApiResponse);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, id, mediaType, movie]);

    useEffect(() => {
        if (!open || !id || mediaType !== 'tv') return;

        const controller = new AbortController();
        fetch(`/api/tmdb/tv/${id}/season/${season}`, {
            signal: controller.signal,
        })
            .then((r) => r.json())
            .then((json: TmdbSeasonDetails) => {
                setSeasonDetails(json);
            })
            .catch(() => {})
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSeasonLoading(false);
                }
            });

        return () => controller.abort();
    }, [open, id, mediaType, season]);

    const backdropPath = movie?.backdrop_path || details?.backdrop_path || null;
    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/original${backdropPath}`
        : 'https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image';

    const title = movie ? getTitle(movie) : '';
    const overview = details?.overview || movie?.overview || '';
    const trailerEmbed = videos?.best?.embed_url || null;

    const handlePlay = () => {
        if (!movie) return;
        const url =
            mediaType === 'tv'
                ? `/watch/tv/${movie.id}?season=${season}&episode=${episode}`
                : `/watch/movie/${movie.id}`;
        window.location.href = url;
    };

    const handleMoreInfoPage = () => {
        if (!movie) return;
        const url =
            mediaType === 'tv'
                ? `/title/tv/${movie.id}`
                : `/title/movie/${movie.id}`;
        window.location.href = url;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-white',
                )}
            >
                <div className="relative">
                    <div className="relative aspect-video w-full bg-black">
                        {trailerEmbed ? (
                            <iframe
                                className="h-full w-full"
                                src={trailerEmbed}
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
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/10 to-transparent" />
                    </div>

                    <div className="absolute right-0 bottom-0 left-0 px-6 pb-5">
                        <h2 className="text-2xl font-bold md:text-3xl">
                            {title}
                        </h2>
                        {mediaType === 'tv' ? (
                            <div className="mt-3 flex items-center gap-3">
                                <div className="w-28">
                                    <Input
                                        type="number"
                                        value={season}
                                        min={1}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setSeason(
                                                Number.isFinite(v) && v > 0
                                                    ? v
                                                    : 1,
                                            );
                                        }}
                                        className="border-zinc-700 text-white"
                                    />
                                </div>
                                <div className="w-28">
                                    <Input
                                        type="number"
                                        value={episode}
                                        min={1}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setEpisode(
                                                Number.isFinite(v) && v > 0
                                                    ? v
                                                    : 1,
                                            );
                                        }}
                                        className="border-zinc-700 text-white"
                                    />
                                </div>
                            </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-x-2 rounded bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-[#e6e6e6]"
                                onClick={handlePlay}
                            >
                                <Play className="h-4 w-4" fill="black" />
                                Play
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-x-2 rounded bg-[gray]/70 px-5 py-2 text-sm font-bold text-white transition hover:bg-[gray]/40"
                                onClick={handleMoreInfoPage}
                            >
                                <Info className="h-4 w-4" />
                                More Info
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-x-2 rounded bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition hover:bg-zinc-700"
                                onClick={() => onOpenChange(false)}
                            >
                                <Info className="h-4 w-4" />
                                Close
                            </button>
                            {loading ? (
                                <span className="text-sm text-zinc-300">
                                    Loading...
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-56.25vw)] overflow-y-auto px-6 pt-6 pb-8 md:max-h-[calc(90vh-360px)]">
                    <p className="text-sm leading-relaxed text-zinc-200 md:text-base">
                        {overview || 'No description available.'}
                    </p>
                    {mediaType === 'tv' && seasonDetails ? (
                        <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Episodes - Season {season}
                                </h3>
                                {seasonLoading ? (
                                    <span className="text-xs text-zinc-400">
                                        Loading episodes...
                                    </span>
                                ) : null}
                            </div>
                            <div className="max-h-64 space-y-3 overflow-y-auto">
                                {seasonDetails.episodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        type="button"
                                        className="flex w-full items-start gap-3 rounded bg-zinc-800/60 p-3 text-left hover:bg-zinc-700/80"
                                        onClick={() => {
                                            setSeason(ep.season_number);
                                            setEpisode(ep.episode_number);
                                            window.location.href = `/watch/tv/${id}?season=${ep.season_number}&episode=${ep.episode_number}`;
                                        }}
                                    >
                                        <div className="flex h-16 w-28 flex-none items-center justify-center overflow-hidden rounded bg-zinc-900">
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
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
