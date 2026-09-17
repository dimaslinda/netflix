import { Head, router } from '@inertiajs/react';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import MovieCard from '@/components/netflix/MovieCard';
import MovieModal from '@/components/netflix/MovieModal';
import Navbar from '@/components/netflix/Navbar';
import { Movie, TmdbResponse } from '@/types/tmdb';

interface SearchProps {
    query: string;
    results: TmdbResponse | null;
}

/** Jeda sebelum ketikan dikirim sebagai pencarian, agar setiap huruf tidak
 *  memicu satu permintaan ke TMDB. */
const TYPING_SETTLE_MS = 500;

export default function Search({ query, results }: SearchProps) {
    const [typed, setTyped] = useState(query);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    const [items, setItems] = useState<Movie[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement>(null);

    // Hasil dari server adalah kebenaran awal setiap kali kueri berubah.
    // Halaman berikutnya ditumpuk di atasnya lewat pengamat di bawah.
    useEffect(() => {
        setItems(
            (results?.results ?? []).filter(
                (item) =>
                    item.media_type === 'movie' || item.media_type === 'tv',
            ),
        );
        setPage(results?.page ?? 1);
        setTotalPages(results?.total_pages ?? 1);
        setTotalResults(results?.total_results ?? 0);
        setLoadError(null);
    }, [results]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || page >= totalPages || !query) {
            return;
        }

        setIsLoadingMore(true);
        setLoadError(null);

        const nextPage = page + 1;

        try {
            const params = new URLSearchParams({
                q: query,
                page: String(nextPage),
            });

            const response = await fetch(
                `/api/tmdb/search?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error('TMDB tidak merespons.');
            }

            const data = (await response.json()) as TmdbResponse;

            setItems((previous) => [
                ...previous,
                ...(data.results ?? []).filter(
                    (item) =>
                        item.media_type === 'movie' || item.media_type === 'tv',
                ),
            ]);
            setPage(nextPage);

            if (data.total_pages) {
                setTotalPages(data.total_pages);
            }
        } catch (cause: unknown) {
            setLoadError(
                cause instanceof Error
                    ? cause.message
                    : 'Gagal memuat hasil berikutnya.',
            );
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, page, totalPages, query]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || items.length === 0 || page >= totalPages) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    void loadMore();
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [loadMore, items.length, page, totalPages]);

    // Ketikan menunggu sejenak sebelum menjadi kunjungan halaman, jadi alamat
    // di bilah tetap mencerminkan kueri dan bisa dibagikan.
    useEffect(() => {
        if (typed === query) {
            return;
        }

        const timer = setTimeout(() => {
            router.visit(
                typed ? `/search?q=${encodeURIComponent(typed)}` : '/search',
                { preserveState: false, replace: true },
            );
        }, TYPING_SETTLE_MS);

        return () => clearTimeout(timer);
    }, [typed, query]);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--cinema-base)] text-[var(--cinema-ink)]">
            <Head title={query ? `Cari: ${query}` : 'Cari'} />
            <Navbar activePath="/search" />

            <main className="px-4 pt-24 pb-20 md:px-12 lg:px-16">
                <label htmlFor="search-input" className="sr-only">
                    Cari judul film atau serial
                </label>
                <div className="relative mx-auto max-w-2xl">
                    <SearchIcon
                        className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--cinema-ink-faint)]"
                        aria-hidden="true"
                    />
                    <input
                        id="search-input"
                        type="search"
                        value={typed}
                        autoFocus
                        onChange={(event) => setTyped(event.target.value)}
                        placeholder="Ketik judul film atau serial"
                        className="cinema-focus h-14 w-full rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] pr-12 pl-12 text-[15px] text-[var(--cinema-ink)] placeholder:text-[var(--cinema-ink-faint)]"
                    />
                    {typed && (
                        <button
                            type="button"
                            onClick={() => setTyped('')}
                            aria-label="Kosongkan pencarian"
                            className="cinema-focus absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--cinema-ink-faint)] transition hover:bg-white/5 hover:text-[var(--cinema-ink)]"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                </div>

                <div className="mt-10">
                    {!query ? (
                        <EmptyPanel
                            title="Mulai mengetik"
                            description="Hasil datang dari TMDB. Untuk memutar sebuah judul, Anda tetap perlu memilih sumber berkasnya di halaman tonton."
                        />
                    ) : items.length === 0 ? (
                        <EmptyPanel
                            title={`Tidak ada hasil untuk "${query}"`}
                            description="Periksa ejaannya, atau coba judul aslinya dalam bahasa Inggris."
                        />
                    ) : (
                        <>
                            <p
                                aria-live="polite"
                                className="mb-6 text-[13px] text-[var(--cinema-ink-faint)]"
                            >
                                {totalResults.toLocaleString('id-ID')} judul
                                cocok
                            </p>

                            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                                {items.map((movie, index) => (
                                    <li key={`${movie.id}-${index}`}>
                                        <MovieCard
                                            movie={movie}
                                            onSelect={setSelectedMovie}
                                            size="poster"
                                            showTitleBelow
                                            isSearchCard
                                        />
                                    </li>
                                ))}
                            </ul>

                            <div
                                ref={sentinelRef}
                                className="flex min-h-16 items-center justify-center pt-10"
                            >
                                {isLoadingMore && (
                                    <Loader2
                                        className="h-6 w-6 animate-spin text-[var(--cinema-ink-faint)]"
                                        aria-label="Memuat hasil berikutnya"
                                    />
                                )}

                                {loadError && (
                                    <div className="text-center">
                                        <p className="text-sm text-[var(--cinema-ink-soft)]">
                                            {loadError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadMore()}
                                            className="cinema-focus mt-3 min-h-11 rounded bg-[var(--cinema-raised)] px-5 text-sm font-semibold transition hover:bg-[var(--cinema-overlay)]"
                                        >
                                            Coba lagi
                                        </button>
                                    </div>
                                )}

                                {!isLoadingMore &&
                                    !loadError &&
                                    page >= totalPages && (
                                        <p className="text-[13px] text-[var(--cinema-ink-faint)]">
                                            Sudah sampai akhir hasil.
                                        </p>
                                    )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {selectedMovie && (
                <MovieModal
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedMovie(null);
                        }
                    }}
                    movie={selectedMovie}
                />
            )}
        </div>
    );
}

function EmptyPanel({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mx-auto max-w-lg rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-8 py-14 text-center">
            <p className="font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--cinema-ink-soft)]">
                {description}
            </p>
        </div>
    );
}
