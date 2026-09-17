import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Movie } from '@/types/tmdb';

interface MovieCardProps {
    movie: Movie;
    onSelect?: (movie: Movie) => void;
    size?: 'default' | 'large' | 'poster';
    isSearchCard?: boolean;
    showTitleBelow?: boolean;
    onHover?: (movie: Movie, rect: DOMRect) => void;
}

/** Jeda sebelum pratinjau melayang muncul, supaya tetikus yang hanya lewat
 *  di atas satu baris tidak memicu selusin pratinjau berturut-turut. */
const HOVER_INTENT_MS = 400;

export default function MovieCard({
    movie,
    onSelect,
    size = 'default',
    showTitleBelow = false,
    isSearchCard = false,
    onHover,
}: MovieCardProps) {
    const cardRef = useRef<HTMLButtonElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [hasImageFailed, setHasImageFailed] = useState(false);

    useEffect(
        () => () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        },
        [],
    );

    const artPath =
        size === 'poster'
            ? movie.poster_path
            : (movie.backdrop_path ?? movie.poster_path);

    const imageUrl = artPath
        ? `https://image.tmdb.org/t/p/${size === 'poster' ? 'w500' : 'w500'}${artPath}`
        : null;

    const title = movie.title ?? movie.name ?? 'Tanpa judul';

    // Angka yang tampil harus benar-benar datang dari TMDB. Tidak ada skor
    // kecocokan karangan: aplikasi ini tidak punya riwayat tonton untuk
    // menghitungnya, jadi yang jujur adalah rata-rata penilaian TMDB.
    const rating =
        typeof movie.vote_average === 'number' && movie.vote_average > 0
            ? movie.vote_average.toFixed(1)
            : null;

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }

        if (!onHover || isSearchCard) {
            return;
        }

        hoverTimerRef.current = setTimeout(() => {
            if (cardRef.current) {
                onHover(movie, cardRef.current.getBoundingClientRect());
            }
        }, HOVER_INTENT_MS);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
    };

    return (
        <button
            ref={cardRef}
            type="button"
            onClick={() => onSelect?.(movie)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={`Buka ${title}`}
            className="cinema-focus group/card relative block w-full cursor-pointer text-left"
        >
            <div
                className={cn(
                    'relative overflow-hidden bg-[var(--cinema-raised)] transition-[transform,box-shadow] duration-300 ease-out',
                    'group-hover/card:scale-[1.04] group-hover/card:shadow-[0_12px_32px_rgba(0,0,0,0.6)]',
                    size === 'poster' ? 'aspect-2/3' : 'aspect-video',
                )}
                style={{ borderRadius: 'var(--cinema-radius-card)' }}
            >
                {imageUrl && !hasImageFailed ? (
                    <>
                        {/* Rangka penahan agar baris tidak berkedut saat gambar
                            masuk satu per satu. */}
                        {!isImageLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-[var(--cinema-overlay)]" />
                        )}
                        <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            onLoad={() => setIsImageLoaded(true)}
                            onError={() => setHasImageFailed(true)}
                            className={cn(
                                'h-full w-full object-cover transition-opacity duration-500',
                                isImageLoaded ? 'opacity-100' : 'opacity-0',
                            )}
                        />
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center px-3 text-center text-[11px] leading-snug font-medium text-[var(--cinema-ink-faint)]">
                        {title}
                    </div>
                )}

                {rating && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-[var(--cinema-ink)] backdrop-blur-sm">
                        <Star
                            className="h-2.5 w-2.5 fill-[var(--cinema-accent)] text-[var(--cinema-accent)]"
                            aria-hidden="true"
                        />
                        {rating}
                        <span className="sr-only">dari 10 di TMDB</span>
                    </span>
                )}

                {/* Judul muncul di atas seni kunci saat disentuh tetikus, jadi
                    baris tetap rapat tanpa mengorbankan keterbacaan. */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-2.5 pt-8 text-[12px] leading-tight font-semibold text-[var(--cinema-ink)] opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                    {title}
                </span>
            </div>

            {showTitleBelow && (
                <span className="mt-2 line-clamp-2 block text-[12px] leading-snug font-medium text-[var(--cinema-ink-soft)]">
                    {title}
                </span>
            )}
        </button>
    );
}
