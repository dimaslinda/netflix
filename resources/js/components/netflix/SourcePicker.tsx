import { Film, FolderOpen, Library, Loader2, Play, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import type { ApiEnvelope, CatalogEntry, LibraryEntry } from '@/types/playback';

interface SourcePickerProps {
    /** Dipanggil saat pengguna memilih satu judul untuk diputar. */
    onSelect: (provider: string, reference: string) => void;
    /**
     * Judul TMDB yang sedang dicarikan berkas.
     *
     * Bila diisi, pemilih langsung membuka tab Internet Archive dan menelusuri
     * judul itu. Tanpa ini, pemirsa yang menekan Putar pada judul TMDB melihat
     * katalog film terbuka yang sama sekali tidak berhubungan, dan wajar
     * menyimpulkan aplikasinya rusak.
     */
    searchTitle?: string | null;
}

type TabKey = 'open' | 'archive' | 'library';

const TABS: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    note: string;
}[] = [
    {
        key: 'open',
        label: 'Film Terbuka',
        icon: <Film className="h-4 w-4" aria-hidden="true" />,
        note: 'Berlisensi Creative Commons. Boleh diputar, digandakan, dan disajikan ulang secara sah.',
    },
    {
        key: 'archive',
        label: 'Internet Archive',
        icon: <Library className="h-4 w-4" aria-hidden="true" />,
        note: 'Koleksi film yang boleh diunduh bebas. Katalognya lama, jadi rilisan baru memang tidak ada di sini.',
    },
    {
        key: 'library',
        label: 'Berkas Sendiri',
        icon: <FolderOpen className="h-4 w-4" aria-hidden="true" />,
        note: 'Berkas video di storage/app/media, atau folder lain lewat MEDIA_LIBRARY_PATH.',
    },
];

/**
 * Pemilih asal tontonan.
 *
 * Halaman ini memakai gulir dokumen biasa, bukan wadah bergulir sendiri. Gulir
 * bersarang memunculkan batang gulir kedua di tengah halaman dan membuat roda
 * tetikus berhenti di tempat yang tidak diduga.
 */
export default function SourcePicker({
    onSelect,
    searchTitle,
}: SourcePickerProps) {
    // Tab diturunkan, bukan disimpan dari nilai awal prop. Judul TMDB baru tiba
    // setelah render pertama, dan useState mengabaikan perubahan prop sesudah
    // itu, sehingga versi sebelumnya berhenti di tab Film Terbuka dan tidak
    // pernah menelusuri judul yang diminta pemirsa.
    const [chosenTab, setChosenTab] = useState<TabKey | null>(null);
    const tab = chosenTab ?? (searchTitle ? 'archive' : 'open');
    const setTab = setChosenTab;
    const active = TABS.find((entry) => entry.key === tab) ?? TABS[0];

    return (
        <div className="px-4 pt-8 pb-24 md:px-12 lg:px-16">
            <header className="max-w-2xl">
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    {searchTitle ? 'Cari sumber' : 'Pilih tontonan'}
                </h1>

                {searchTitle ? (
                    <div className="mt-3 space-y-3">
                        <p className="text-[15px] leading-relaxed text-[var(--cinema-ink-soft)]">
                            Anda memilih{' '}
                            <span className="font-semibold text-[var(--cinema-ink)]">
                                {searchTitle}
                            </span>
                            . Aplikasi ini menyimpan metadata judul, bukan
                            berkasnya, jadi berkasnya harus dicari lebih dulu.
                        </p>

                        {/*
                            Peringatan ini muncul sebelum hasil apa pun, karena
                            untuk sebagian besar judul TMDB jawabannya memang
                            nihil, dan pemirsa berhak tahu itu sebelum mencari.
                        */}
                        <p className="rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-4 py-3 text-[13px] leading-relaxed text-[var(--cinema-ink-soft)]">
                            Rilisan bioskop dan serial layanan siaran terkunci
                            DRM, jadi berkasnya tidak ada di sini dan tidak akan
                            ada. Yang bisa ditemukan hanya film domain publik,
                            film berlisensi terbuka, dan berkas milik Anda
                            sendiri.
                        </p>
                    </div>
                ) : (
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--cinema-ink-soft)]">
                        Berkas diputar langsung oleh pemutar kita. Tidak ada
                        iframe pihak ketiga, jadi tidak ada iklan atau popup
                        yang bisa masuk.
                    </p>
                )}
            </header>

            {/* Tiga asal ini setara, bukan bertingkat, jadi bentuknya satu
                kelompok tombol sejajar dan bukan menu turun. */}
            <div
                role="tablist"
                aria-label="Asal tontonan"
                className="mt-8 inline-flex flex-wrap gap-1 rounded-[var(--cinema-radius-panel)] bg-[var(--cinema-raised)] p-1"
            >
                {TABS.map((entry) => (
                    <button
                        key={entry.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === entry.key}
                        onClick={() => setTab(entry.key)}
                        className={cn(
                            'cinema-focus flex min-h-11 items-center gap-2 rounded px-4 text-sm font-semibold transition',
                            tab === entry.key
                                ? 'bg-[var(--cinema-ink)] text-[var(--cinema-base)]'
                                : 'text-[var(--cinema-ink-soft)] hover:bg-white/5 hover:text-[var(--cinema-ink)]',
                        )}
                    >
                        {entry.icon}
                        {entry.label}
                    </button>
                ))}
            </div>

            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[var(--cinema-ink-faint)]">
                {active.note}
            </p>

            <div className="mt-8">
                {tab === 'open' && <OpenMoviesTab onSelect={onSelect} />}
                {tab === 'archive' && (
                    <ArchiveTab
                        onSelect={onSelect}
                        initialQuery={searchTitle ?? ''}
                    />
                )}
                {tab === 'library' && <LibraryTab onSelect={onSelect} />}
            </div>
        </div>
    );
}

