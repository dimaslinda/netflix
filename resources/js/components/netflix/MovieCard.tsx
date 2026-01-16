import { useCallback, useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

interface MovieCardProps {
    movie: Movie;
    onSelect?: (movie: Movie) => void;
    size?: 'default' | 'large';
    rank?: number;
    isSearchCard?: boolean;
}

export default function MovieCard({
    movie,
    onSelect,
    size = 'default',
    rank,
    isSearchCard = false,
}: MovieCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mediaType = movie.media_type || 'movie';

    const fetchTrailer = useCallback(async () => {
        if (trailerUrl) return;
        try {
            const res = await fetch(
                `/api/tmdb/${mediaType}/${movie.id}/videos`,
            );
            const data = await res.json();
            if (data?.best?.embed_url) {
                setTrailerUrl(data.best.embed_url);
            }
        } catch (error) {
            console.error('Failed to fetch trailer:', error);
        }
    }, [mediaType, movie.id, trailerUrl]);

    const handleMouseEnter = () => {
        if (isSearchCard) return;
        timerRef.current = setTimeout(() => {
            setIsHovered(true);
            void fetchTrailer();
        }, 800);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsHovered(false);
    };

    const imageUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
        : movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : 'https://placehold.co/780x439/1a1a1a/ffffff?text=No+Image';

    const widthClass = isSearchCard
        ? 'w-full'
        : size === 'large'
          ? 'w-[220px] sm:w-[260px] md:w-[320px]'
          : 'w-[180px] sm:w-[220px] md:w-[260px]';

    const baseClasses =
        'relative flex-none cursor-pointer overflow-hidden rounded-md text-left transition-all duration-300';
    const hoverClasses = isSearchCard ? '' : ' hover:z-30 hover:scale-110';

    const title = movie.title || movie.name;
    const shouldShowTitleOverlay = isSearchCard || isHovered;
    const showTrailer = !isSearchCard && isHovered && !!trailerUrl;

    return (
        <div
            className={`${baseClasses} ${widthClass}${hoverClasses}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onSelect?.(movie)}
        >
            {typeof rank === 'number' ? (
                <div className="absolute top-1 left-1 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white md:h-8 md:w-8 md:text-sm">
                    {rank}
                </div>
            ) : null}
            {showTrailer ? (
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        src={trailerUrl}
                        className="h-full w-full"
                        title={title}
                        allow="autoplay; encrypted-media"
                    />
                    <div className="absolute inset-0 z-10 bg-transparent" />
                </div>
            ) : (
                <img
                    src={imageUrl}
                    alt={title}
                    className="aspect-video h-auto w-full object-cover"
                    loading="lazy"
                />
            )}
            <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-8 pb-2 text-xs font-semibold text-white transition-opacity duration-300 md:text-sm ${
                    shouldShowTitleOverlay ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <div className="line-clamp-2">{title}</div>
            </div>
        </div>
    );
}
