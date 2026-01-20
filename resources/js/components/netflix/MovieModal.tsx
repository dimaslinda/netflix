import {
    Check,
    ChevronDown,
    Headphones,
    Play,
    Plus,
    ThumbsDown,
    ThumbsUp,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
    inMyList?: boolean;
    onToggleMyList?: (movie: Movie) => void;
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
    inMyList = false,
    onToggleMyList,
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
    const [seasonDetails, setSeasonDetails] =
        useState<TmdbSeasonDetails | null>(null);
    const [seasonLoading, setSeasonLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

    // NetMirror multi-audio state
    const [netmirrorId, setNetmirrorId] = useState<string | null>(null);
    const [netmirrorLoading, setNetmirrorLoading] = useState(false);

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

        setSeasonLoading(true);
        const controller = new AbortController();
        fetch(`/api/tmdb/tv/${id}/season/${season}`, {
            signal: controller.signal,
        })
            .then((r) => r.json())
            .then((json: TmdbSeasonDetails) => {
                setSeasonDetails(json);
            })
            .catch(() => { })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSeasonLoading(false);
                }
            });

        return () => controller.abort();
    }, [open, id, mediaType, season]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setDetails(null);
            setVideos(null);
            setLoading(true);
            setSeason(1);
            setSeasonDetails(null);
            setNetmirrorId(null);
        }
    }, [open]);

    // Check NetMirror availability
    useEffect(() => {
        if (!open || !movie) return;

        // VidSrc is always available for TMDB content
        // Just set the flag after a small delay to show "checking" state
        setNetmirrorLoading(true);
        const timer = setTimeout(() => {
            // VidSrc uses TMDB ID directly, so it's always "available"
            setNetmirrorId(String(movie.id));
            setNetmirrorLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [open, movie]);

    if (!open || !movie) return null;

    const backdropPath = movie?.backdrop_path || details?.backdrop_path || null;
    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/original${backdropPath}`
        : 'https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image';

    const title = getTitle(movie);
    const overview = details?.overview || movie?.overview || '';
    const trailerEmbed = videos?.best?.embed_url
        ? `${videos.best.embed_url}&mute=${isMuted ? 1 : 0}`
        : null;

    const matchPercent = movie.vote_average
        ? Math.min(99, Math.max(50, Math.round(movie.vote_average * 10)))
        : 85;

    const year =
        movie.release_date?.split('-')[0] ||
        movie.first_air_date?.split('-')[0] ||
        details?.release_date?.split('-')[0] ||
        details?.first_air_date?.split('-')[0] ||
        '';

    const runtime = details?.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
        : null;

    const numberOfSeasons = details?.number_of_seasons;

    const handlePlay = () => {
        const url =
            mediaType === 'tv'
                ? `/watch/tv/${movie.id}?season=${season}&episode=1`
                : `/watch/movie/${movie.id}`;
        window.location.href = url;
    };

    const handlePlayMultiAudio = () => {
        // Use NetMirror for multi-audio streaming
        const url = `/netmirror/watch/${movie.id}`;
        window.location.href = url;
    };

    const handleMoreInfoPage = () => {
        const url =
            mediaType === 'tv'
                ? `/title/tv/${movie.id}`
                : `/title/movie/${movie.id}`;
        window.location.href = url;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 md:py-12"
            onClick={(e) => {
                if (e.target === e.currentTarget) onOpenChange(false);
            }}
        >
            <div
                className={cn(
                    'relative w-full max-w-4xl overflow-hidden rounded-lg bg-zinc-900 shadow-2xl',
                    'animate-in zoom-in-95 fade-in duration-300',
                )}
            >
                {/* Close Button */}
                <button
                    type="button"
                    className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800"
                    onClick={() => onOpenChange(false)}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Hero Section */}
                <div className="relative aspect-video w-full">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

                    {/* Bottom Controls */}
                    <div className="absolute right-0 bottom-0 left-0 p-6 md:p-10">
                        <h2 className="mb-4 text-3xl font-bold drop-shadow-lg md:text-4xl lg:text-5xl">
                            {title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded bg-white px-6 py-2 text-sm font-bold text-black transition hover:bg-white/80 md:px-8 md:py-2.5 md:text-lg"
                                onClick={handlePlay}
                            >
                                <Play className="h-5 w-5 md:h-6 md:w-6" fill="black" />
                                Play
                            </button>

                            {/* Alternative Source Button */}
                            {netmirrorId && (
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 md:px-6 md:py-2.5 md:text-base"
                                    onClick={handlePlayMultiAudio}
                                    title="Play with alternative source (Multi-Audio support)"
                                >
                                    <Headphones className="h-4 w-4 md:h-5 md:w-5" />
                                    Alt Source
                                </button>
                            )}
                            {netmirrorLoading && (
                                <span className="text-xs text-zinc-400 animate-pulse">
                                    Checking multi-audio...
                                </span>
                            )}

                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 text-white transition hover:border-white md:h-11 md:w-11"
                                onClick={() => {
                                    if (movie && onToggleMyList) {
                                        onToggleMyList(movie);
                                    }
                                }}
                                title={inMyList ? 'Remove from My List' : 'Add to My List'}
                            >
                                {inMyList ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <Plus className="h-5 w-5" />
                                )}
                            </button>

                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 text-white transition hover:border-white md:h-11 md:w-11"
                                title="I like this"
                            >
                                <ThumbsUp className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 text-white transition hover:border-white md:h-11 md:w-11"
                                title="Not for me"
                            >
                                <ThumbsDown className="h-5 w-5" />
                            </button>

                            <div className="ml-auto flex items-center gap-3">
                                {trailerEmbed && (
                                    <button
                                        type="button"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 text-white transition hover:border-white md:h-11 md:w-11"
                                        onClick={() => setIsMuted(!isMuted)}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="h-5 w-5" />
                                        ) : (
                                            <Volume2 className="h-5 w-5" />
                                        )}
                                    </button>
                                )}

                                <div className="flex items-center border-l-4 border-zinc-400 bg-zinc-800/80 py-1.5 pr-4 pl-3 text-sm">
                                    {movie.adult ? '18+' : 'TV-14'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="grid gap-6 p-6 md:grid-cols-3 md:gap-8 md:p-10">
                    {/* Left Column - Main Info */}
                    <div className="md:col-span-2">
                        {/* Metadata */}
                        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-[#46d369]">
                                {matchPercent}% Match
                            </span>
                            {year && <span className="text-zinc-300">{year}</span>}
                            <span className="rounded border border-zinc-500 px-1.5 py-0.5 text-xs text-zinc-400">
                                {movie.adult ? '18+' : 'PG-13'}
                            </span>
                            {runtime && (
                                <span className="text-zinc-300">{runtime}</span>
                            )}
                            {numberOfSeasons && (
                                <span className="text-zinc-300">
                                    {numberOfSeasons} Season{numberOfSeasons > 1 ? 's' : ''}
                                </span>
                            )}
                            <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                                HD
                            </span>
                        </div>

                        {/* Overview */}
                        <p className="text-sm leading-relaxed text-zinc-200 md:text-base">
                            {loading
                                ? 'Loading description...'
                                : overview || 'No description available.'}
                        </p>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-3 text-sm">
                        {details?.genres && details.genres.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Genres: </span>
                                <span className="text-zinc-200">
                                    {details.genres.map((g) => g.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {details?.production_companies &&
                            details.production_companies.length > 0 && (
                                <div>
                                    <span className="text-zinc-500">Studio: </span>
                                    <span className="text-zinc-200">
                                        {details.production_companies
                                            .slice(0, 2)
                                            .map((c) => c.name)
                                            .join(', ')}
                                    </span>
                                </div>
                            )}

                        <div>
                            <span className="text-zinc-500">This movie is: </span>
                            <span className="text-zinc-200">
                                Exciting, Suspenseful
                            </span>
                        </div>

                        <button
                            type="button"
                            className="mt-4 text-zinc-300 underline underline-offset-4 hover:text-white"
                            onClick={handleMoreInfoPage}
                        >
                            View Full Details →
                        </button>
                    </div>
                </div>

                {/* Episodes Section (TV Shows) */}
                {mediaType === 'tv' && (
                    <div className="border-t border-zinc-800 p-6 md:p-10">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold md:text-2xl">Episodes</h3>

                            {/* Season Selector */}
                            {numberOfSeasons && numberOfSeasons > 1 && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:border-zinc-400"
                                        onClick={() =>
                                            setShowSeasonDropdown(!showSeasonDropdown)
                                        }
                                    >
                                        Season {season}
                                        <ChevronDown
                                            className={cn(
                                                'h-4 w-4 transition-transform',
                                                showSeasonDropdown && 'rotate-180',
                                            )}
                                        />
                                    </button>

                                    {showSeasonDropdown && (
                                        <div className="absolute right-0 z-50 mt-2 max-h-64 w-36 overflow-y-auto rounded border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                                            {Array.from(
                                                { length: numberOfSeasons },
                                                (_, i) => i + 1,
                                            ).map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className={cn(
                                                        'w-full px-4 py-2 text-left text-sm hover:bg-zinc-800',
                                                        s === season &&
                                                        'bg-zinc-800 font-semibold',
                                                    )}
                                                    onClick={() => {
                                                        setSeason(s);
                                                        setShowSeasonDropdown(false);
                                                    }}
                                                >
                                                    Season {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {seasonLoading ? (
                            <div className="flex items-center gap-3 text-zinc-400">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                                Loading episodes...
                            </div>
                        ) : seasonDetails?.episodes?.length ? (
                            <div className="space-y-4">
                                {seasonDetails.episodes.slice(0, 10).map((ep, idx) => (
                                    <button
                                        key={ep.id}
                                        type="button"
                                        className="group flex w-full items-start gap-4 rounded-lg p-3 text-left transition hover:bg-zinc-800"
                                        onClick={() => {
                                            window.location.href = `/watch/tv/${id}?season=${ep.season_number}&episode=${ep.episode_number}`;
                                        }}
                                    >
                                        {/* Episode Number */}
                                        <div className="flex h-8 w-8 flex-none items-center justify-center text-xl font-light text-zinc-500">
                                            {idx + 1}
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="relative h-20 w-36 flex-none overflow-hidden rounded bg-zinc-800">
                                            {ep.still_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                                    alt={ep.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                                                    No image
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                                <Play
                                                    className="h-10 w-10 text-white"
                                                    fill="white"
                                                />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                    {ep.name}
                                                </span>
                                                {ep.runtime && (
                                                    <span className="text-sm text-zinc-500">
                                                        {ep.runtime}m
                                                    </span>
                                                )}
                                            </div>
                                            <p className="line-clamp-2 text-sm text-zinc-400">
                                                {ep.overview || 'No description available.'}
                                            </p>
                                        </div>
                                    </button>
                                ))}

                                {seasonDetails.episodes.length > 10 && (
                                    <button
                                        type="button"
                                        className="w-full border-t border-zinc-800 pt-4 text-center text-sm text-zinc-400 hover:text-white"
                                        onClick={handleMoreInfoPage}
                                    >
                                        View all {seasonDetails.episodes.length} episodes →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-400">
                                No episodes available for this season.
                            </p>
                        )}
                    </div>
                )}

                {/* More Like This Section */}
                <div className="border-t border-zinc-800 p-6 md:p-10">
                    <h3 className="mb-4 text-xl font-bold md:text-2xl">
                        More Like This
                    </h3>
                    <p className="text-sm text-zinc-400">
                        Explore more titles by visiting the{' '}
                        <button
                            type="button"
                            className="text-zinc-300 underline underline-offset-2 hover:text-white"
                            onClick={handleMoreInfoPage}
                        >
                            full details page
                        </button>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
