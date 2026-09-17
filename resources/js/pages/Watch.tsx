import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    LayoutGrid,
    Loader2,
    Play,
    SkipForward,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { saveContinueWatching } from '@/lib/continue-watching';
import { cn } from '@/lib/utils';
import type { TmdbDetails, TmdbEpisode, TmdbSeasonDetails } from '@/types/tmdb';

interface WatchProps {
    type: 'movie' | 'tv';
    id: string;
    season?: string;
    episode?: string;
    title?: string;
    poster_path?: string;
    backdrop_path?: string;
}

interface ServerProvider {
    id: string;
    name: string;
    shortName: string;
    subIndoReady: boolean;
    getUrl: (params: {
        id: string;
        type: 'movie' | 'tv';
        season: string;
        episode: string;
        subUrl?: string | null;
    }) => string;
}

const SERVERS: ServerProvider[] = [
    {
        id: 'vidlink',
        name: 'Server 1 (VidLink)',
        shortName: 'VidLink',
        subIndoReady: true,
        getUrl: ({ id, type, season, episode, subUrl }) => {
            const base = 'https://vidlink.pro';
            const query = [
                'primaryColor=e50914',
                'secondaryColor=ffffff',
                'iconColor=e50914',
                'icons=default',
                'player=default',
                'title=true',
                'poster=true',
                'autoplay=true',
                'nextbutton=true',
            ];
            if (subUrl) {
                query.push(`sub_file=${encodeURIComponent(subUrl)}`);
                query.push('sub_label=Indonesian');
            }
            const qs = query.join('&');
            return type === 'tv'
                ? `${base}/tv/${id}/${season}/${episode}?${qs}`
                : `${base}/movie/${id}?${qs}`;
        },
    },
    {
        id: 'vidnest',
        name: 'Server 2 (VidNest)',
        shortName: 'VidNest',
        subIndoReady: true,
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
                : `https://vidnest.fun/movie/${id}`,
    },
    {
        id: 'vidsrc_ru',
        name: 'Server 3 (VidSrc RU)',
        shortName: 'VidSrc RU',
        subIndoReady: true,
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidsrcme.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
                : `https://vidsrcme.ru/embed/movie?tmdb=${id}`,
    },
    {
        id: 'vidsrc_to',
        name: 'Server 4 (VidSrc TO)',
        shortName: 'VidSrc TO',
        subIndoReady: true,
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
                : `https://vidsrc.to/embed/movie/${id}`,
    },
    {
        id: '2embed',
        name: 'Server 5 (2Embed)',
        shortName: '2Embed',
        subIndoReady: true,
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
                : `https://www.2embed.cc/embed/${id}`,
    },
];

