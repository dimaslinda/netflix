import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import BrandFilterBar from '@/components/netflix/BrandFilterBar';
import ContinueWatchingRow from '@/components/netflix/ContinueWatchingRow';
import Footer from '@/components/netflix/Footer';
import Hero from '@/components/netflix/Hero';
import MovieCard from '@/components/netflix/MovieCard';
import MovieHoverPortal from '@/components/netflix/MovieHoverPortal';
import MovieModal from '@/components/netflix/MovieModal';
import MovieRow from '@/components/netflix/MovieRow';
import Navbar from '@/components/netflix/Navbar';
import Top10Row from '@/components/netflix/Top10Row';
import { syncUserWatchHistory } from '@/lib/continue-watching';
import {
    fetchUserBookmarks,
    readLocalMyList,
    toggleServerBookmark,
    writeLocalMyList,
} from '@/lib/user-bookmarks';
import { Movie, TmdbResponse } from '@/types/tmdb';

interface HomeProps {
    provider?: string;
    disneyCollection?: TmdbResponse;
    trending?: TmdbResponse;
    topRated?: TmdbResponse;
    trendingTv?: TmdbResponse;
    topRatedTv?: TmdbResponse;
    actionMovies?: TmdbResponse;
    comedyMovies?: TmdbResponse;
    horrorMovies?: TmdbResponse;
    romanceMovies?: TmdbResponse;
    documentaries?: TmdbResponse;
    animationMovies?: TmdbResponse;
    animeMovies?: TmdbResponse;
    thrillerMovies?: TmdbResponse;
    sciFiMovies?: TmdbResponse;
    dramaMovies?: TmdbResponse;
    crimeMovies?: TmdbResponse;
    familyMovies?: TmdbResponse;
    fantasyMovies?: TmdbResponse;
    mysteryMovies?: TmdbResponse;
    koreanContent?: TmdbResponse;
    popularTv?: TmdbResponse;
    nowPlaying?: TmdbResponse;
}

