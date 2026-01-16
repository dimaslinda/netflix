import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import Hero from '@/components/netflix/Hero';
import MovieModal from '@/components/netflix/MovieModal';
import MovieRow from '@/components/netflix/MovieRow';
import Navbar from '@/components/netflix/Navbar';
import PublicDomainModal from '@/components/netflix/PublicDomainModal';
import PublicDomainRow from '@/components/netflix/PublicDomainRow';
import SearchModal from '@/components/netflix/SearchModal';
import {
    ArchivePublicDomainItem,
    ArchivePublicDomainResponse,
} from '@/types/archive';
import { Movie, TmdbResponse } from '@/types/tmdb';

type CategoryKey = 'home' | 'tv' | 'movie' | 'new' | 'mylist';

type ProviderKey = 'netflix' | 'prime' | 'disney' | 'viu' | 'vidio' | 'hbomax';

interface HomeProps {
    trending: TmdbResponse;
    topRated: TmdbResponse;
    actionMovies: TmdbResponse;
    comedyMovies: TmdbResponse;
    horrorMovies: TmdbResponse;
    romanceMovies: TmdbResponse;
    documentaries: TmdbResponse;
    provider?: ProviderKey | null;
}

const PROVIDER_THEMES: Record<
    ProviderKey,
    { background: string; headTitle: string }
> = {
    netflix: {
        background: '#141414',
        headTitle: 'Home - Netflix',
    },
    prime: {
        background: '#0f171e',
        headTitle: 'Home - Prime Video',
    },
    disney: {
        background: '#040714',
        headTitle: 'Home - Disney+',
    },
    viu: {
        background: '#1a1a1a',
        headTitle: 'Home - Viu',
    },
    vidio: {
        background: '#141414',
        headTitle: 'Home - Vidio',
    },
    hbomax: {
        background: '#0f1a2a',
        headTitle: 'Home - HBO Max',
    },
};

