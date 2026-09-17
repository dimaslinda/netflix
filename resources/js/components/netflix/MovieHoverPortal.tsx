import { AnimatePresence, motion } from 'framer-motion';
import { Info, Play, Plus, Star } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Movie } from '@/types/tmdb';

interface MovieHoverPortalProps {
    movie: Movie | null;
    rect: DOMRect | null;
    onClose: () => void;
    onSelect: (movie: Movie) => void;
    onPlay?: (movie: Movie) => void;
    onAddToList?: (movie: Movie) => void;
}

/** Seberapa besar pratinjau dibanding kartu aslinya. */
const SCALE = 1.5;

/** Tenggang sebelum pratinjau menutup, agar tetikus sempat berpindah dari kartu
 *  ke pratinjau tanpa membuatnya berkedip. */
const CLOSE_GRACE_MS = 300;

/**
 * Pratinjau melayang di atas kartu yang sedang disentuh tetikus.
 *
 * Isinya terbatas pada apa yang benar-benar dikirim TMDB. Versi sebelumnya
 * menampilkan skor kecocokan, klasifikasi umur, durasi, dan tiga nama genre
 * yang semuanya ditulis mati, sehingga setiap judul tampak bergenre sama.
 */
export default function MovieHoverPortal({
    movie,
    rect,
    onClose,
    onSelect,
    onPlay,
    onAddToList,
}: MovieHoverPortalProps) {
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleScroll = () => onClose();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }

            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Portal butuh document.body, yang tidak ada saat penyajian di peladen.
    // Pemeriksaan langsung lebih murah daripada state penanda pasang, dan tidak
    // memicu render kedua.
    if (typeof document === 'undefined' || !movie || !rect) {
        return null;
    }

    const artPath = movie.backdrop_path ?? movie.poster_path;
    const artUrl = artPath ? `https://image.tmdb.org/t/p/w780${artPath}` : null;

    const title = movie.title ?? movie.name ?? 'Tanpa judul';
    const year = (movie.release_date ?? movie.first_air_date)?.slice(0, 4);
    const rating =
        typeof movie.vote_average === 'number' && movie.vote_average > 0
            ? movie.vote_average.toFixed(1)
            : null;

    const width = rect.width * SCALE;

    // Pratinjau dipusatkan pada kartunya, lalu ditahan di dalam tepi jendela
    // supaya kartu pertama dan terakhir sebuah baris tidak terpotong.
    const left = Math.min(
        Math.max(rect.left - (width - rect.width) / 2, 12),
        window.innerWidth - width - 12,
    );

    const top = rect.top - (width * (9 / 16) - rect.height) / 2;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                onMouseEnter={() => {
                    if (closeTimerRef.current) {
                        clearTimeout(closeTimerRef.current);
                    }
                }}
                onMouseLeave={() => {
                    closeTimerRef.current = setTimeout(onClose, CLOSE_GRACE_MS);
                }}
                className="fixed z-[1000] overflow-hidden bg-[var(--cinema-overlay)] shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
                style={{
                    top,
                    left,
                    width,
                    borderRadius: 'var(--cinema-radius-panel)',
                }}
            >
                <div className="relative aspect-video w-full overflow-hidden">
                    {artUrl ? (
                        <img
                            src={artUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[var(--cinema-raised)] px-4 text-center text-xs text-[var(--cinema-ink-faint)]">
                            {title}
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--cinema-overlay)] to-transparent" />
                </div>

                <div className="space-y-3 p-4 pb-5">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => (onPlay ?? onSelect)(movie)}
                            aria-label={`Putar ${title}`}
                            className="cinema-focus flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cinema-ink)] text-[var(--cinema-base)] transition hover:bg-white"
                        >
                            <Play
                                className="ml-0.5 h-4 w-4 fill-current"
                                aria-hidden="true"
                            />
                        </button>

                        {onAddToList && (
                            <button
                                type="button"
                                onClick={() => onAddToList(movie)}
                                aria-label={`Tambah ${title} ke daftar saya`}
                                className="cinema-focus flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 text-[var(--cinema-ink)] transition hover:border-white"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => onSelect(movie)}
                            aria-label={`Lihat rincian ${title}`}
                            className="cinema-focus ml-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 text-[var(--cinema-ink)] transition hover:border-white"
                        >
                            <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>

                    <p className="text-[17px] leading-tight font-bold text-[var(--cinema-ink)]">
                        {title}
                    </p>

                    {(rating ?? year) && (
                        <div className="flex items-center gap-3 text-[12px] font-semibold">
                            {rating && (
                                <span className="flex items-center gap-1 text-[var(--cinema-accent)]">
                                    <Star
                                        className="h-3 w-3 fill-current"
                                        aria-hidden="true"
                                    />
                                    {rating}
                                </span>
                            )}
                            {year && (
                                <span className="text-[var(--cinema-ink-soft)]">
                                    {year}
                                </span>
                            )}
                        </div>
                    )}

                    {movie.overview && (
                        <p className="line-clamp-3 text-[12px] leading-relaxed text-[var(--cinema-ink-soft)]">
                            {movie.overview}
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );
}
