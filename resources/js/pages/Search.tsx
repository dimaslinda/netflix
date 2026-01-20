import { Head, router } from '@inertiajs/react';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

interface SearchProps {
    provider?: ProviderKey | null;
    query: string;
    results: TmdbResponse | null;
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

export default function Search({ provider, query, results }: SearchProps) {
    const [localQuery, setLocalQuery] = useState(query);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isMovieOpen, setIsMovieOpen] = useState(false);
    const [myList, setMyList] = useState<Movie[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = window.localStorage.getItem('mylist');
            if (!raw) return [];
            const parsed = JSON.parse(raw) as Movie[];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    // Infinite scroll state
    const [allResults, setAllResults] = useState<Movie[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentSearchQuery, setCurrentSearchQuery] = useState(query);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    const providerKey: ProviderKey = (
        ['netflix', 'prime', 'disney', 'viu', 'vidio', 'hbomax'] as const
    ).includes((provider ?? 'netflix') as ProviderKey)
        ? ((provider ?? 'netflix') as ProviderKey)
        : 'netflix';

    const theme = PROVIDER_THEMES[providerKey];

    // Initialize results from server - run once when results change
    useEffect(() => {
        const serverResults = results?.results || [];
        const filtered = serverResults.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );

        setAllResults(filtered);
        setCurrentPage(results?.page || 1);
        setTotalPages(results?.total_pages || 1);
        setTotalResults(results?.total_results || 0);
        setCurrentSearchQuery(query);
        hasInitialized.current = true;
    }, [results, query]);

    // Load more results function
    const loadMoreResults = useCallback(async () => {
        if (isLoadingMore || currentPage >= totalPages || !currentSearchQuery) {
            return;
        }

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const params = new URLSearchParams({
                q: currentSearchQuery,
                page: nextPage.toString(),
            });

            const response = await fetch(`/api/tmdb/search?${params.toString()}`);
            const data = await response.json();

            if (data.results && Array.isArray(data.results)) {
                const filtered = data.results.filter(
                    (item: Movie) => item.media_type === 'movie' || item.media_type === 'tv'
                );
                setAllResults((prev) => [...prev, ...filtered]);
                setCurrentPage(nextPage);
                if (data.total_pages) {
                    setTotalPages(data.total_pages);
                }
            }
        } catch (error) {
            console.error('Failed to load more results:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, totalPages, currentSearchQuery, isLoadingMore]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && currentPage < totalPages && !isLoadingMore && allResults.length > 0) {
                    loadMoreResults();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [currentPage, totalPages, isLoadingMore, loadMoreResults, allResults.length]);

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

    const isInMyList = (movie: Movie) =>
        myList.some((m) => m.id === movie.id);

    const toggleMyList = (movie: Movie) => {
        setMyList((prev) => {
            const exists = prev.some((m) => m.id === movie.id);
            const next = exists
                ? prev.filter((m) => m.id !== movie.id)
                : [...prev, movie];

            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('mylist', JSON.stringify(next));
                }
            } catch {
                void 0;
            }

            return next;
        });
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localQuery !== query) {
                const params = new URLSearchParams();
                if (localQuery) params.set('q', localQuery);
                if (providerKey) params.set('provider', providerKey);

                router.visit(`/search?${params.toString()}`, {
                    preserveState: false,
                    replace: true,
                });
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [localQuery, query, providerKey]);

    const handleOpenMovie = (movie: Movie) => {
        setSelectedMovie(movie);
        setIsMovieOpen(true);
    };

    const hasMore = currentPage < totalPages;

    return (
        <div
            className="min-h-screen overflow-x-hidden"
            style={{ backgroundColor: theme.background }}
        >
            <Head title={`Search - ${theme.headTitlePrefix}`} />

            <Navbar
                onProviderChange={handleChangeProvider}
                onCategoryChange={(key) => {
                    const params = new URLSearchParams();
                    params.set('provider', providerKey);

                    if (key === 'home') {
                        router.visit(`/?${params.toString()}`);
                    } else if (key === 'mylist') {
                        router.visit(`/?${params.toString()}&category=mylist`);
                    } else {
                        router.visit(`/?${params.toString()}`);
                    }
                }}
                activeCategory="home"
                brand={providerKey}
            />

            <main className="relative pt-24 px-4 md:px-16 pb-10">
                <div className="flex w-full items-center border-b border-zinc-700 bg-zinc-900/50 px-4 py-3 mb-8">
                    <SearchIcon className="mr-3 h-6 w-6 text-zinc-400" />
                    <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="Search for movies, TV shows..."
                        className="w-full bg-transparent text-lg text-white placeholder:text-zinc-500 focus:outline-none md:text-2xl"
                        autoFocus
                    />
                </div>

                {/* Results info */}
                {query && totalResults > 0 && (
                    <div className="mb-4 text-sm text-zinc-400">
                        Showing {allResults.length} of {totalResults.toLocaleString()} results for "{query}"
                    </div>
                )}

                {/* No results message */}
                {query && allResults.length === 0 && !isLoadingMore && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <p className="text-lg">Your search for "{query}" did not have any matches.</p>
                        <p className="mt-2 text-sm">Suggestions:</p>
                        <ul className="mt-2 list-disc text-sm">
                            <li>Try different keywords</li>
                            <li>Looking for a movie or TV show?</li>
                            <li>Try using a movie, TV show title, or an actor name</li>
                        </ul>
                    </div>
                )}

                {/* Results grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {allResults.map((movie, index) => {
                        const backdropPath = movie.backdrop_path || movie.poster_path;
                        const imageUrl = backdropPath
                            ? `https://image.tmdb.org/t/p/w780${backdropPath}`
                            : 'https://placehold.co/780x439/1a1a1a/ffffff?text=No+Image';
                        const movieTitle = movie.title || movie.name || movie.original_name;

                        return (
                            <button
                                key={`${movie.media_type}-${movie.id}-${index}`}
                                type="button"
                                className="group relative flex flex-col text-left transition duration-300 hover:z-10 hover:scale-105"
                                onClick={() => handleOpenMovie(movie)}
                            >
                                <div className="aspect-video w-full overflow-hidden rounded-md bg-zinc-800">
                                    <img
                                        src={imageUrl}
                                        alt={movieTitle}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="mt-2 px-1">
                                    <span className="line-clamp-1 text-sm font-medium text-zinc-200 group-hover:text-white">
                                        {movieTitle}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Load more trigger / loading indicator */}
                <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading more results...</span>
                        </div>
                    )}
                    {hasMore && !isLoadingMore && allResults.length > 0 && (
                        <button
                            onClick={loadMoreResults}
                            className="rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                        >
                            Load More Results ({allResults.length} of {totalResults.toLocaleString()})
                        </button>
                    )}
                    {!hasMore && allResults.length > 0 && (
                        <p className="text-sm text-zinc-500">
                            All {totalResults.toLocaleString()} results loaded
                        </p>
                    )}
                </div>
            </main>

            {isMovieOpen && selectedMovie ? (
                <MovieModal
                    key={`${selectedMovie.media_type ?? 'movie'}-${selectedMovie.id}`}
                    open={isMovieOpen}
                    onOpenChange={(open) => {
                        setIsMovieOpen(open);
                        if (!open) setSelectedMovie(null);
                    }}
                    movie={selectedMovie}
                    inMyList={selectedMovie ? isInMyList(selectedMovie) : false}
                    onToggleMyList={toggleMyList}
                />
            ) : null}
        </div>
    );
}