function OpenMoviesTab({
    onSelect,
}: {
    onSelect: (provider: string, reference: string) => void;
}) {
    const [state, setState] = useState<{
        loaded: boolean;
        items: CatalogEntry[];
        error: string | null;
    }>({ loaded: false, items: [], error: null });

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

                setState({ loaded: true, items: body.data ?? [], error: null });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setState({
                    loaded: true,
                    items: [],
                    error:
                        cause instanceof Error
                            ? cause.message
                            : 'Katalog gagal dimuat.',
                });
            });

        return () => controller.abort();
    }, []);

    if (!state.loaded) {
        return <LoadingGrid label="Memuat katalog film terbuka" />;
    }

    if (state.error) {
        return (
            <EmptyState
                title="Katalog tidak terbaca"
                description={state.error}
            />
        );
    }

    if (state.items.length === 0) {
        return (
            <EmptyState
                title="Katalog kosong"
                description="Belum ada judul yang bisa diputar. Tambah identifier Internet Archive di config/open-movies.php."
            />
        );
    }

    return <TitleGrid items={state.items} onSelect={onSelect} showLicense />;
}

function ArchiveTab({
    onSelect,
    initialQuery = '',
}: {
    onSelect: (provider: string, reference: string) => void;
    initialQuery?: string;
}) {
    // Sama seperti tab di atas: judul yang dicarikan sumber tiba setelah render
    // pertama, jadi kueri diturunkan dari prop sampai pemirsa mengetik sendiri.
    const [typedOverride, setTypedOverride] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const typed = typedOverride ?? initialQuery;
    const query = submitted ?? initialQuery;

    const setTyped = setTypedOverride;

    // Hasil disimpan bersama kunci permintaannya. Status memuat cukup diturunkan
    // dari perbandingan kunci, jadi tidak perlu menyetel state di dalam efek,
    // dan respons yang datang terlambat tidak bisa menimpa pencarian yang baru.
    const [loaded, setLoaded] = useState<{
        key: string | null;
        items: CatalogEntry[];
        total: number;
        error: string | null;
    }>({ key: null, items: [], total: 0, error: null });

    const key = `${query}|${page}`;

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ page: String(page), rows: '24' });

        if (query) {
            params.append('q', query);
        }

        fetch(`/api/catalog/archive?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body = (await response.json()) as ApiEnvelope<
                    CatalogEntry[]
                > & { meta?: { total?: number } };

                if (!response.ok || !body.success) {
                    throw new Error('Internet Archive tidak merespons.');
                }

                setLoaded({
                    key,
                    items: body.data ?? [],
                    total: body.meta?.total ?? 0,
                    error: null,
                });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setLoaded({
                    key,
                    items: [],
                    total: 0,
                    error:
                        cause instanceof Error
                            ? cause.message
                            : 'Internet Archive tidak merespons.',
                });
            });

        return () => controller.abort();
    }, [key, query, page]);

    const isLoading = loaded.key !== key;

    return (
        <div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitted(typed.trim());
                    setPage(1);
                }}
                className="flex max-w-2xl gap-2"
            >
                <div className="relative flex-1">
                    <Search
                        className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--cinema-ink-faint)]"
                        aria-hidden="true"
                    />
                    <label htmlFor="archive-search" className="sr-only">
                        Cari judul di koleksi Internet Archive
                    </label>
                    <input
                        id="archive-search"
                        type="search"
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        placeholder="Cari judul, misalnya Nosferatu"
                        className="cinema-focus h-12 w-full rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] pr-4 pl-11 text-sm text-[var(--cinema-ink)] placeholder:text-[var(--cinema-ink-faint)]"
                    />
                </div>
                <button
                    type="submit"
                    className="cinema-focus min-h-12 rounded-[var(--cinema-radius-panel)] bg-[var(--cinema-ink)] px-6 text-sm font-bold text-[var(--cinema-base)] transition hover:bg-white"
                >
                    Cari
                </button>
            </form>

            <div className="mt-8">
                {isLoading ? (
                    <LoadingGrid label="Mencari di Internet Archive" />
                ) : loaded.error ? (
                    <EmptyState
                        title="Gagal memuat"
                        description={loaded.error}
                    />
                ) : loaded.items.length === 0 ? (
                    <EmptyState
                        title={
                            query
                                ? `Tidak ada berkas untuk "${query}"`
                                : 'Tidak ada hasil'
                        }
                        description="Judul ini tidak ada di koleksi film bebas unduh Internet Archive. Kalau ini rilisan bioskop atau serial layanan siaran, memang tidak akan ketemu: berkasnya terkunci DRM dan tidak pernah dibagikan bebas. Coba judul lama, atau buka tab Film Terbuka untuk katalog yang siap diputar."
                    />
                ) : (
                    <>
                        <p className="mb-5 text-[13px] text-[var(--cinema-ink-faint)]">
                            {loaded.total.toLocaleString('id-ID')} judul cocok,
                            halaman {page}
                        </p>

                        <TitleGrid items={loaded.items} onSelect={onSelect} />

                        <nav
                            aria-label="Navigasi halaman"
                            className="mt-10 flex items-center justify-center gap-3"
                        >
                            <button
                                type="button"
                                disabled={page === 1}
                                onClick={() =>
                                    setPage((value) => Math.max(1, value - 1))
                                }
                                className="cinema-focus min-h-11 rounded bg-[var(--cinema-raised)] px-5 text-sm font-semibold transition hover:bg-[var(--cinema-overlay)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((value) => value + 1)}
                                className="cinema-focus min-h-11 rounded bg-[var(--cinema-raised)] px-5 text-sm font-semibold transition hover:bg-[var(--cinema-overlay)]"
                            >
                                Berikutnya
                            </button>
                        </nav>
                    </>
                )}
            </div>
        </div>
    );
}

function LibraryTab({
    onSelect,
}: {
    onSelect: (provider: string, reference: string) => void;
}) {
    const [state, setState] = useState<{
        loaded: boolean;
        entries: LibraryEntry[];
        error: string | null;
    }>({ loaded: false, entries: [], error: null });

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/library', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body = (await response.json()) as ApiEnvelope<
                    LibraryEntry[]
                >;

                if (!response.ok || !body.success) {
                    throw new Error(body.message ?? 'Pustaka gagal dibaca.');
                }

                setState({
                    loaded: true,
                    entries: body.data ?? [],
                    error: null,
                });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setState({
                    loaded: true,
                    entries: [],
                    error:
                        cause instanceof Error
                            ? cause.message
                            : 'Pustaka gagal dibaca.',
                });
            });

        return () => controller.abort();
    }, []);

    if (!state.loaded) {
        return <LoadingGrid label="Membaca berkas lokal" />;
    }

    if (state.error) {
        return (
            <EmptyState
                title="Pustaka tidak terbaca"
                description={state.error}
            />
        );
    }

    if (state.entries.length === 0) {
        return (
            <EmptyState
                title="Belum ada berkas"
                description="Tab ini opsional. Letakkan berkas mp4, m4v, webm, atau ogv di storage/app/media bila Anda ingin memutar koleksi sendiri."
            />
        );
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {state.entries.map((entry) => (
                <li key={entry.path}>
                    <button
                        type="button"
                        onClick={() => onSelect('library', entry.path)}
                        className="cinema-focus w-full rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] p-4 text-left transition hover:border-[var(--cinema-accent)]/50 hover:bg-[var(--cinema-overlay)]"
                    >
                        <p className="truncate font-semibold">{entry.name}</p>
                        <p className="mt-1 truncate text-xs text-[var(--cinema-ink-faint)]">
                            {entry.path}
                        </p>
                        <p className="mt-2 text-xs text-[var(--cinema-ink-soft)]">
                            {formatBytes(entry.size)}
                        </p>
                    </button>
                </li>
            ))}
        </ul>
    );
}

/**
 * Kisi judul. Rasio lanskap dipakai karena seni kunci film di Archive hampir
 * selalu berupa cuplikan adegan, bukan poster tegak.
 */
function TitleGrid({
    items,
    onSelect,
    showLicense = false,
}: {
    items: CatalogEntry[];
    onSelect: (provider: string, reference: string) => void;
    showLicense?: boolean;
}) {
    return (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((item) => (
                <li key={`${item.provider}-${item.reference}`}>
                    <button
                        type="button"
                        onClick={() => onSelect(item.provider, item.reference)}
                        aria-label={`Putar ${item.title}`}
                        className="cinema-focus group block w-full text-left"
                    >
                        <span
                            className="relative block aspect-video overflow-hidden bg-[var(--cinema-raised)] transition duration-300 ease-out group-hover:scale-[1.04] group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
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

                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cinema-accent)]">
                                    <Play
                                        className="ml-0.5 h-6 w-6 text-[var(--cinema-accent-ink)]"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    />
                                </span>
                            </span>
                        </span>

                        <span className="mt-2.5 block truncate text-[14px] font-semibold text-[var(--cinema-ink)]">
                            {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--cinema-ink-faint)]">
                            {[item.year, showLicense ? item.license : null]
                                .filter(Boolean)
                                .join(' · ') || ' '}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

/** Rangka penahan selama katalog dimuat, supaya tinggi halaman tidak melompat
 *  begitu hasilnya datang. */
function LoadingGrid({ label }: { label: string }) {
    return (
        <div>
            <p className="mb-5 flex items-center gap-2 text-[13px] text-[var(--cinema-ink-faint)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {label}
            </p>
            <ul
                aria-hidden="true"
                className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
                {Array.from({ length: 8 }, (_, index) => (
                    <li key={index}>
                        <div
                            className="aspect-video animate-pulse bg-[var(--cinema-raised)]"
                            style={{
                                borderRadius: 'var(--cinema-radius-card)',
                            }}
                        />
                        <div className="mt-2.5 h-3.5 w-3/4 animate-pulse rounded bg-[var(--cinema-raised)]" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="max-w-xl rounded-[var(--cinema-radius-panel)] border border-[var(--cinema-line)] bg-[var(--cinema-raised)] px-8 py-12">
            <p className="font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--cinema-ink-soft)]">
                {description}
            </p>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );

    return `${(bytes / 1024 ** exponent).toFixed(1)} ${units[exponent]}`;
}
