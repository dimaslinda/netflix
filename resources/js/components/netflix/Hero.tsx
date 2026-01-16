import { Info, Play } from 'lucide-react';

import { Movie } from '@/types/tmdb';

interface HeroProps {
    movie: Movie;
    onPlay?: (movie: Movie) => void;
    onMoreInfo?: (movie: Movie) => void;
}

export default function Hero({ movie, onPlay, onMoreInfo }: HeroProps) {
    const backdropPath = movie.backdrop_path || movie.poster_path || null;
    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/original${backdropPath}`
        : 'https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image';

    return (
        <div className="relative flex h-[80vh] flex-col justify-end space-y-3 pb-10 md:h-[90vh] md:space-y-5 md:pb-16">
            <div className="absolute inset-0 -z-10">
                <img
                    src={imageUrl}
                    alt={movie.title || movie.name}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-transparent to-transparent" />
            </div>

            <div className="flex flex-col space-y-4 px-4 md:px-16">
                <h1 className="text-2xl font-bold md:text-4xl lg:text-7xl">
                    {movie.title || movie.name || movie.original_name}
                </h1>
                <p className="max-w-xs text-xs text-shadow-md md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl">
                    {movie.overview?.slice(0, 150)}...
                </p>

                <div className="flex space-x-3">
                    <button
                        type="button"
                        className="flex items-center gap-x-2 rounded bg-white px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e6e6e6] md:px-8 md:py-2.5 md:text-xl"
                        onClick={() => onPlay?.(movie)}
                    >
                        <Play
                            className="h-4 w-4 text-black md:h-7 md:w-7"
                            fill="black"
                        />
                        Play
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-x-2 rounded bg-[gray]/70 px-5 py-1.5 text-sm font-bold text-white transition hover:bg-[gray]/40 md:px-8 md:py-2.5 md:text-xl"
                        onClick={() => onMoreInfo?.(movie)}
                    >
                        <Info className="h-4 w-4 md:h-7 md:w-7" />
                        More Info
                    </button>
                </div>
            </div>
        </div>
    );
}
