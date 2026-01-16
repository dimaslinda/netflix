import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { Movie } from '@/types/tmdb';

import MovieCard from './MovieCard';

interface MovieRowProps {
    title: string;
    movies: Movie[];
    onSelect?: (movie: Movie) => void;
    variant?: 'default' | 'large';
    showRank?: boolean;
}

export default function MovieRow({
    title,
    movies,
    onSelect,
    variant = 'default',
    showRank = false,
}: MovieRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [isMoved, setIsMoved] = useState(false);

    const handleClick = (direction: 'left' | 'right') => {
        setIsMoved(true);
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo =
                direction === 'left'
                    ? scrollLeft - clientWidth
                    : scrollLeft + clientWidth;

            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-2">
            <h2 className="cursor-pointer text-base font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
                {title}
            </h2>
            <div className="group relative md:-ml-2">
                <ChevronLeft
                    className={`absolute top-0 bottom-0 left-2 z-50 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125 ${
                        !isMoved && 'hidden'
                    }`}
                    onClick={() => handleClick('left')}
                />
                <div
                    ref={rowRef}
                    className="scrollbar-hide flex items-center gap-x-2 overflow-x-scroll md:gap-x-4 md:px-2"
                >
                    {movies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onSelect={onSelect}
                            size={variant === 'large' ? 'large' : 'default'}
                            rank={showRank ? index + 1 : undefined}
                        />
                    ))}
                </div>
                <ChevronRight
                    className="absolute top-0 right-2 bottom-0 z-50 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125"
                    onClick={() => handleClick('right')}
                />
            </div>
        </div>
    );
}