export default function Watch({
    type,
    id,
    season: initialSeason = '1',
    episode: initialEpisode = '1',
    title: propTitle,
    poster_path: propPoster,
    backdrop_path: propBackdrop,
}: WatchProps) {
    const [currentSeason, setCurrentSeason] = useState(initialSeason);
    const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
    const [activeServerId, setActiveServerId] = useState<string>('vidlink');
    const [indoSubUrl, setIndoSubUrl] = useState<string | null>(null);

    // Simpan rute asal sebelum masuk ke halaman tonton agar tombol kembali tidak terjebak di riwayat iframe
    const [returnUrl] = useState<string>(() => {
        if (typeof window === 'undefined') return '/';
        const stored = sessionStorage.getItem('last_app_url');
        if (stored && !stored.startsWith('/watch')) {
            return stored;
        }
        const ref = document.referrer;
        if (ref) {
            try {
                const parsed = new URL(ref);
                if (
                    parsed.origin === window.location.origin &&
                    !parsed.pathname.startsWith('/watch')
                ) {
                    return parsed.pathname + parsed.search;
                }
            } catch {
                // Abaikan kesalahan parsing URL
            }
        }
        return '/';
    });

    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [seasonDetails, setSeasonDetails] =
        useState<TmdbSeasonDetails | null>(null);
    const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
    const [showUi, setShowUi] = useState(true);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ambil data detail TMDB
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        fetch(`/api/tmdb/${type}/${id}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data: TmdbDetails) => {
                setDetails(data);
            })
            .catch(() => {
                // TMDB detail error handled gracefully
            });

        return () => controller.abort();
    }, [id, type]);

    // Ambil detail musim jika tipe serial TV
    useEffect(() => {
        if (type !== 'tv' || !id) return;
        const controller = new AbortController();

        fetch(`/api/tmdb/tv/${id}/season/${currentSeason}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data: TmdbSeasonDetails) => {
                setSeasonDetails(data);
            })
            .catch(() => {
                setSeasonDetails(null);
            });

        return () => controller.abort();
    }, [id, type, currentSeason]);

    // Cari data episode saat ini
    const currentEpisodeData = useMemo(() => {
        if (!seasonDetails?.episodes) return null;
        return (
            seasonDetails.episodes.find(
                (ep) => String(ep.episode_number) === String(currentEpisode),
            ) ?? null
        );
    }, [seasonDetails, currentEpisode]);

    // Rekam progres menonton ke local storage
    useEffect(() => {
        if (!id) return;

        const resolvedTitle = details?.title ?? details?.name ?? propTitle;
        if (!resolvedTitle || resolvedTitle === 'Untitled') return;

        const resolvedPoster = details?.poster_path ?? propPoster ?? null;
        const resolvedBackdrop = details?.backdrop_path ?? propBackdrop ?? null;

        saveContinueWatching({
            id: String(id),
            type,
            title: resolvedTitle,
            poster_path: resolvedPoster,
            backdrop_path: resolvedBackdrop,
            season: type === 'tv' ? currentSeason : undefined,
            episode: type === 'tv' ? currentEpisode : undefined,
            episodeTitle: currentEpisodeData?.name,
            progress: 30,
        });
    }, [
        id,
        type,
        details,
        currentSeason,
        currentEpisode,
        currentEpisodeData,
        propTitle,
        propPoster,
        propBackdrop,
    ]);

    // Timer auto-hide untuk header dan kontrol saat kursor tidak bergerak
    const resetHideTimer = useCallback(() => {
        setShowUi(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            if (!isEpisodeDrawerOpen) {
                setShowUi(false);
            }
        }, 3500);
    }, [isEpisodeDrawerOpen]);

    useEffect(() => {
        const handleActivity = () => resetHideTimer();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        // Pasang timer awal saat komponen pertama kali terpasang
        const initialTimer = setTimeout(() => {
            setShowUi(false);
        }, 3500);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            clearTimeout(initialTimer);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [resetHideTimer]);

    // Tombol kembali langsung mengarahkan ke halaman sebelumnya di aplikasi (bukan riwayat internal iframe)
    const handleBack = () => {
        if (returnUrl && returnUrl.startsWith('/')) {
            router.visit(returnUrl);
        } else {
            router.visit('/');
        }
    };

    // Navigasi ke episode tertentu
    const selectEpisode = (
        seasonNum: string | number,
        epNum: string | number,
    ) => {
        const sStr = String(seasonNum);
        const eStr = String(epNum);
        setCurrentSeason(sStr);
        setCurrentEpisode(eStr);
        setIsEpisodeDrawerOpen(false);

        const newUrl = `/watch/tv/${id}?season=${sStr}&episode=${eStr}`;
        window.history.replaceState({}, '', newUrl);
    };

    // Cek episode berikutnya
    const nextEpisode = useMemo<TmdbEpisode | null>(() => {
        if (type !== 'tv' || !seasonDetails?.episodes) return null;
        const nextNum = Number(currentEpisode) + 1;
        return (
            seasonDetails.episodes.find(
                (ep) => ep.episode_number === nextNum,
            ) ?? null
        );
    }, [type, seasonDetails, currentEpisode]);

    const handleNextEpisode = () => {
        if (nextEpisode) {
            selectEpisode(currentSeason, nextEpisode.episode_number);
        }
    };

    // Keyboard navigation (ESC tutup drawer)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isEpisodeDrawerOpen) {
                setIsEpisodeDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEpisodeDrawerOpen]);

    // Ambil takarir bahasa Indonesia dari backend jika ada
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        const params = new URLSearchParams({
            tmdb_id: id,
            type,
            ...(type === 'tv'
                ? { season: currentSeason, episode: currentEpisode }
                : {}),
        });

        fetch(`/api/subtitles/search?${params.toString()}`, {
            signal: controller.signal,
        })
            .then((res) => res.json())
            .then((json) => {
                if (
                    json.success &&
                    Array.isArray(json.data) &&
                    json.data.length > 0
                ) {
                    const idTrack =
                        json.data.find(
                            (t: { language: string }) =>
                                t.language === 'id' || t.language === 'ind',
                        ) ?? json.data[0];
                    if (idTrack) {
                        const vttUrl = `${window.location.origin}/api/subtitles/stream?track_id=${encodeURIComponent(idTrack.id)}`;
                        setIndoSubUrl(vttUrl);
                    }
                }
            })
            .catch(() => {
                // Gunakan subtitle bawaan server jika pencarian takarir gagal
            });

        return () => controller.abort();
    }, [id, type, currentSeason, currentEpisode]);

    const title =
        propTitle ??
        details?.title ??
        details?.name ??
        (type === 'tv' ? 'Serial TV' : 'Film');

    const activeServer = useMemo(() => {
        return SERVERS.find((s) => s.id === activeServerId) ?? SERVERS[0];
    }, [activeServerId]);

    const embedUrl = useMemo(() => {
        return activeServer.getUrl({
            id,
            type,
            season: currentSeason,
            episode: currentEpisode,
            subUrl: indoSubUrl,
        });
    }, [activeServer, id, type, currentSeason, currentEpisode, indoSubUrl]);

    const seasonList = useMemo(() => {
        if (!details?.seasons) return [];
        return details.seasons.filter((s) => s.season_number > 0);
    }, [details]);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black font-sans select-none">
            <Head
                title={
                    type === 'tv'
                        ? `Menonton ${title} - M${currentSeason} E${currentEpisode}`
                        : `Menonton ${title}`
                }
            />

            {/* Header Mengambang Netflix (Otomatis Sembunyi) */}
            <header
                className={cn(
                    'pointer-events-auto fixed top-0 right-0 left-0 z-40 flex flex-col gap-3 bg-gradient-to-b from-black/95 via-black/75 to-transparent px-4 py-4 transition-opacity duration-300 md:px-8 md:py-6',
                    showUi || isEpisodeDrawerOpen
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            aria-label="Kembali"
                            className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-white/20 active:scale-95"
                        >
                            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#E50914] text-[10px] font-black text-white">
                                    N
                                </span>
                                <h1 className="line-clamp-1 text-base font-bold text-white drop-shadow md:text-lg">
                                    {title}
                                </h1>
                            </div>

                            {type === 'tv' && (
                                <p className="text-xs text-zinc-300 drop-shadow md:text-sm">
                                    Musim {currentSeason} : Episode{' '}
                                    {currentEpisode}
                                    {currentEpisodeData?.name
                                        ? ` - ${currentEpisodeData.name}`
                                        : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tombol Episode Berikutnya untuk TV */}
                        {type === 'tv' && nextEpisode && (
                            <button
                                type="button"
                                onClick={handleNextEpisode}
                                aria-label={`Putar Episode Berikutnya: Episode ${nextEpisode.episode_number}`}
                                className="cinema-focus flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 md:text-sm"
                            >
                                <SkipForward
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                <span className="hidden sm:inline">
                                    Episode Berikutnya
                                </span>
                            </button>
                        )}

                        {/* Tombol Buka Panel Episode untuk TV */}
                        {type === 'tv' && (
                            <button
                                type="button"
                                onClick={() => setIsEpisodeDrawerOpen(true)}
                                aria-label="Buka Daftar Episode"
                                className="cinema-focus flex min-h-11 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 md:text-sm"
                            >
                                <LayoutGrid
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                <span>Episode</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bar Pemilihan Server (Sesuai Tampilan Pengguna) */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {SERVERS.map((server) => {
                            const isActive = server.id === activeServerId;
                            return (
                                <button
                                    key={server.id}
                                    type="button"
                                    onClick={() => setActiveServerId(server.id)}
                                    className={cn(
                                        'cinema-focus flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition md:text-sm',
                                        isActive
                                            ? 'bg-[#E50914] text-white shadow-lg ring-2 ring-red-500/50'
                                            : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white',
                                    )}
                                >
                                    <span>{server.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span className="font-semibold text-emerald-400">
                            Sub Indo Tersedia
                        </span>
                        <span className="hidden text-[11px] text-zinc-400 sm:inline">
                            (Bisa dipilih di ikon CC / Subtitle pemutar)
                        </span>
                    </div>
                </div>
            </header>

            {/* Iframe Pemutar VidLink / Server Terpilih */}
            <iframe
                key={`${activeServerId}-${currentSeason}-${currentEpisode}`}
                src={embedUrl}
                title={`Pemutar ${title}`}
                className="h-full w-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
            />

            {/* Drawer Episode Netflix (Slide-Over) */}
            {type === 'tv' && (
                <>
                    {/* Backdrop Overlay */}
                    <div
                        className={cn(
                            'fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity duration-300',
                            isEpisodeDrawerOpen
                                ? 'pointer-events-auto opacity-100'
                                : 'pointer-events-none opacity-0',
                        )}
                        onClick={() => setIsEpisodeDrawerOpen(false)}
                    />

                    {/* Panel Samping */}
                    <aside
                        className={cn(
                            'fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-[#141414] shadow-2xl transition-transform duration-300 ease-in-out',
                            isEpisodeDrawerOpen
                                ? 'translate-x-0'
                                : 'translate-x-full',
                        )}
                    >
                        {/* Header Drawer */}
                        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Daftar Episode
                                </h2>
                                <p className="line-clamp-1 text-xs text-zinc-400">
                                    {title}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsEpisodeDrawerOpen(false)}
                                aria-label="Tutup panel episode"
                                className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Pemilih Musim */}
                        {seasonList.length > 1 && (
                            <div className="border-b border-zinc-800 px-5 py-3">
                                <label
                                    htmlFor="season-select"
                                    className="sr-only"
                                >
                                    Pilih Musim
                                </label>
                                <select
                                    id="season-select"
                                    value={currentSeason}
                                    onChange={(e) => {
                                        setCurrentSeason(e.target.value);
                                        // Reset ke episode 1 pada pergantian musim
                                        selectEpisode(e.target.value, 1);
                                    }}
                                    className="cinema-focus w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:border-zinc-500"
                                >
                                    {seasonList.map((s) => (
                                        <option
                                            key={s.season_number}
                                            value={s.season_number}
                                        >
                                            {s.name ||
                                                `Musim ${s.season_number}`}{' '}
                                            ({s.episode_count} Episode)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Daftar Episode */}
                        <div className="flex-1 space-y-3 overflow-y-auto p-4">
                            {!seasonDetails ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-400">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
                                    <span className="text-xs">
                                        Memuat episode...
                                    </span>
                                </div>
                            ) : seasonDetails.episodes &&
                              seasonDetails.episodes.length > 0 ? (
                                seasonDetails.episodes.map((ep) => {
                                    const isCurrent =
                                        String(ep.episode_number) ===
                                        String(currentEpisode);
                                    const stillUrl = ep.still_path
                                        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                        : '/placeholder.jpg';

                                    return (
                                        <div
                                            key={ep.id}
                                            onClick={() =>
                                                selectEpisode(
                                                    currentSeason,
                                                    ep.episode_number,
                                                )
                                            }
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault();
                                                    selectEpisode(
                                                        currentSeason,
                                                        ep.episode_number,
                                                    );
                                                }
                                            }}
                                            className={cn(
                                                'cinema-focus group relative flex cursor-pointer gap-3 rounded-lg border p-2 transition',
                                                isCurrent
                                                    ? 'border-[#E50914] bg-zinc-900'
                                                    : 'border-transparent bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
                                            )}
                                        >
                                            {/* Thumbnail Still */}
                                            <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded bg-black">
                                                <img
                                                    src={stillUrl}
                                                    alt={`Cuplikan episode ${ep.episode_number}`}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                                    <Play className="h-5 w-5 fill-white text-white" />
                                                </div>
                                                {isCurrent && (
                                                    <div className="absolute bottom-1 left-1 rounded bg-[#E50914] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                        DIPUTAR
                                                    </div>
                                                )}
                                            </div>

                                            {/* Informasi Episode */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p
                                                        className={cn(
                                                            'truncate text-xs font-bold md:text-sm',
                                                            isCurrent
                                                                ? 'text-[#E50914]'
                                                                : 'text-white',
                                                        )}
                                                    >
                                                        {ep.episode_number}.{' '}
                                                        {ep.name}
                                                    </p>
                                                    {ep.runtime ? (
                                                        <span className="shrink-0 text-[11px] text-zinc-400">
                                                            {ep.runtime}m
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                                                    {ep.overview ||
                                                        'Sinopsis episode belum tersedia.'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-xs text-zinc-400">
                                    Daftar episode tidak ditemukan.
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}
