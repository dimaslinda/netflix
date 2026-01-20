import { ChevronDown, Download, Play, Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

interface MovieCardProps {
    movie: Movie;
    onSelect?: (movie: Movie) => void;
    size?: 'default' | 'large' | 'poster';
    isSearchCard?: boolean;
    showTitleBelow?: boolean;
}

export default function MovieCard({
    movie,
    onSelect,
    size = 'default',
    isSearchCard = false,
    showTitleBelow = false,
}: MovieCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mediaType = movie.media_type || 'movie';

    const handleMouseEnter = () => {
        if (isSearchCard || showTitleBelow) return;

        timerRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsHovered(false);
    };

    const imageUrl =
        size === 'poster'
            ? movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://placehold.co/500x750/1a1a1a/ffffff?text=No+Image'
            : movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                : movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://placehold.co/780x439/1a1a1a/ffffff?text=No+Image';

    const widthClass = isSearchCard
        ? 'w-full'
        : size === 'poster'
            ? 'w-[130px] sm:w-[150px] md:w-[180px]'
            : size === 'large'
                ? 'w-[220px] sm:w-[260px] md:w-[320px]'
                : 'w-[160px] sm:w-[200px] md:w-[240px]';

    const title = movie.title || movie.name;

    const matchPercent = movie.vote_average
        ? Math.min(99, Math.max(50, Math.round(movie.vote_average * 10)))
        : 85;

    const year =
        movie.release_date?.split('-')[0] ||
        movie.first_air_date?.split('-')[0] ||
        '';

    const isNew = movie.release_date
        ? new Date(movie.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : false;

    // Simple hover with scale - like Netflix
    if (isSearchCard || showTitleBelow) {
        // Simple card without hover effect
        return (
            <div className={`group/card relative flex-none ${widthClass}`}>
                <div
                    className="relative cursor-pointer overflow-hidden rounded-md transition-transform duration-300 hover:scale-105"
                    onClick={() => onSelect?.(movie)}
                >
                    <div className="absolute top-1 left-1 z-10">
                        <span className="text-xs font-bold text-red-600">N</span>
                    </div>
                    <img
                        src={imageUrl}
                        alt={title}
                        className={`w-full object-cover ${size === 'poster' ? 'aspect-[2/3]' : 'aspect-video'}`}
                        loading="lazy"
                    />
                    {isNew && (
                        <div className="absolute bottom-2 left-2 z-10">
                            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                New Episode
                            </span>
                        </div>
                    )}
                </div>
                {showTitleBelow && (
                    <div className="mt-2 px-1 text-xs font-semibold text-white md:text-sm">
                        <div className="line-clamp-1">{title}</div>
                    </div>
                )}
            </div>
        );
    }

    // Card with Netflix-style hover
    return (
        <div
            className={`group/card relative flex-none ${widthClass}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ zIndex: isHovered ? 50 : 1 }}
        >
            {/* The card that scales */}
            <div
                className={`relative cursor-pointer overflow-visible rounded-md bg-[#181818] transition-all duration-300 ease-out ${isHovered ? 'scale-150 shadow-2xl shadow-black/80' : 'scale-100'
                    }`}
                style={{ transformOrigin: 'center center' }}
            >
                {/* Image */}
                <div
                    className="relative overflow-hidden rounded-t-md"
                    onClick={() => onSelect?.(movie)}
                >
                    <div className="absolute top-1 left-1 z-10">
                        <span className="text-xs font-bold text-red-600">N</span>
                    </div>
                    <img
                        src={imageUrl}
                        alt={title}
                        className={`w-full object-cover ${size === 'poster' ? 'aspect-[2/3]' : 'aspect-video'}`}
                        loading="lazy"
                    />
                    {/* Gradient at bottom when hovered */}
                    {isHovered && (
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#181818] to-transparent" />
                    )}
                    {/* New badge when not hovered */}
                    {isNew && !isHovered && (
                        <div className="absolute bottom-2 left-2 z-10">
                            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                New Episode
                            </span>
                        </div>
                    )}
                </div>

                {/* Hover content - appears below image */}
                {isHovered && (
                    <div className="rounded-b-md bg-[#181818] p-2">
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200"
                                    onClick={() => onSelect?.(movie)}
                                >
                                    <Play className="h-2.5 w-2.5" fill="black" />
                                </button>
                                <button
                                    type="button"
                                    className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-500 text-white transition hover:border-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Plus className="h-2.5 w-2.5" />
                                </button>
                                <button
                                    type="button"
                                    className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-500 text-white transition hover:border-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download className="h-2.5 w-2.5" />
                                </button>
                            </div>
                            <button
                                type="button"
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-500 text-white transition hover:border-white"
                                onClick={() => onSelect?.(movie)}
                            >
                                <ChevronDown className="h-2.5 w-2.5" />
                            </button>
                        </div>

                        {/* Metadata */}
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[6px]">
                            <span className="font-semibold text-[#46d369]">
                                {matchPercent}% Match
                            </span>
                            <span className="rounded border border-zinc-600 px-0.5 text-zinc-400">
                                {movie.adult ? '18+' : '13+'}
                            </span>
                            {year && <span className="text-zinc-400">{year}</span>}
                        </div>

                        {/* Title */}
                        <div className="mt-0.5 text-[7px] font-medium text-white line-clamp-1">
                            {title}
                        </div>
                    </div>
                )}

                {/* Rounded bottom when not hovered */}
                {!isHovered && <div className="rounded-b-md" />}
            </div>
        </div>
    );
}
