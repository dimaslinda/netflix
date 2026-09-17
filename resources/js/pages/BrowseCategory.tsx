import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

import MovieCard from '@/components/netflix/MovieCard';
import MovieModal from '@/components/netflix/MovieModal';
import Navbar from '@/components/netflix/Navbar';
import { Movie, TmdbResponse } from '@/types/tmdb';

interface BrowseCategoryProps {
    category: string;
    title: string;
    page: number;
    results: TmdbResponse;
}

/**
 * Kisi hasil untuk satu kategori.
 *
 * Tanpa panel pembuka: halaman ini dibuka pemirsa yang sudah tahu apa yang
 * dicari, jadi yang berharga adalah kepadatan hasil, bukan satu judul besar.
 * Itu juga yang membedakan irama halaman ini dari beranda.
 */
export default function BrowseCategory({
    category,
    title,
    page,
    results,
}: BrowseCategoryProps) {
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    const items = results.results ?? [];
    const totalPages = results.total_pages ?? 1;
    const hasNextPage = page < totalPages;

    const goToPage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
            return;
        }

        router.visit(`/browse/${category}?page=${nextPage}`);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--cinema-base)] text-[var(--cinema-ink)]">
            <Head title={title} />
            <Navbar activePath={`/browse/${category}`} />

            <main className="px-4 pt-24 pb-20 md:px-12 lg:px-16">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {title}
                    </h1>
                    {items.length > 0 && (
                        <p className="mt-1.5 text-[13px] text-[var(--cinema-ink-faint)]">
                            Halaman {page} dari{' '}
                            {totalPages.toLocaleString('id-ID')}
                        </p>
                    )}
                </header>

                {items.length === 0 ? (
                    <div className="mx-auto max-w-lg rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-8 py-14 text-center">
                        <p className="font-semibold">
                            Tidak ada judul di halaman ini
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--cinema-ink-soft)]">
                            Kategori ini kosong, atau nomor halamannya melewati
                            akhir daftar.
                        </p>
                        <button
                            type="button"
                            onClick={() => goToPage(1)}
                            className="cinema-focus mt-6 inline-flex min-h-11 items-center rounded bg-[var(--cinema-accent)] px-5 text-sm font-bold text-[var(--cinema-accent-ink)] transition hover:brightness-110"
                        >
                            Kembali ke halaman pertama
                        </button>
                    </div>
                ) : (
                    <>
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                            {items.map((movie) => (
                                <li key={movie.id}>
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

                        <nav
                            aria-label="Navigasi halaman"
                            className="mt-12 flex items-center justify-center gap-3"
                        >
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => goToPage(page - 1)}
                                className="cinema-focus min-h-11 rounded bg-[var(--cinema-raised)] px-5 text-sm font-semibold transition hover:bg-[var(--cinema-overlay)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>
                            <button
                                type="button"
                                disabled={!hasNextPage}
                                onClick={() => goToPage(page + 1)}
                                className="cinema-focus min-h-11 rounded bg-[var(--cinema-raised)] px-5 text-sm font-semibold transition hover:bg-[var(--cinema-overlay)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Berikutnya
                            </button>
                        </nav>
                    </>
                )}
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
