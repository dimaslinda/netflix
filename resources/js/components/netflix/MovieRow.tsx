import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    type FocusEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useTvMode } from '@/hooks/use-tv-mode';
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
    const isTv = useTvMode();
    const railRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    // Kunci data-tv-id kartu yang sedang difokus remote di baris ini, atau
    // null bila fokus berada di luar baris.
    const [focusedKey, setFocusedKey] = useState<string | null>(null);

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

    // Di TV kartu hanya menampilkan seni kunci, jadi judul, tahun, dan nilai
    // kartu terfokus dituliskan di bawah judul baris. Datanya sudah ada di
    // objek TMDB kartu, tidak ada gambar atau permintaan tambahan.
    const handleRailFocus = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            if (!isTv) {
                return;
            }

            const card = event.target.closest<HTMLElement>('[data-tv-id]');
            setFocusedKey(card?.dataset.tvId ?? null);
        },
        [isTv],
    );

    const handleRailBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            // Pindah antarkartu di baris yang sama juga memicu blur; baris
            // baru dikosongkan bila fokus benar-benar keluar dari rel.
            if (!event.currentTarget.contains(event.relatedTarget)) {
                setFocusedKey(null);
            }
        },
        [],
    );

    const cardWidth =
        variant === 'poster'
            ? 'w-[132px] sm:w-[150px] lg:w-[168px]'
            : variant === 'large'
              ? 'w-[300px] sm:w-[360px] lg:w-[420px]'
              : 'w-[208px] sm:w-[236px] lg:w-[268px]';

    // Fokus berpindah di setiap tekan panah. Tanpa memo, seluruh kartu baris
    // ikut dirender ulang hanya untuk mengganti satu baris teks keterangan.
    const cards = useMemo(
        () =>
            movies.map((movie) => (
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
            )),
        [movies, cardWidth, onSelect, onHover, variant],
    );

    if (movies.length === 0) {
        return null;
    }

    const focusedMovie =
        isTv && focusedKey
            ? movies.find(
                  (movie) =>
                      `${movie.media_type ?? 'movie'}-${movie.id}` ===
                      focusedKey,
              )
            : undefined;

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
                {/* Tingginya tetap walau kosong, supaya baris di bawahnya
                    tidak bergeser setiap kali fokus masuk atau keluar. */}
                {isTv && (
                    <p className="mt-1 h-6 truncate text-base leading-6 text-[var(--cinema-ink-soft)]">
                        {focusedMovie ? focusedInfoLine(focusedMovie) : null}
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
                    onFocus={handleRailFocus}
                    onBlur={handleRailBlur}
                    tabIndex={0}
                    role="group"
                    aria-label={`Geser baris ${title}`}
                    data-tv-row
                    className="cinema-focus scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth px-4 py-3 md:gap-2.5 md:px-12 lg:px-16"
                >
                    {cards}
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
            // Remote menggeser rel dengan memindah fokus antarkartu, jadi
            // tombol geser hanya akan menjadi persinggahan kosong.
            data-tv-skip
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

/** "Judul · Tahun · ★ 7.5", hanya bagian yang benar-benar ada di data TMDB. */
function focusedInfoLine(movie: Movie): string {
    const title =
        movie.title ?? movie.name ?? movie.original_name ?? 'Tanpa judul';
    const year =
        movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4);
    const rating =
        typeof movie.vote_average === 'number' && movie.vote_average > 0
            ? `★ ${movie.vote_average.toFixed(1)}`
            : null;

    return [title, year, rating].filter(Boolean).join(' · ');
}

/** Judul baris dipakai sebagai label aksesibilitas, jadi perlu id yang stabil. */
function rowId(title: string): string {
    return `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
