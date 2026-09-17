import { router } from '@inertiajs/react';
import { Loader2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import type { ApiEnvelope, CatalogEntry } from '@/types/playback';

/**
 * Baris judul yang berkasnya benar-benar ada dan siap diputar sekarang.
 *
 * Dipisahkan dari MovieRow karena isinya bukan metadata TMDB melainkan katalog
 * pemutaran kita sendiri, dan karena perbedaannya penting bagi pemirsa: menekan
 * kartu di sini langsung memutar, sedangkan baris TMDB di bawahnya hanya
 * membuka halaman rincian.
 */
export default function PlayableRow() {
    const [state, setState] = useState<{
        status: 'loading' | 'ready' | 'error';
        items: CatalogEntry[];
        message: string | null;
    }>({ status: 'loading', items: [], message: null });

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/catalog/open-movies', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body = (await response.json()) as ApiEnvelope<
                    CatalogEntry[]
                >;

                if (!response.ok || !body.success) {
                    throw new Error(body.message ?? 'Katalog gagal dimuat.');
                }

                setState({
                    status: 'ready',
                    items: body.data ?? [],
                    message: null,
                });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setState({
                    status: 'error',
                    items: [],
                    message:
                        cause instanceof Error
                            ? cause.message
                            : 'Katalog gagal dimuat.',
                });
            });

        return () => controller.abort();
    }, []);

    if (state.status === 'error') {
        return (
            <RowShell>
                <p className="px-4 text-sm text-[var(--cinema-ink-faint)] md:px-12 lg:px-16">
                    {state.message}
                </p>
            </RowShell>
        );
    }

    if (state.status === 'loading') {
        return (
            <RowShell>
                <div className="flex items-center gap-2 px-4 text-sm text-[var(--cinema-ink-faint)] md:px-12 lg:px-16">
                    <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                    />
                    Memuat katalog...
                </div>
            </RowShell>
        );
    }

    if (state.items.length === 0) {
        return (
            <RowShell>
                <p className="px-4 text-sm text-[var(--cinema-ink-faint)] md:px-12 lg:px-16">
                    Belum ada judul yang siap diputar. Tambah judul di
                    config/open-movies.php.
                </p>
            </RowShell>
        );
    }

    return (
        <RowShell>
            <ul className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-1 md:px-12 lg:px-16">
                {state.items.map((item) => (
                    <li
                        key={`${item.provider}-${item.reference}`}
                        className="w-[248px] flex-none sm:w-[288px]"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                router.visit(
                                    `/tonton?provider=${encodeURIComponent(item.provider)}&reference=${encodeURIComponent(item.reference)}`,
                                )
                            }
                            aria-label={`Putar ${item.title}`}
                            className="cinema-focus group/play block w-full text-left"
                        >
                            <div
                                className="relative aspect-video overflow-hidden bg-[var(--cinema-raised)] ring-1 ring-[var(--cinema-accent)]/25 transition duration-300 group-hover/play:scale-[1.03] group-hover/play:ring-[var(--cinema-accent)]/60"
                                style={{
                                    borderRadius: 'var(--cinema-radius-card)',
                                }}
                            >
                                {item.poster && (
                                    <img
                                        src={item.poster}
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                )}

                                <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover/play:opacity-100">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cinema-accent)]">
                                        <Play
                                            className="ml-0.5 h-5 w-5 text-[var(--cinema-accent-ink)]"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </span>
                            </div>

                            <p className="mt-2 truncate text-sm font-semibold text-[var(--cinema-ink)]">
                                {item.title}
                            </p>
                            <p className="truncate text-[11px] text-[var(--cinema-ink-faint)]">
                                {[item.year, item.license]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </RowShell>
    );
}

function RowShell({ children }: { children: React.ReactNode }) {
    return (
        <section aria-labelledby="row-siap-ditonton" className={cn('relative')}>
            <header className="px-4 md:px-12 lg:px-16">
                <h2
                    id="row-siap-ditonton"
                    className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[var(--cinema-ink)] md:text-lg"
                >
                    Siap ditonton
                    <span className="rounded-full bg-[var(--cinema-accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--cinema-accent)]">
                        Berkasnya ada
                    </span>
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--cinema-ink-faint)]">
                    Lisensi terbuka, berkas tersedia, langsung diputar tanpa
                    mencari sumber.
                </p>
            </header>

            <div className="mt-2.5">{children}</div>
        </section>
    );
}
