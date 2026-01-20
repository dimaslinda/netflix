import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

interface Top10RowProps {
    title: string;
    movies: Movie[];
    onSelect?: (movie: Movie) => void;
    variant?: 'movie' | 'series';
}

export default function Top10Row({
    title,
    movies,
    onSelect,
    variant = 'movie',
}: Top10RowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleClick = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo =
                direction === 'left'
                    ? scrollLeft - clientWidth * 0.85
                    : scrollLeft + clientWidth * 0.85;

            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });

            setTimeout(() => {
                if (rowRef.current) {
                    setShowLeftArrow(rowRef.current.scrollLeft > 10);
                    setShowRightArrow(
                        rowRef.current.scrollLeft <
                        rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
                    );
                }
            }, 400);
        }
    };

    const handleScroll = () => {
        if (rowRef.current) {
            setShowLeftArrow(rowRef.current.scrollLeft > 10);
            setShowRightArrow(
                rowRef.current.scrollLeft <
                rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
            );
        }
    };

    // Only show first 10
    const top10Movies = movies.slice(0, 10);

    return (
        <div className="group/row relative space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 px-4 md:px-12 lg:px-16">
                <h2 className="cursor-pointer text-base font-bold text-[#e5e5e5] transition duration-200 hover:text-white md:text-xl lg:text-2xl">
                    {title}
                </h2>
                <span className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#54b9c5] opacity-0 transition-opacity duration-300 group-hover/row:opacity-100">
                    Explore All
                    <ChevronRight className="h-4 w-4" />
                </span>
            </div>

            <div className="relative">
                {/* Left Arrow */}
                <button
                    type="button"
                    className={`absolute top-0 bottom-0 left-0 z-40 flex w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 transition-all duration-300 group-hover/row:opacity-100 md:w-16 ${!showLeftArrow ? 'pointer-events-none !opacity-0' : ''}`}
                    onClick={() => handleClick('left')}
                >
                    <ChevronLeft className="h-8 w-8 text-white drop-shadow-lg transition-transform duration-200 hover:scale-125 md:h-10 md:w-10" />
                </button>

                {/* Top 10 Cards Container */}
                <div
                    ref={rowRef}
                    className="scrollbar-hide flex gap-0 overflow-x-scroll overflow-y-visible scroll-smooth px-4 py-4 md:px-12 lg:px-16"
                    onScroll={handleScroll}
                >
                    {top10Movies.map((movie, index) => {
                        const title = movie.title || movie.name;
                        const imageUrl = movie.poster_path
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : 'https://placehold.co/500x750/1a1a1a/ffffff?text=No+Image';

                        // Check if new
                        const isNew = movie.release_date
                            ? new Date(movie.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            : false;

                        return (
                            <div
                                key={movie.id}
                                className="group/card relative flex flex-none cursor-pointer items-end"
                                onClick={() => onSelect?.(movie)}
                            >
                                {/* Large Number */}
                                <span
                                    className="select-none text-[120px] font-black leading-none text-transparent md:text-[160px] lg:text-[200px]"
                                    style={{
                                        WebkitTextStroke: '3px #595959',
                                        fontFamily: 'Arial Black, sans-serif',
                                        letterSpacing: '-0.1em',
                                    }}
                                >
                                    {index + 1}
                                </span>

                                {/* Poster Card */}
                                <div className="relative -ml-8 mb-0 w-[100px] overflow-hidden rounded transition-transform duration-300 group-hover/card:scale-105 md:-ml-12 md:w-[130px] lg:w-[150px]">
                                    <img
                                        src={imageUrl}
                                        alt={title}
                                        className="aspect-[2/3] w-full object-cover"
                                        loading="lazy"
                                    />

                                    {/* Netflix Badge */}
                                    <div className="absolute top-1 left-1">
                                        <span className="text-sm font-black text-red-600">N</span>
                                    </div>

                                    {/* Badge */}
                                    {isNew && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                            <span className="whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-semibold text-white md:text-[9px]">
                                                Recently added
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Arrow */}
                <button
                    type="button"
                    className={`absolute top-0 right-0 bottom-0 z-40 flex w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 transition-all duration-300 group-hover/row:opacity-100 md:w-16 ${!showRightArrow ? 'pointer-events-none !opacity-0' : ''}`}
                    onClick={() => handleClick('right')}
                >
                    <ChevronRight className="h-8 w-8 text-white drop-shadow-lg transition-transform duration-200 hover:scale-125 md:h-10 md:w-10" />
                </button>
            </div>
        </div>
    );
}
