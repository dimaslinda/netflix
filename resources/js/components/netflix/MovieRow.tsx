import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Movie } from '@/types/tmdb';

import MovieCard from './MovieCard';

interface MovieRowProps {
    title: string;
    movies: Movie[];
    onSelect: (movie: Movie) => void;
    variant?: 'default' | 'large' | 'poster';
    /** Teks kecil di bawah judul baris, untuk menerangkan asal isinya. */
    note?: string;
    onHover?: (movie: Movie, rect: DOMRect) => void;
}

/** Seberapa jauh satu tekan panah menggeser baris, relatif terhadap lebar
 *  yang terlihat. Disisakan sedikit agar kartu tepi tetap terlihat separuh
 *  dan pemirsa tahu barisnya masih berlanjut. */
const SCROLL_FRACTION = 0.85;

export default function MovieRow({
    title,
    movies,
    onSelect,
    variant = 'default',
    note,
    onHover,
}: MovieRowProps) {
    const railRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const measure = useCallback(() => {
        const rail = railRef.current;

        if (!rail) {
            return;
        }

        setCanScrollLeft(rail.scrollLeft > 8);
        setCanScrollRight(
            rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 8,
        );
    }, []);

    // Diukur juga saat pasang dan saat ukuran jendela berubah. Tanpa ini, panah
    // kanan tetap tampil pada baris yang isinya muat seluruhnya di layar lebar.
    useEffect(() => {
        measure();

        const rail = railRef.current;

        if (!rail || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(rail);

        return () => observer.disconnect();
    }, [measure, movies.length]);

    const scrollBy = useCallback((direction: 'left' | 'right') => {
        const rail = railRef.current;

        if (!rail) {
            return;
        }

        const step = rail.clientWidth * SCROLL_FRACTION;

        rail.scrollTo({
            left:
                direction === 'left'
                    ? rail.scrollLeft - step
                    : rail.scrollLeft + step,
            behavior: 'smooth',
        });
    }, []);

    if (movies.length === 0) {
        return null;
    }

    const cardWidth =
        variant === 'poster'
            ? 'w-[132px] sm:w-[150px] lg:w-[168px]'
            : variant === 'large'
              ? 'w-[300px] sm:w-[360px] lg:w-[420px]'
              : 'w-[208px] sm:w-[236px] lg:w-[268px]';

    return (
        <section className="group/row relative" aria-labelledby={rowId(title)}>
            <header className="px-4 md:px-12 lg:px-16">
                <h2
                    id={rowId(title)}
                    className="text-[15px] font-bold tracking-tight text-[var(--cinema-ink)] md:text-lg"
                >
                    {title}
                </h2>
                {note && (
                    <p className="mt-0.5 text-[11px] text-[var(--cinema-ink-faint)]">
                        {note}
                    </p>
                )}
            </header>

            <div className="relative mt-2.5">
                <RailButton
                    direction="left"
                    isVisible={canScrollLeft}
                    onClick={() => scrollBy('left')}
                />
                <RailButton
                    direction="right"
                    isVisible={canScrollRight}
                    onClick={() => scrollBy('right')}
                />

                {/*
                    tabIndex membuat rel ini bisa dijangkau Tab dan digeser
                    dengan tombol panah, jadi baris tetap terpakai penuh tanpa
                    tetikus. Kartu di dalamnya sudah berupa tombol sungguhan.
                */}
                <div
                    ref={railRef}
                    onScroll={measure}
                    tabIndex={0}
                    role="group"
                    aria-label={`Geser baris ${title}`}
                    className="cinema-focus scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth px-4 py-3 md:gap-2.5 md:px-12 lg:px-16"
                >
                    {movies.map((movie) => (
                        <div
                            key={`${movie.id}-${movie.media_type ?? 'movie'}`}
                            className={cn('flex-none', cardWidth)}
                        >
                            <MovieCard
                                movie={movie}
                                onSelect={onSelect}
                                onHover={onHover}
                                size={variant}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function RailButton({
    direction,
    isVisible,
    onClick,
}: {
    direction: 'left' | 'right';
    isVisible: boolean;
    onClick: () => void;
}) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={
                direction === 'left' ? 'Geser ke kiri' : 'Geser ke kanan'
            }
            tabIndex={isVisible ? 0 : -1}
            aria-hidden={!isVisible}
            className={cn(
                'cinema-focus absolute top-0 bottom-0 z-30 hidden w-12 items-center justify-center bg-gradient-to-r from-black/85 to-transparent transition-opacity duration-200 md:flex',
                direction === 'left'
                    ? 'left-0 bg-gradient-to-r'
                    : 'right-0 bg-gradient-to-l',
                isVisible
                    ? 'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100'
                    : 'pointer-events-none opacity-0',
            )}
        >
            <Icon
                className="h-8 w-8 text-[var(--cinema-ink)] transition-transform duration-200 hover:scale-110"
                aria-hidden="true"
            />
        </button>
    );
}

/** Judul baris dipakai sebagai label aksesibilitas, jadi perlu id yang stabil. */
function rowId(title: string): string {
    return `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
