import { Info, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

interface HeroProps {
    movie: Movie;
    onPlay?: (movie: Movie) => void;
    onMoreInfo?: (movie: Movie) => void;
}

export default function Hero({ movie, onPlay, onMoreInfo }: HeroProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [showVideo, setShowVideo] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const mediaType = movie.media_type || 'movie';
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const backdropPath = movie.backdrop_path || movie.poster_path || null;
    // Use a fallback gradient image if no backdrop is available
    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/original${backdropPath}`
        : null; // Will use CSS gradient fallback

    const fetchTrailer = useCallback(async () => {
        if (trailerUrl) {
            setShowVideo(true);
            return;
        }
        try {
            const res = await fetch(`/api/tmdb/${mediaType}/${movie.id}/videos`);
            const data = await res.json();
            if (data?.best?.embed_url) {
                const urlWithMute = `${data.best.embed_url}&mute=${isMuted ? 1 : 0}`;
                setTrailerUrl(urlWithMute);
                setShowVideo(true);
            }
        } catch (error) {
            console.error('Failed to fetch trailer:', error);
        }
    }, [mediaType, movie.id, trailerUrl, isMuted]);

    useEffect(() => {
        // Auto-play trailer after 2 seconds
        timerRef.current = setTimeout(() => {
            void fetchTrailer();
        }, 3000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [fetchTrailer]);

    // If no image, consider it loaded for animation purposes
    useEffect(() => {
        if (!imageUrl) {
            setImageLoaded(true);
        }
    }, [imageUrl]);

    // Generate a fake match percentage based on vote_average
    const matchPercentage = movie.vote_average
        ? Math.min(99, Math.max(65, Math.round(movie.vote_average * 10)))
        : 95;

    // Get year from release date
    const releaseYear =
        movie.release_date?.split('-')[0] ||
        movie.first_air_date?.split('-')[0] ||
        '2024';

    return (
        <div className="relative flex h-[56.25vw] min-h-[500px] max-h-[800px] flex-col justify-end pb-16 md:pb-24 lg:pb-32">
            {/* Background Media */}
            <div
                className="absolute inset-0 -z-10 overflow-hidden"
                style={
                    !imageUrl
                        ? {
                            background:
                                'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        }
                        : undefined
                }
            >
                {/* Image */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={movie.title || movie.name}
                        className={`h-full w-full object-cover object-top transition-opacity duration-1000 ${showVideo && trailerUrl ? 'opacity-0' : 'opacity-100'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                    />
                )}

                {/* Gradient fallback pattern when no image */}
                {!imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-purple-900/20 to-blue-900/30" />
                )}

                {/* Video */}
                {showVideo && trailerUrl && (
                    <iframe
                        src={trailerUrl}
                        className="absolute inset-0 h-full w-full scale-[1.5] object-cover"
                        title={movie.title || movie.name}
                        allow="autoplay; encrypted-media"
                        style={{ pointerEvents: 'none' }}
                    />
                )}

                {/* Vignette Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-4 md:px-12 lg:px-16">
                {/* Logo/Title with animation */}
                <div
                    className={`transform transition-all duration-700 ${imageLoaded
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                        }`}
                >
                    <h1 className="mb-4 text-3xl font-black tracking-tight drop-shadow-2xl md:text-5xl lg:text-7xl">
                        {movie.title || movie.name || movie.original_name}
                    </h1>
                </div>

                {/* Metadata Row */}
                <div
                    className={`mb-4 flex flex-wrap items-center gap-2 text-sm transition-all delay-100 duration-700 md:gap-3 md:text-base ${imageLoaded
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                        }`}
                >
                    <span className="font-semibold text-[#46d369]">
                        {matchPercentage}% Match
                    </span>
                    <span className="text-zinc-300">{releaseYear}</span>
                    <span className="rounded border border-zinc-400 px-1.5 py-0.5 text-xs text-zinc-400">
                        {movie.adult ? '18+' : 'PG-13'}
                    </span>
                    {movie.vote_average && (
                        <span className="flex items-center gap-1 text-zinc-300">
                            <span className="text-yellow-500">★</span>
                            {movie.vote_average.toFixed(1)}
                        </span>
                    )}
                    <span className="hidden rounded bg-zinc-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider md:inline">
                        HD
                    </span>
                </div>

                {/* Description */}
                <p
                    className={`mb-6 max-w-xl text-sm leading-relaxed text-zinc-100 drop-shadow-lg transition-all delay-150 duration-700 md:max-w-2xl md:text-lg ${imageLoaded
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                        }`}
                >
                    {movie.overview && movie.overview.length > 200
                        ? `${movie.overview.slice(0, 200)}...`
                        : movie.overview || 'Watch this exciting title now on Netflix.'}
                </p>

                {/* Buttons */}
                <div
                    className={`flex items-center gap-3 transition-all delay-200 duration-700 ${imageLoaded
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                        }`}
                >
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition duration-300 hover:bg-white/75 md:px-6 md:py-2.5 md:text-lg"
                        onClick={() => onPlay?.(movie)}
                    >
                        <Play className="h-5 w-5 md:h-7 md:w-7" fill="black" />
                        Play
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-md bg-zinc-500/70 px-4 py-2 text-sm font-bold text-white transition duration-300 hover:bg-zinc-500/50 md:px-6 md:py-2.5 md:text-lg"
                        onClick={() => onMoreInfo?.(movie)}
                    >
                        <Info className="h-5 w-5 md:h-7 md:w-7" />
                        More Info
                    </button>
                </div>
            </div>

            {/* Maturity Rating & Mute Button (Right side) */}
            <div className="absolute right-0 bottom-24 z-10 flex items-center gap-3 md:bottom-32 lg:bottom-40">
                {/* Mute Toggle */}
                {trailerUrl && (
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-400 text-white transition hover:border-white hover:bg-white/10"
                        onClick={() => {
                            setIsMuted(!isMuted);
                            if (trailerUrl) {
                                const newUrl = trailerUrl.replace(
                                    /mute=\d/,
                                    `mute=${!isMuted ? 1 : 0}`
                                );
                                setTrailerUrl(newUrl);
                            }
                        }}
                    >
                        {isMuted ? (
                            <VolumeX className="h-5 w-5" />
                        ) : (
                            <Volume2 className="h-5 w-5" />
                        )}
                    </button>
                )}

                {/* Maturity Rating Badge */}
                <div className="flex items-center gap-0.5 border-l-4 border-zinc-400 bg-zinc-800/80 py-1.5 pr-8 pl-3 text-sm md:text-base">
                    {movie.adult ? '18+' : 'TV-14'}
                </div>
            </div>
        </div>
    );
}
