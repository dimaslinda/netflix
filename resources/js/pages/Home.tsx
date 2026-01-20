import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import Footer from '@/components/netflix/Footer';
import Hero from '@/components/netflix/Hero';
import MovieModal from '@/components/netflix/MovieModal';
import MovieRow from '@/components/netflix/MovieRow';
import Navbar from '@/components/netflix/Navbar';
import PublicDomainModal from '@/components/netflix/PublicDomainModal';
import PublicDomainRow from '@/components/netflix/PublicDomainRow';
import Top10Row from '@/components/netflix/Top10Row';
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
    trendingTv: TmdbResponse;
    topRatedTv: TmdbResponse;
    actionMovies: TmdbResponse;
    comedyMovies: TmdbResponse;
    horrorMovies: TmdbResponse;
    romanceMovies: TmdbResponse;
    documentaries: TmdbResponse;
    animationMovies: TmdbResponse;
    animeMovies: TmdbResponse;
    // New categories
    thrillerMovies: TmdbResponse;
    sciFiMovies: TmdbResponse;
    dramaMovies: TmdbResponse;
    crimeMovies: TmdbResponse;
    familyMovies: TmdbResponse;
    fantasyMovies: TmdbResponse;
    mysteryMovies: TmdbResponse;
    koreanContent: TmdbResponse;
    popularTv: TmdbResponse;
    nowPlaying: TmdbResponse;
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
    trendingTv,
    topRatedTv,
    actionMovies,
    comedyMovies,
    horrorMovies,
    romanceMovies,
    documentaries,
    animationMovies,
    animeMovies,
    thrillerMovies,
    sciFiMovies,
    dramaMovies,
    crimeMovies,
    familyMovies,
    fantasyMovies,
    mysteryMovies,
    koreanContent,
    popularTv,
    nowPlaying,
    provider,
}: HomeProps) {
    // Prioritize movies with actual backdrop images for the hero
    const heroMovie = useMemo(() => {
        // First, try to find a movie with backdrop_path from trending
        const withBackdrop = (trending?.results || []).find(
            (m) => m.backdrop_path && m.backdrop_path.length > 0,
        );
        if (withBackdrop) return withBackdrop;

        // Try from now playing
        const fromNowPlaying = (nowPlaying?.results || []).find(
            (m) => m.backdrop_path && m.backdrop_path.length > 0,
        );
        if (fromNowPlaying) return fromNowPlaying;

        // Try from popular TV
        const fromPopularTv = (popularTv?.results || []).find(
            (m) => m.backdrop_path && m.backdrop_path.length > 0,
        );
        if (fromPopularTv) return fromPopularTv;

        // Fallback to any movie with poster_path
        const withPoster = (trending?.results || []).find(
            (m) => m.poster_path && m.poster_path.length > 0,
        );
        if (withPoster) return withPoster;

        // Last resort: first movie
        return trending?.results?.[0] || undefined;
    }, [trending, nowPlaying, popularTv]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isMovieOpen, setIsMovieOpen] = useState(false);
    const [publicDomain, setPublicDomain] = useState<ArchivePublicDomainItem[]>(
        [],
    );
    const [selectedPublicDomain, setSelectedPublicDomain] =
        useState<ArchivePublicDomainItem | null>(null);
    const [isPublicDomainOpen, setIsPublicDomainOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('home');
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

    const providerKey: ProviderKey = (
        ['netflix', 'prime', 'disney', 'viu', 'vidio', 'hbomax'] as const
    ).includes((provider ?? 'netflix') as ProviderKey)
        ? ((provider ?? 'netflix') as ProviderKey)
        : 'netflix';

    const theme = PROVIDER_THEMES[providerKey];

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
            .catch(() => { });
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

    interface HomeRow {
        title: string;
        data: TmdbResponse;
        variant: 'default' | 'large' | 'poster';
        showRank?: boolean;
        browseCategory?: string;
    }

    const filteredRows = useMemo<HomeRow[]>(() => {
        if (!trending) return [];

        if (activeCategory === 'home') {
            const rows: HomeRow[] = [];

            // Trending Now
            if (trending?.results?.length) {
                rows.push({
                    title: 'Trending Now',
                    data: trending,
                    variant: 'default',
                    browseCategory: 'trending',
                });
            }

            // Top 10 in Indonesia (Netflix specific)
            if (providerKey === 'netflix' && trending.results?.length) {
                const topTen: TmdbResponse = {
                    ...trending,
                    results: trending.results.slice(0, 10),
                };
                rows.push({
                    title: 'Top 10 in Indonesia Today',
                    data: topTen,
                    variant: 'large',
                    showRank: true,
                });
            }

            // Now Playing in Theaters
            if (nowPlaying?.results?.length) {
                rows.push({
                    title: 'Now Playing in Theaters',
                    data: nowPlaying,
                    variant: 'default',
                    browseCategory: 'now-playing',
                });
            }

            // Popular TV Shows
            if (popularTv?.results?.length) {
                rows.push({
                    title: 'Popular TV Shows',
                    data: popularTv,
                    variant: 'default',
                    browseCategory: 'popular-tv',
                });
            }

            // Top Rated
            if (topRated?.results?.length) {
                rows.push({
                    title: 'Top Rated',
                    data: topRated,
                    variant: 'default',
                    browseCategory: 'top-rated',
                });
            }

            // Korean Dramas
            if (koreanContent?.results?.length) {
                rows.push({
                    title: 'Korean Dramas',
                    data: koreanContent,
                    variant: 'default',
                    browseCategory: 'korean',
                });
            }

            // Action
            if (actionMovies?.results?.length) {
                rows.push({
                    title: 'Action & Adventure',
                    data: actionMovies,
                    variant: 'default',
                    browseCategory: 'action',
                });
            }

            // Thriller
            if (thrillerMovies?.results?.length) {
                rows.push({
                    title: 'Thrillers',
                    data: thrillerMovies,
                    variant: 'default',
                    browseCategory: 'thriller',
                });
            }

            // Sci-Fi
            if (sciFiMovies?.results?.length) {
                rows.push({
                    title: 'Sci-Fi & Fantasy',
                    data: sciFiMovies,
                    variant: 'default',
                    browseCategory: 'scifi',
                });
            }

            // Comedy
            if (comedyMovies?.results?.length) {
                rows.push({
                    title: 'Comedies',
                    data: comedyMovies,
                    variant: 'default',
                    browseCategory: 'comedy',
                });
            }

            // Drama
            if (dramaMovies?.results?.length) {
                rows.push({
                    title: 'Dramas',
                    data: dramaMovies,
                    variant: 'default',
                    browseCategory: 'drama',
                });
            }

            // Horror
            if (horrorMovies?.results?.length) {
                rows.push({
                    title: 'Scary Movies',
                    data: horrorMovies,
                    variant: 'default',
                    browseCategory: 'horror',
                });
            }

            // Crime
            if (crimeMovies?.results?.length) {
                rows.push({
                    title: 'Crime',
                    data: crimeMovies,
                    variant: 'default',
                    browseCategory: 'crime',
                });
            }

            // Romance
            if (romanceMovies?.results?.length) {
                rows.push({
                    title: 'Romantic Movies',
                    data: romanceMovies,
                    variant: 'default',
                    browseCategory: 'romance',
                });
            }

            // Family
            if (familyMovies?.results?.length) {
                rows.push({
                    title: 'Family Favorites',
                    data: familyMovies,
                    variant: 'default',
                    browseCategory: 'family',
                });
            }

            // Fantasy
            if (fantasyMovies?.results?.length) {
                rows.push({
                    title: 'Fantasy',
                    data: fantasyMovies,
                    variant: 'default',
                    browseCategory: 'fantasy',
                });
            }

            // Mystery
            if (mysteryMovies?.results?.length) {
                rows.push({
                    title: 'Mystery',
                    data: mysteryMovies,
                    variant: 'default',
                    browseCategory: 'mystery',
                });
            }

            // Documentaries
            if (documentaries?.results?.length) {
                rows.push({
                    title: 'Documentaries',
                    data: documentaries,
                    variant: 'default',
                    browseCategory: 'documentaries',
                });
            }

            // Animation
            if (animationMovies?.results?.length) {
                rows.push({
                    title: 'Animation',
                    data: animationMovies,
                    variant: 'default',
                    browseCategory: 'animation',
                });
            }

            // Anime
            if (animeMovies?.results?.length) {
                rows.push({
                    title: 'Anime',
                    data: animeMovies,
                    variant: 'default',
                    browseCategory: 'anime',
                });
            }

            return rows;
        }

        if (activeCategory === 'tv') {
            const rows: HomeRow[] = [];

            if (trendingTv?.results?.length) {
                rows.push({
                    title: 'Trending TV Shows',
                    data: trendingTv,
                    variant: 'large',
                    browseCategory: 'tv-trending',
                });
            }

            if (topRatedTv?.results?.length) {
                rows.push({
                    title: 'Top Rated TV Shows',
                    data: topRatedTv,
                    variant: 'large',
                    browseCategory: 'tv-top-rated',
                });
            }

            if (popularTv?.results?.length) {
                rows.push({
                    title: 'Popular on Netflix',
                    data: popularTv,
                    variant: 'large',
                    browseCategory: 'popular-tv',
                });
            }

            if (koreanContent?.results?.length) {
                rows.push({
                    title: 'K-Dramas',
                    data: koreanContent,
                    variant: 'large',
                    browseCategory: 'korean',
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
                            (m) => m.media_type === 'movie' || !m.media_type,
                        ),
                    }
                    : null;

            const rows: HomeRow[] = [];

            const trendingMovies = movieOnly(trending);
            if (trendingMovies?.results?.length) {
                rows.push({
                    title: 'Trending Movies',
                    data: trendingMovies,
                    variant: 'large',
                    browseCategory: 'trending',
                });
            }

            if (nowPlaying?.results?.length) {
                rows.push({
                    title: 'In Theaters',
                    data: nowPlaying,
                    variant: 'large',
                    browseCategory: 'now-playing',
                });
            }

            const topRatedMovies = movieOnly(topRated);
            if (topRatedMovies?.results?.length) {
                rows.push({
                    title: 'Top Rated',
                    data: topRatedMovies,
                    variant: 'large',
                    browseCategory: 'top-rated',
                });
            }

            if (actionMovies?.results?.length) {
                rows.push({
                    title: 'Action',
                    data: actionMovies,
                    variant: 'large',
                    browseCategory: 'action',
                });
            }

            if (sciFiMovies?.results?.length) {
                rows.push({
                    title: 'Sci-Fi',
                    data: sciFiMovies,
                    variant: 'large',
                    browseCategory: 'scifi',
                });
            }

            if (thrillerMovies?.results?.length) {
                rows.push({
                    title: 'Thrillers',
                    data: thrillerMovies,
                    variant: 'large',
                    browseCategory: 'thriller',
                });
            }

            if (horrorMovies?.results?.length) {
                rows.push({
                    title: 'Horror',
                    data: horrorMovies,
                    variant: 'large',
                    browseCategory: 'horror',
                });
            }

            if (comedyMovies?.results?.length) {
                rows.push({
                    title: 'Comedy',
                    data: comedyMovies,
                    variant: 'large',
                    browseCategory: 'comedy',
                });
            }

            if (dramaMovies?.results?.length) {
                rows.push({
                    title: 'Drama',
                    data: dramaMovies,
                    variant: 'large',
                    browseCategory: 'drama',
                });
            }

            if (romanceMovies?.results?.length) {
                rows.push({
                    title: 'Romance',
                    data: romanceMovies,
                    variant: 'large',
                    browseCategory: 'romance',
                });
            }

            if (animationMovies?.results?.length) {
                rows.push({
                    title: 'Animation',
                    data: animationMovies,
                    variant: 'large',
                    browseCategory: 'animation',
                });
            }

            return rows;
        }

        if (activeCategory === 'new') {
            const rows: HomeRow[] = [];

            if (nowPlaying?.results?.length) {
                rows.push({
                    title: 'New Releases',
                    data: nowPlaying,
                    variant: 'large',
                    browseCategory: 'now-playing',
                });
            }

            if (trending?.results?.length) {
                rows.push({
                    title: 'Popular Movies',
                    data: trending,
                    variant: 'large',
                    browseCategory: 'trending',
                });
            }

            if (trendingTv?.results?.length) {
                rows.push({
                    title: 'Popular TV Shows',
                    data: trendingTv,
                    variant: 'large',
                    browseCategory: 'tv-trending',
                });
            }

            if (koreanContent?.results?.length) {
                rows.push({
                    title: 'New Korean Dramas',
                    data: koreanContent,
                    variant: 'large',
                    browseCategory: 'korean',
                });
            }

            return rows;
        }

        if (activeCategory === 'mylist') {
            if (!myList.length) {
                return [];
            }

            const data: TmdbResponse = {
                page: 1,
                results: myList,
                total_pages: 1,
                total_results: myList.length,
            };

            return [
                {
                    title: 'My List',
                    data,
                    variant: 'large',
                },
            ];
        }

        return [];
    }, [
        activeCategory,
        trending,
        topRated,
        trendingTv,
        topRatedTv,
        actionMovies,
        comedyMovies,
        horrorMovies,
        romanceMovies,
        documentaries,
        animationMovies,
        animeMovies,
        thrillerMovies,
        sciFiMovies,
        dramaMovies,
        crimeMovies,
        familyMovies,
        fantasyMovies,
        mysteryMovies,
        koreanContent,
        popularTv,
        nowPlaying,
        providerKey,
        myList,
    ]);

    if (!heroMovie) {
        return (
            <div
                className="min-h-screen text-white"
                style={{ backgroundColor: theme.background }}
            >
                <Head title={theme.headTitle} />
                <Navbar
                    onSearchClick={() => {
                        const params = new URLSearchParams();
                        if (providerKey) params.set('provider', providerKey);
                        router.visit(`/search?${params.toString()}`);
                    }}
                    onCategoryChange={setActiveCategory}
                    onProviderChange={handleChangeProvider}
                    activeCategory={activeCategory}
                    brand={providerKey}
                />
                <main className="flex min-h-screen items-center justify-center px-4 pt-24 md:px-16">
                    <div className="text-center">
                        <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                        <p className="text-zinc-400">Loading content...</p>
                    </div>
                </main>
                <Footer />
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
                onSearchClick={() => {
                    const params = new URLSearchParams();
                    if (providerKey) params.set('provider', providerKey);
                    router.visit(`/search?${params.toString()}`);
                }}
                onCategoryChange={setActiveCategory}
                onProviderChange={handleChangeProvider}
                activeCategory={activeCategory}
                brand={providerKey}
            />

            <main className="relative">
                <Hero
                    movie={heroMovie}
                    onPlay={openMovie}
                    onMoreInfo={openMovieDetails}
                />

                <section className="relative z-20 space-y-6 pb-8 md:space-y-10">
                    {filteredRows.map((row) =>
                        row.data ? (
                            <div key={row.title} className="space-y-1">
                                {!row.showRank && (
                                    <div className="flex items-center justify-between px-4 md:px-12 lg:px-16">
                                        <h2 className="cursor-pointer text-base font-bold text-[#e5e5e5] transition duration-200 hover:text-white md:text-xl lg:text-2xl">
                                            {row.title}
                                        </h2>
                                        {row.browseCategory ? (
                                            <button
                                                type="button"
                                                className="text-xs font-semibold text-zinc-300 hover:text-white md:text-sm"
                                                onClick={() => {
                                                    const params = new URLSearchParams();
                                                    params.set('provider', providerKey);
                                                    params.set('page', '1');
                                                    router.visit(
                                                        `/browse/${row.browseCategory}?${params.toString()}`,
                                                    );
                                                }}
                                            >
                                                See All →
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                                {row.showRank ? (
                                    <Top10Row
                                        title={row.title}
                                        movies={row.data.results}
                                        onSelect={openMovie}
                                    />
                                ) : (
                                    <MovieRow
                                        title={row.title}
                                        movies={row.data.results}
                                        onSelect={openMovie}
                                        variant={row.variant as 'default' | 'large' | 'poster'}
                                        hideTitle
                                    />
                                )}
                            </div>
                        ) : null,
                    )}

                    {publicDomain.length ? (
                        <div className="space-y-1 px-4 md:px-12 lg:px-16">
                            <PublicDomainRow
                                title="Free to Watch (Public Domain)"
                                items={publicDomain}
                                onSelect={openPublicDomain}
                            />
                        </div>
                    ) : null}
                </section>
            </main>

            <Footer />

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