export default function Home({
    trending,
    topRated,
    actionMovies,
    comedyMovies,
    horrorMovies,
    romanceMovies,
    documentaries,
    provider,
}: HomeProps) {
    const heroMovie =
        (trending.results || []).find(
            (m) => m.backdrop_path || m.poster_path,
        ) ||
        (trending.results && trending.results[0]) ||
        undefined;
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isMovieOpen, setIsMovieOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [publicDomain, setPublicDomain] = useState<ArchivePublicDomainItem[]>(
        [],
    );
    const [selectedPublicDomain, setSelectedPublicDomain] =
        useState<ArchivePublicDomainItem | null>(null);
    const [isPublicDomainOpen, setIsPublicDomainOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('home');

    const providerKey: ProviderKey = (
        ['netflix', 'prime', 'disney', 'viu', 'vidio', 'hbomax'] as const
    ).includes((provider ?? 'netflix') as ProviderKey)
        ? ((provider ?? 'netflix') as ProviderKey)
        : 'netflix';

    const theme = PROVIDER_THEMES[providerKey];

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const search = window.location.search;
        const params = new URLSearchParams(search);
        const providerFromUrl = params.get('provider');

        if (providerFromUrl) {
            try {
                window.localStorage.setItem(
                    'selectedProvider',
                    providerFromUrl,
                );
            } catch {
                void 0;
            }
            return;
        }

        let storedProvider: string | null = null;
        try {
            storedProvider = window.localStorage.getItem('selectedProvider');
        } catch {
            storedProvider = null;
        }

        if (storedProvider) {
            router.visit(`/?provider=${storedProvider}`);
        } else {
            router.visit('/streaming/select');
        }
    }, []);

    useEffect(() => {
        fetch('/api/archive/public-domain?rows=20')
            .then((r) => r.json())
            .then((json: ArchivePublicDomainResponse) => {
                setPublicDomain(json.items || []);
            })
            .catch(() => {});
    }, []);

    const openMovie = (movie: Movie) => {
        setSelectedMovie(movie);
        setIsMovieOpen(true);
    };
    const openMovieDetails = (movie: Movie) => {
        const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
        window.location.href = `/title/${mediaType}/${movie.id}`;
    };
    const openPublicDomain = (item: ArchivePublicDomainItem) => {
        setSelectedPublicDomain(item);
        setIsPublicDomainOpen(true);
    };

    interface HomeRow {
        title: string;
        data: TmdbResponse;
        variant: 'default' | 'large';
        showRank?: boolean;
    }

    const filteredRows = useMemo<HomeRow[]>(() => {
        if (!trending) return [];

        if (activeCategory === 'home') {
            const rows: HomeRow[] = [];

            if (trending) {
                rows.push({
                    title: 'Trending Now',
                    data: trending,
                    variant: 'default',
                });
            }

            if (topRated) {
                rows.push({
                    title: 'Top Rated',
                    data: topRated,
                    variant: 'default',
                });
            }

            if (actionMovies) {
                rows.push({
                    title: 'Action Thrillers',
                    data: actionMovies,
                    variant: 'default',
                });
            }

            if (comedyMovies) {
                rows.push({
                    title: 'Comedies',
                    data: comedyMovies,
                    variant: 'default',
                });
            }

            if (horrorMovies) {
                rows.push({
                    title: 'Scary Movies',
                    data: horrorMovies,
                    variant: 'default',
                });
            }

            if (romanceMovies) {
                rows.push({
                    title: 'Romance Movies',
                    data: romanceMovies,
                    variant: 'default',
                });
            }

            if (documentaries) {
                rows.push({
                    title: 'Documentaries',
                    data: documentaries,
                    variant: 'default',
                });
            }

            if (providerKey === 'netflix' && trending.results.length > 0) {
                const topTen: TmdbResponse = {
                    ...trending,
                    results: trending.results.slice(0, 10),
                };

                rows.splice(1, 0, {
                    title: 'Top 10 in Indonesia Today',
                    data: topTen,
                    variant: 'large',
                    showRank: true,
                });
            }

            return rows;
        }

        if (activeCategory === 'tv') {
            const tvOnly = (
                response: TmdbResponse | null,
            ): TmdbResponse | null =>
                response
                    ? {
                          ...response,
                          results: response.results.filter(
                              (m) => m.media_type === 'tv',
                          ),
                      }
                    : null;

            const rows: HomeRow[] = [];

            const trendingTv = tvOnly(trending);
            if (trendingTv && trendingTv.results.length > 0) {
                rows.push({
                    title: 'Trending TV',
                    data: trendingTv,
                    variant: 'large',
                });
            }

            const topRatedTv = tvOnly(topRated);
            if (topRatedTv && topRatedTv.results.length > 0) {
                rows.push({
                    title: 'Top Rated TV',
                    data: topRatedTv,
                    variant: 'large',
                });
            }

            return rows;
        }

        if (activeCategory === 'movie') {
            const movieOnly = (
                response: TmdbResponse | null,
            ): TmdbResponse | null =>
                response
                    ? {
                          ...response,
                          results: response.results.filter(
                              (m) => m.media_type === 'movie',
                          ),
                      }
                    : null;

            const rows: HomeRow[] = [];

            const trendingMovies = movieOnly(trending);
            if (trendingMovies && trendingMovies.results.length > 0) {
                rows.push({
                    title: 'Trending Movies',
                    data: trendingMovies,
                    variant: 'large',
                });
            }

            const topRatedMovies = movieOnly(topRated);
            if (topRatedMovies && topRatedMovies.results.length > 0) {
                rows.push({
                    title: 'Top Rated Movies',
                    data: topRatedMovies,
                    variant: 'large',
                });
            }

            const actionMoviesOnly = movieOnly(actionMovies);
            if (actionMoviesOnly && actionMoviesOnly.results.length > 0) {
                rows.push({
                    title: 'Action Thrillers',
                    data: actionMoviesOnly,
                    variant: 'large',
                });
            }

            const comedyMoviesOnly = movieOnly(comedyMovies);
            if (comedyMoviesOnly && comedyMoviesOnly.results.length > 0) {
                rows.push({
                    title: 'Comedies',
                    data: comedyMoviesOnly,
                    variant: 'large',
                });
            }

            const horrorMoviesOnly = movieOnly(horrorMovies);
            if (horrorMoviesOnly && horrorMoviesOnly.results.length > 0) {
                rows.push({
                    title: 'Scary Movies',
                    data: horrorMoviesOnly,
                    variant: 'large',
                });
            }

            const romanceMoviesOnly = movieOnly(romanceMovies);
            if (romanceMoviesOnly && romanceMoviesOnly.results.length > 0) {
                rows.push({
                    title: 'Romance Movies',
                    data: romanceMoviesOnly,
                    variant: 'large',
                });
            }

            return rows;
        }

        if (activeCategory === 'new') {
            const rows: HomeRow[] = [];

            if (trending && trending.results.length > 0) {
                rows.push({
                    title: 'New & Popular',
                    data: trending,
                    variant: 'large',
                });
            }

            return rows;
        }

        return [];
    }, [
        activeCategory,
        trending,
        topRated,
        actionMovies,
        comedyMovies,
        horrorMovies,
        romanceMovies,
        documentaries,
        providerKey,
    ]);

    if (!heroMovie) {
        return (
            <div
                className="min-h-screen text-white"
                style={{ backgroundColor: theme.background }}
            >
                <Head title={theme.headTitle} />
                <Navbar
                    onSearchClick={() => setIsSearchOpen(true)}
                    onCategoryChange={setActiveCategory}
                    activeCategory={activeCategory}
                    brand={providerKey}
                />
                <main className="px-4 pt-24 md:px-16">Loading...</main>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen overflow-x-hidden"
            style={{ backgroundColor: theme.background }}
        >
            <Head title={theme.headTitle} />
            <Navbar
                onSearchClick={() => setIsSearchOpen(true)}
                onCategoryChange={setActiveCategory}
                activeCategory={activeCategory}
                brand={providerKey}
            />

            <main className="relative pb-24">
                <Hero
                    movie={heroMovie}
                    onPlay={openMovie}
                    onMoreInfo={openMovieDetails}
                />

                <section className="space-y-10 px-4 md:space-y-14 md:px-16">
                    {filteredRows.map((row) =>
                        row.data ? (
                            <MovieRow
                                key={row.title}
                                title={row.title}
                                movies={row.data.results}
                                onSelect={openMovie}
                                variant={row.variant as 'default' | 'large'}
                                showRank={row.showRank ?? false}
                            />
                        ) : null,
                    )}

                    {publicDomain.length ? (
                        <PublicDomainRow
                            title="Public Domain (Free)"
                            items={publicDomain}
                            onSelect={openPublicDomain}
                        />
                    ) : null}
                </section>
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
                />
            ) : null}

            {isSearchOpen ? (
                <SearchModal
                    open={isSearchOpen}
                    onOpenChange={setIsSearchOpen}
                    onSelect={(movie) => {
                        setIsSearchOpen(false);
                        openMovie(movie);
                    }}
                />
            ) : null}

            {isPublicDomainOpen && selectedPublicDomain ? (
                <PublicDomainModal
                    key={selectedPublicDomain.identifier}
                    open={isPublicDomainOpen}
                    onOpenChange={(open) => {
                        setIsPublicDomainOpen(open);
                        if (!open) setSelectedPublicDomain(null);
                    }}
                    item={selectedPublicDomain}
                />
            ) : null}
        </div>
    );
}
