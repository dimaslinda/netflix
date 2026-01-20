import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

import MovieCard from './MovieCard';

interface MovieRowProps {
    title: string;
    movies: Movie[];
    onSelect?: (movie: Movie) => void;
    variant?: 'default' | 'large' | 'poster';
    hideTitle?: boolean;
}

export default function MovieRow({
    title,
    movies,
    onSelect,
    variant = 'default',
    hideTitle = false,
}: MovieRowProps) {
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

            // Update arrow visibility after scroll
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

    const cardSize =
        variant === 'poster'
            ? 'poster'
            : variant === 'large'
                ? 'large'
                : 'default';

    return (
        <div className="group/row relative space-y-1 md:space-y-2">
            {!hideTitle && (
                <div className="flex items-center gap-2 px-4 md:px-12 lg:px-16">
                    <h2 className="cursor-pointer text-base font-bold text-[#e5e5e5] transition duration-200 hover:text-white md:text-xl lg:text-2xl">
                        {title}
                    </h2>
                    <span className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#54b9c5] opacity-0 transition-opacity duration-300 group-hover/row:opacity-100">
                        Explore All
                        <ChevronRight className="h-4 w-4" />
                    </span>
                </div>
            )}

            <div className="relative" style={{ overflow: 'visible' }}>
                {/* Left Arrow - Sleek design */}
                <button
                    type="button"
                    className={`absolute top-0 bottom-0 left-0 z-40 flex w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 transition-all duration-300 group-hover/row:opacity-100 md:w-16 ${!showLeftArrow ? 'pointer-events-none !opacity-0' : ''}`}
                    onClick={() => handleClick('left')}
                >
                    <ChevronLeft className="h-8 w-8 text-white drop-shadow-lg transition-transform duration-200 hover:scale-125 md:h-10 md:w-10" />
                </button>

                {/* Movie Cards Container */}
                <div
                    ref={rowRef}
                    className="scrollbar-hide flex gap-2 scroll-smooth px-4 py-20 md:gap-3 md:px-12 lg:px-16 -my-16"
                    style={{
                        overflowX: 'auto',
                        overflowY: 'visible',
                    }}
                    onScroll={handleScroll}
                >
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onSelect={onSelect}
                            size={cardSize}
                        />
                    ))}
                </div>

                {/* Right Arrow - Sleek design */}
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
