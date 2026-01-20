import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import Hero from '@/components/netflix/Hero';
import MovieModal from '@/components/netflix/MovieModal';
import Navbar from '@/components/netflix/Navbar';
import { Movie, TmdbResponse } from '@/types/tmdb';

type ProviderKey =
    | 'netflix'
    | 'prime'
    | 'disney'
    | 'viu'
    | 'vidio'
    | 'hbomax';

interface BrowseCategoryProps {
    provider?: ProviderKey | null;
    category: string;
    title: string;
    page: number;
    results: TmdbResponse;
}

const PROVIDER_THEMES: Record<
    ProviderKey,
    { background: string; headTitlePrefix: string }
> = {
    netflix: {
        background: '#141414',
        headTitlePrefix: 'Netflix',
    },
    prime: {
        background: '#0f171e',
        headTitlePrefix: 'Prime Video',
    },
    disney: {
        background: '#040714',
        headTitlePrefix: 'Disney+',
    },
    viu: {
        background: '#1a1a1a',
        headTitlePrefix: 'Viu',
    },
    vidio: {
        background: '#141414',
        headTitlePrefix: 'Vidio',
    },
    hbomax: {
        background: '#0f1a2a',
        headTitlePrefix: 'HBO Max',
    },
};

export default function BrowseCategory({
    provider,
    category,
    title,
    page,
    results,
}: BrowseCategoryProps) {
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isMovieOpen, setIsMovieOpen] = useState(false);

    const providerKey: ProviderKey = (
        ['netflix', 'prime', 'disney', 'viu', 'vidio', 'hbomax'] as const
    ).includes((provider ?? 'netflix') as ProviderKey)
        ? ((provider ?? 'netflix') as ProviderKey)
        : 'netflix';

    const theme = PROVIDER_THEMES[providerKey];

    const heroMovie = useMemo(
        () =>
            (results.results || []).find(
                (m) => m.backdrop_path || m.poster_path,
            ) || results.results[0],
        [results.results],
    );

    const headTitle = `${title} - ${theme.headTitlePrefix}`;

    const handleChangeProvider = () => {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.removeItem('selectedProvider');
            } catch {
                void 0;
            }
        }
        router.visit('/streaming/select');
    };

    const handleOpenMovie = (movie: Movie) => {
        setSelectedMovie(movie);
        setIsMovieOpen(true);
    };

    const handleChangePage = (nextPage: number) => {
        if (nextPage < 1 || nextPage === page) return;

        const searchParams = new URLSearchParams();
        searchParams.set('page', String(nextPage));
        if (providerKey) {
            searchParams.set('provider', providerKey);
        }

        router.visit(`/browse/${category}?${searchParams.toString()}`);
    };

    return (
        <div
            className="min-h-screen overflow-x-hidden"
            style={{ backgroundColor: theme.background }}
        >
            <Head title={headTitle} />
            <Navbar
                onSearchClick={() => {
                    const params = new URLSearchParams();
                    if (providerKey) params.set('provider', providerKey);
                    router.visit(`/search?${params.toString()}`);
                }}
                onProviderChange={handleChangeProvider}
                onCategoryChange={() => {
                    const params = new URLSearchParams();
                    params.set('provider', providerKey);
                    router.visit(`/?${params.toString()}`);
                }}
                activeCategory="home"
                brand={providerKey}
            />

            <main className="relative pb-24">
                {heroMovie ? (
                    <Hero movie={heroMovie} onPlay={handleOpenMovie} />
                ) : null}

                <section className="px-4 pt-6 md:px-16">
                    <h1 className="mb-4 text-xl font-semibold text-white md:text-2xl">
                        {title}
                    </h1>
                    <div className="grid gap-4 text-white sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {results.results.map((movie) => {
                            const backdropPath =
                                movie.backdrop_path || movie.poster_path;
                            const imageUrl = backdropPath
                                ? `https://image.tmdb.org/t/p/w780${backdropPath}`
                                : 'https://placehold.co/780x439/1a1a1a/ffffff?text=No+Image';
                            const movieTitle =
                                movie.title || movie.name || movie.original_name;

                            return (
                                <button
                                    key={movie.id}
                                    type="button"
                                    className="flex flex-col text-left"
                                    onClick={() => handleOpenMovie(movie)}
                                >
                                    <div className="overflow-hidden rounded-sm bg-zinc-900 transition duration-300 hover:scale-[1.03]">
                                        <img
                                            src={imageUrl}
                                            alt={movieTitle}
                                            className="aspect-video h-auto w-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="mt-2 line-clamp-1 text-xs md:text-sm">
                                        {movieTitle}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-4 text-sm text-white">
                        <button
                            type="button"
                            className="rounded bg-zinc-800 px-4 py-2 disabled:opacity-40"
                            disabled={page <= 1}
                            onClick={() => handleChangePage(page - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {page}</span>
                        <button
                            type="button"
                            className="rounded bg-zinc-800 px-4 py-2"
                            onClick={() => handleChangePage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </section>
            </main>

            {isMovieOpen && selectedMovie ? (
                <MovieModal
                    open={isMovieOpen}
                    onOpenChange={(open) => {
                        setIsMovieOpen(open);
                        if (!open) setSelectedMovie(null);
                    }}
                    movie={selectedMovie}
                />
            ) : null}
        </div>
    );
}
