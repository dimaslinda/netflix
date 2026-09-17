import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    getContinueWatchingList,
    removeContinueWatching,
    type ContinueWatchingItem,
} from '@/lib/continue-watching';
import { cn } from '@/lib/utils';

interface ContinueWatchingRowProps {
    className?: string;
}

export default function ContinueWatchingRow({
    className,
}: ContinueWatchingRowProps) {
    const [items, setItems] = useState<ContinueWatchingItem[]>(() =>
        getContinueWatchingList(),
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    useEffect(() => {
        const handleUpdate = () => {
            setItems(getContinueWatchingList());
        };
        window.addEventListener('continue-watching-updated', handleUpdate);
        return () => {
            window.removeEventListener(
                'continue-watching-updated',
                handleUpdate,
            );
        };
    }, []);

    const updateArrows = useCallback(() => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
        updateArrows();
        window.addEventListener('resize', updateArrows);
        return () => window.removeEventListener('resize', updateArrows);
    }, [items, updateArrows]);

    const scroll = (direction: 'left' | 'right') => {
        if (!containerRef.current) return;
        const { clientWidth } = containerRef.current;
        const scrollAmount =
            direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
        containerRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth',
        });
    };

    const handlePlay = (item: ContinueWatchingItem) => {
        const url =
            item.type === 'tv'
                ? `/watch/tv/${item.id}?season=${item.season ?? '1'}&episode=${item.episode ?? '1'}`
                : `/watch/movie/${item.id}`;
        router.visit(url);
    };

    const handleRemove = (e: React.MouseEvent, item: ContinueWatchingItem) => {
        e.stopPropagation();
        removeContinueWatching(item.id, item.type);
        setItems((prev) =>
            prev.filter((i) => !(i.id === item.id && i.type === item.type)),
        );
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            className={cn(
                'relative space-y-2 px-4 md:px-12 lg:px-16',
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wider text-white uppercase md:text-base lg:text-lg">
                    Lanjutkan Menonton
                </h2>
                <span className="text-xs text-zinc-400">
                    {items.length} judul tersimpan
                </span>
            </div>

            <div className="group relative">
                {/* Tombol Geser Kiri */}
                {showLeftArrow && (
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        aria-label="Gulir ke kiri"
                        className="cinema-focus absolute top-0 bottom-0 left-0 z-30 flex w-12 items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                    >
                        <ChevronLeft className="h-8 w-8" aria-hidden="true" />
                    </button>
                )}

                {/* Kontainer Baris */}
                <div
                    ref={containerRef}
                    onScroll={updateArrows}
                    className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth py-3"
                >
                    {items.map((item) => {
                        const imagePath =
                            item.backdrop_path ?? item.poster_path;
                        const imageUrl = imagePath
                            ? `https://image.tmdb.org/t/p/w500${imagePath}`
                            : '/placeholder.jpg';

                        const progressPercent = Math.min(
                            100,
                            Math.max(15, item.progress ?? 35),
                        );

                        return (
                            <div
                                key={`${item.type}-${item.id}`}
                                onClick={() => handlePlay(item)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handlePlay(item);
                                    }
                                }}
                                className="group/card relative h-36 w-60 shrink-0 cursor-pointer overflow-hidden rounded-md bg-zinc-900 transition-all duration-300 hover:z-20 hover:scale-105 md:h-44 md:w-72"
                            >
                                <img
                                    src={imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 transition group-hover/card:opacity-90" />

                                {/* Tombol Putar di Tengah saat Hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/card:opacity-100">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110">
                                        <Play
                                            className="h-6 w-6 fill-current pl-0.5"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>

                                {/* Tombol Hapus Pojok Kanan Atas */}
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, item)}
                                    aria-label={`Hapus ${item.title} dari riwayat`}
                                    className="cinema-focus absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-zinc-300 opacity-0 transition group-hover/card:opacity-100 hover:bg-black hover:text-white"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>

                                {/* Info Judul & Musim */}
                                <div className="absolute right-3 bottom-3 left-3">
                                    <p className="line-clamp-1 text-sm font-semibold text-white drop-shadow">
                                        {item.title}
                                    </p>
                                    <div className="mt-0.5 flex items-center justify-between text-xs text-zinc-300">
                                        <span>
                                            {item.type === 'tv'
                                                ? `M${item.season ?? '1'} E${item.episode ?? '1'}`
                                                : 'Film'}
                                        </span>
                                        {item.episodeTitle && (
                                            <span className="max-w-[120px] truncate text-[11px] text-zinc-400">
                                                {item.episodeTitle}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bilah Progres Durasi Netflix */}
                                <div className="absolute bottom-0 left-0 h-1.5 w-full bg-zinc-800">
                                    <div
                                        className="h-full bg-[#E50914] transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tombol Geser Kanan */}
                {showRightArrow && (
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        aria-label="Gulir ke kanan"
                        className="cinema-focus absolute top-0 right-0 bottom-0 z-30 flex w-12 items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                    >
                        <ChevronRight className="h-8 w-8" aria-hidden="true" />
                    </button>
                )}
            </div>
        </section>
    );
}