export default function Home(props: HomeProps) {
    const isMyListView =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('category') ===
            'mylist';

    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [hovered, setHovered] = useState<{
        movie: Movie;
        rect: DOMRect;
    } | null>(null);

    const [myList, setMyList] = useState<Movie[]>(readLocalMyList);

    // Sinkronisasi riwayat tontonan dan daftar simpanan akun dari database
    useEffect(() => {
        syncUserWatchHistory();

        fetchUserBookmarks().then((items) => {
            if (items) {
                setMyList(items);
            }
        });

        const handleBookmarksUpdated = () => {
            setMyList(readLocalMyList());
        };
        window.addEventListener(
            'user-bookmarks-updated',
            handleBookmarksUpdated,
        );
        return () =>
            window.removeEventListener(
                'user-bookmarks-updated',
                handleBookmarksUpdated,
            );
    }, []);

    const openDetails = useCallback((movie: Movie) => {
        setHovered(null);
        setSelectedMovie(movie);
    }, []);

    const play = useCallback((movie: Movie) => {
        const title = movie.title ?? movie.name ?? movie.original_name ?? '';
        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (movie.poster_path) params.set('poster', movie.poster_path);
        if (movie.backdrop_path) params.set('backdrop', movie.backdrop_path);
        const qs = params.toString();
        router.visit(
            `/watch/${movie.media_type ?? 'movie'}/${movie.id}${qs ? `?${qs}` : ''}`,
        );
    }, []);

    const toggleMyList = useCallback((movie: Movie) => {
        setMyList((previous) => {
            const next = previous.some((entry) => entry.id === movie.id)
                ? previous.filter((entry) => entry.id !== movie.id)
                : [...previous, movie];

            writeLocalMyList(next);
            toggleServerBookmark(movie);

            return next;
        });
    }, []);

    const heroMovie =
        props.trending?.results?.[0] ?? props.nowPlaying?.results?.[0];

    const discoveryRows: { title: string; movies?: Movie[] }[] = [
        ...(props.disneyCollection?.results &&
        props.disneyCollection.results.length > 0
            ? [
                  {
                      title: 'Koleksi Populer Disney & Pixar',
                      movies: props.disneyCollection.results,
                  },
              ]
            : []),
        { title: 'Sedang ramai', movies: props.trending?.results },
        { title: 'Baru tayang', movies: props.nowPlaying?.results },
        { title: 'Penilaian tertinggi', movies: props.topRated?.results },
        { title: 'Serial populer', movies: props.popularTv?.results },
        { title: 'Laga', movies: props.actionMovies?.results },
        { title: 'Drama Korea', movies: props.koreanContent?.results },
        { title: 'Komedi', movies: props.comedyMovies?.results },
        { title: 'Horor', movies: props.horrorMovies?.results },
        { title: 'Fiksi ilmiah', movies: props.sciFiMovies?.results },
        { title: 'Dokumenter', movies: props.documentaries?.results },
        { title: 'Anime', movies: props.animeMovies?.results },
        { title: 'Misteri', movies: props.mysteryMovies?.results },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--cinema-base)] text-[var(--cinema-ink)]">
            <Head title={isMyListView ? 'Daftar Saya' : 'Beranda'} />

            <Navbar
                activePath={
                    props.provider ? `/?provider=${props.provider}` : '/'
                }
            />

            <main>
                {isMyListView ? (
                    <MyListView list={myList} onSelect={openDetails} />
                ) : (
                    <>
                        {heroMovie && (
                            <Hero
                                movie={heroMovie}
                                onPlay={play}
                                onMoreInfo={openDetails}
                            />
                        )}

                        <div className="relative z-10 space-y-10 pt-10 pb-16 md:-mt-20 md:pt-0">
                            {/* Bilah Filter Studio / Platform Streaming */}
                            <BrandFilterBar activeProvider={props.provider} />

                            {/* Baris Lanjutkan Menonton */}
                            <ContinueWatchingRow />

                            {/* Baris 10 Teratas */}
                            {props.trending?.results &&
                                props.trending.results.length >= 10 && (
                                    <Top10Row
                                        title="10 Teratas Hari Ini"
                                        movies={props.trending.results}
                                        onSelect={openDetails}
                                    />
                                )}

                            {/* Baris Kategori Rekomendasi */}
                            {discoveryRows.map(
                                (row) =>
                                    row.movies &&
                                    row.movies.length > 0 && (
                                        <MovieRow
                                            key={row.title}
                                            title={row.title}
                                            movies={row.movies}
                                            onSelect={openDetails}
                                            onHover={(movie, rect) =>
                                                setHovered({ movie, rect })
                                            }
                                        />
                                    ),
                            )}
                        </div>
                    </>
                )}
            </main>

            <Footer />

            {selectedMovie && (
                <MovieModal
                    key={`${selectedMovie.media_type ?? 'movie'}-${selectedMovie.id}`}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedMovie(null);
                        }
                    }}
                    movie={selectedMovie}
                    inMyList={myList.some(
                        (entry) => entry.id === selectedMovie.id,
                    )}
                    onToggleMyList={toggleMyList}
                />
            )}

            <MovieHoverPortal
                movie={hovered?.movie ?? null}
                rect={hovered?.rect ?? null}
                onClose={() => setHovered(null)}
                onSelect={openDetails}
                onPlay={play}
                onAddToList={toggleMyList}
            />
        </div>
    );
}

function MyListView({
    list,
    onSelect,
}: {
    list: Movie[];
    onSelect: (movie: Movie) => void;
}) {
    return (
        <div className="min-h-[60vh] px-4 pt-24 pb-16 md:px-12 lg:px-16">
            <h1 className="text-2xl font-bold md:text-3xl">Daftar Saya</h1>

            {list.length === 0 ? (
                <div className="mt-10 max-w-lg rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-8 py-12">
                    <p className="font-semibold">Daftar ini masih kosong</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--cinema-ink-soft)]">
                        Buka rincian sebuah judul, lalu tekan Tambah ke daftar.
                        Isinya tersimpan di peramban ini saja.
                    </p>
                </div>
            ) : (
                <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                    {list.map((movie) => (
                        <li key={movie.id}>
                            <MovieCard
                                movie={movie}
                                onSelect={onSelect}
                                size="poster"
                                showTitleBelow
                                isSearchCard
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
