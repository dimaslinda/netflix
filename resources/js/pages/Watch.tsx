import { App as CapApp } from '@capacitor/app';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    LayoutGrid,
    Loader2,
    Maximize,
    Minimize,
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
    getUrl: (params: {
        id: string;
        type: 'movie' | 'tv';
        season: string;
        episode: string;
    }) => string;
}

const SERVERS: ServerProvider[] = [
    {
        id: 'vidlink',
        name: 'Server 1 (VidLink)',
        shortName: 'VidLink',
        getUrl: ({ id, type, season, episode }) => {
            const base = 'https://vidlink.pro';
            const query = [
                'primaryColor=e50914',
                'secondaryColor=ffffff',
                'iconColor=e50914',
                'icons=default',
                'player=default',
                'title=true',
                'poster=true',
                'autoplay=false',
                'nextbutton=true',
            ].join('&');
            return type === 'tv'
                ? `${base}/tv/${id}/${season}/${episode}?${query}`
                : `${base}/movie/${id}?${query}`;
        },
    },
    {
        id: 'vidnest',
        name: 'Server 2 (VidNest)',
        shortName: 'VidNest',
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
                : `https://vidnest.fun/movie/${id}`,
    },
    {
        id: 'vidsrc_ru',
        name: 'Server 3 (VidSrc RU)',
        shortName: 'VidSrc RU',
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidsrcme.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
                : `https://vidsrcme.ru/embed/movie?tmdb=${id}`,
    },
    {
        id: 'vidsrc_to',
        name: 'Server 4 (VidSrc TO)',
        shortName: 'VidSrc TO',
        getUrl: ({ id, type, season, episode }) =>
            type === 'tv'
                ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
                : `https://vidsrc.to/embed/movie/${id}`,
    },
    {
        id: '2embed',
        name: 'Server 5 (2Embed)',
        shortName: '2Embed',
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

    // Timer auto-hide untuk header
    const resetHideTimer = useCallback(() => {
        setShowUi(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            if (!isEpisodeDrawerOpen) {
                setShowUi(false);
            }
        }, 4000);
    }, [isEpisodeDrawerOpen]);

    useEffect(() => {
        const handleActivity = () => resetHideTimer();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('touchstart', handleActivity, { passive: true });

        const initialTimer = setTimeout(() => {
            if (!isEpisodeDrawerOpen) {
                setShowUi(false);
            }
        }, 4000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            clearTimeout(initialTimer);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [resetHideTimer, isEpisodeDrawerOpen]);

    // Tombol kembali langsung mengarahkan ke halaman sebelumnya di aplikasi
    const handleBack = useCallback(() => {
        if (returnUrl && returnUrl.startsWith('/')) {
            router.visit(returnUrl);
        } else {
            router.visit('/');
        }
    }, [returnUrl]);

    // Cegah layar mati saat video sedang diputar (Screen Wake Lock)
    useEffect(() => {
        let wakeLock: { release: () => Promise<void> } | null = null;

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                try {
                    const nav = navigator as unknown as {
                        wakeLock: {
                            request: (
                                type: string,
                            ) => Promise<{ release: () => Promise<void> }>;
                        };
                    };
                    wakeLock = await nav.wakeLock.request('screen');
                } catch {
                    // Browser atau WebView belum mendukung WakeLock
                }
            }
        };

        requestWakeLock();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (wakeLock) {
                wakeLock.release().catch(() => {});
            }
        };
    }, []);

    // Tangani tombol fisik Back / gestur swipe di Android (Capacitor)
    useEffect(() => {
        let removeListener: (() => void) | null = null;
        try {
            const listenerPromise = CapApp.addListener('backButton', () => {
                handleBack();
            });
            listenerPromise
                .then((handle) => {
                    removeListener = () => handle.remove();
                })
                .catch(() => {});
        } catch {
            // Berjalan di browser reguler tanpa runtime native Capacitor
        }

        return () => {
            if (removeListener) {
                removeListener();
            }
        };
    }, [handleBack]);

    // Pelacak & pengalih mode layar penuh
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () =>
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch {
            // Fullscreen API fallback
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
        });
    }, [activeServer, id, type, currentSeason, currentEpisode]);

    const seasonList = useMemo(() => {
        if (!details?.seasons) return [];
        return details.seasons.filter((s) => s.season_number > 0);
    }, [details]);

    return (
        <div className="min-h-dvh w-full bg-[#141414] text-white flex flex-col font-sans select-none md:fixed md:inset-0 md:h-screen md:w-screen md:overflow-hidden md:bg-black">
            <Head
                title={
                    type === 'tv'
                        ? `Menonton ${title} - M${currentSeason} E${currentEpisode}`
                        : `Menonton ${title}`
                }
            />

            {/* HEADER KHUSUS MOBILE (Mode Potret di Ponsel) */}
            <header className="mobile-landscape-hidden sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-3 py-2.5 backdrop-blur-md md:hidden">
                <div className="flex min-w-0 items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Kembali"
                        className="cinema-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#E50914] text-[9px] font-black text-white">
                                N
                            </span>
                            <h1 className="truncate text-xs font-bold text-white max-w-45 xs:max-w-[240px]">
                                {title}
                            </h1>
                        </div>
                        {type === 'tv' && (
                            <p className="truncate text-[10px] text-zinc-400">
                                M{currentSeason} : E{currentEpisode}
                                {currentEpisodeData?.name ? ` - ${currentEpisodeData.name}` : ''}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    {type === 'tv' && nextEpisode && (
                        <button
                            type="button"
                            onClick={handleNextEpisode}
                            aria-label="Episode Berikutnya"
                            className="cinema-focus flex h-8 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                            <span className="hidden xs:inline">Lanjut</span>
                        </button>
                    )}
                    {type === 'tv' && (
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('mobile-episodes-section');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    setIsEpisodeDrawerOpen(true);
                                }
                            }}
                            aria-label="Ke Daftar Episode"
                            className="cinema-focus flex h-8 items-center gap-1 rounded-full bg-[#E50914] px-2.5 text-[11px] font-semibold text-white transition hover:bg-[#b80710] active:scale-95"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>Episode</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                        className="cinema-focus flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                    >
                        {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                        ) : (
                            <Maximize className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </header>

            {/* HEADER MENGAMBANG KHUSUS DESKTOP (Sinematik & Otomatis Sembunyi) */}
            <header
                className={cn(
                    'pointer-events-none fixed inset-x-0 top-0 z-40 hidden flex-col bg-linear-to-b from-black/95 via-black/75 to-transparent px-6 pt-4 pb-7 transition-opacity duration-300 md:flex md:px-8',
                    showUi || isEpisodeDrawerOpen
                        ? 'opacity-100'
                        : 'opacity-0',
                )}
            >
                {/* Baris 1: Tombol Navigasi, Judul, dan Tombol Kontrol Cepat */}
                <div className="flex items-center justify-between gap-2">
                    {/* Sisi Kiri: Tombol Kembali & Info Judul */}
                    <div className="flex min-w-0 items-center gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            aria-label="Kembali"
                            className="pointer-events-auto cinema-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md"
                        >
                            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#E50914] text-[10px] font-black text-white">
                                    N
                                </span>
                                <h1 className="truncate text-base font-bold text-white drop-shadow max-w-md">
                                    {title}
                                </h1>
                            </div>

                            {type === 'tv' && (
                                <p className="truncate text-xs text-zinc-300 drop-shadow">
                                    M{currentSeason} : E{currentEpisode}
                                    {currentEpisodeData?.name ? ` - ${currentEpisodeData.name}` : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sisi Kanan: Episode & Episode Berikutnya (TV) */}
                    <div className="flex shrink-0 items-center gap-2.5">
                        {type === 'tv' && nextEpisode && (
                            <button
                                type="button"
                                onClick={handleNextEpisode}
                                aria-label={`Putar Episode Berikutnya: Episode ${nextEpisode.episode_number}`}
                                className="pointer-events-auto cinema-focus flex h-11 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
                            >
                                <SkipForward className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Berikutnya</span>
                            </button>
                        )}

                        {type === 'tv' && (
                            <button
                                type="button"
                                onClick={() => setIsEpisodeDrawerOpen(true)}
                                aria-label="Buka Daftar Episode"
                                className="pointer-events-auto cinema-focus flex h-11 items-center gap-1.5 rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-white border border-white/15 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                            >
                                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Episode</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Baris 2: Pemilihan Server Desktop */}
                <div className="pointer-events-auto no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto border-t border-white/10 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pr-1">
                        Server:
                    </span>
                    {SERVERS.map((server) => {
                        const isActive = server.id === activeServerId;
                        return (
                            <button
                                key={server.id}
                                type="button"
                                onClick={() => setActiveServerId(server.id)}
                                className={cn(
                                    'cinema-focus flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition active:scale-95',
                                    isActive
                                        ? 'bg-[#E50914] text-white shadow-md ring-2 ring-red-500/50'
                                        : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/10 backdrop-blur-sm',
                                )}
                            >
                                <span>{server.name}</span>
                            </button>
                        );
                    })}

                    <span className="text-[11px] text-zinc-400 pl-2">
                        💡 Takarir (CC) dapat diaktifkan langsung di tombol CC pemutar video
                    </span>
                </div>
            </header>

            {/* KONTEN PEMUTAR VIDEO (16:9 di Mobile Portrait, Fullscreen di Mobile Landscape & Desktop) */}
            <div className="mobile-landscape-fullscreen relative w-full aspect-video bg-black shrink-0 md:absolute md:inset-0 md:h-full md:w-full md:aspect-auto">
                <iframe
                    key={`${activeServerId}-${currentSeason}-${currentEpisode}`}
                    src={embedUrl}
                    title={`Pemutar ${title}`}
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                />

                {/* Tombol Kembali Mengambang Khusus Mode Lanskap Layar Penuh di HP */}
                <div
                    className={cn(
                        'pointer-events-auto fixed top-3.5 left-3.5 z-60 transition-opacity duration-300 md:hidden',
                        showUi ? 'opacity-100' : 'opacity-0 pointer-events-none',
                    )}
                >
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Kembali"
                        className="cinema-focus flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white border border-white/20 shadow-xl backdrop-blur-md transition hover:bg-black active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* AREA KONTEN KHUSUS MOBILE DI BAWAH PEMUTAR (Mode Potret di HP) */}
            <div className="mobile-landscape-hidden flex-1 space-y-4 p-3.5 sm:p-5 md:hidden">
                {/* Pemilihan Server di Mobile (Scroll Horizontal Rapi) */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-wider text-[11px]">Pilih Server:</span>
                        <span className="text-[10px] text-zinc-500">Takarir ada di tombol CC player</span>
                    </div>
                    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                        {SERVERS.map((server) => {
                            const isActive = server.id === activeServerId;
                            return (
                                <button
                                    key={server.id}
                                    type="button"
                                    onClick={() => setActiveServerId(server.id)}
                                    className={cn(
                                        'cinema-focus flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95',
                                        isActive
                                            ? 'bg-[#E50914] text-white shadow-md ring-2 ring-red-500/50'
                                            : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white',
                                    )}
                                >
                                    {server.shortName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Detail Singkat Tayangan di Mobile */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 backdrop-blur-xs">
                    <h2 className="text-sm font-bold text-white">
                        {title}
                    </h2>
                    {type === 'tv' && currentEpisodeData && (
                        <p className="mt-0.5 text-xs font-medium text-[#E50914]">
                            M{currentSeason} : E{currentEpisode} - {currentEpisodeData.name}
                        </p>
                    )}
                    {details?.overview && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-300 line-clamp-3">
                            {details.overview}
                        </p>
                    )}
                </div>

                {/* Daftar Episode untuk Serial TV di Mobile */}
                {type === 'tv' && (
                    <div id="mobile-episodes-section" className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">
                                Daftar Episode
                            </h3>

                            {seasonList.length > 1 && (
                                <select
                                    value={currentSeason}
                                    onChange={(e) => {
                                        setCurrentSeason(e.target.value);
                                        selectEpisode(e.target.value, 1);
                                    }}
                                    aria-label="Pilih Musim"
                                    className="cinema-focus rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white"
                                >
                                    {seasonList.map((s) => (
                                        <option key={s.season_number} value={s.season_number}>
                                            {s.name || `Musim ${s.season_number}`} ({s.episode_count} Ep)
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* List Episode Cards */}
                        <div className="space-y-2.5">
                            {!seasonDetails ? (
                                <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                                    <span className="text-xs">Memuat episode...</span>
                                </div>
                            ) : seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
                                seasonDetails.episodes.map((ep) => {
                                    const isCurrent = String(ep.episode_number) === String(currentEpisode);
                                    const stillUrl = ep.still_path
                                        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                        : '/placeholder.jpg';

                                    return (
                                        <div
                                            key={ep.id}
                                            onClick={() => selectEpisode(currentSeason, ep.episode_number)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    selectEpisode(currentSeason, ep.episode_number);
                                                }
                                            }}
                                            className={cn(
                                                'cinema-focus group flex cursor-pointer gap-3 rounded-lg border p-2 transition',
                                                isCurrent
                                                    ? 'border-[#E50914] bg-zinc-900 shadow-sm'
                                                    : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
                                            )}
                                        >
                                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-black">
                                                <img
                                                    src={stillUrl}
                                                    alt={`Episode ${ep.episode_number}`}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                                    <Play className="h-4 w-4 fill-white text-white" />
                                                </div>
                                                {isCurrent && (
                                                    <div className="absolute bottom-1 left-1 rounded bg-[#E50914] px-1 py-0.5 text-[8px] font-bold text-white">
                                                        DIPUTAR
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p
                                                        className={cn(
                                                            'truncate text-xs font-bold',
                                                            isCurrent ? 'text-[#E50914]' : 'text-white',
                                                        )}
                                                    >
                                                        {ep.episode_number}. {ep.name}
                                                    </p>
                                                    {ep.runtime ? (
                                                        <span className="shrink-0 text-[10px] text-zinc-400">
                                                            {ep.runtime}m
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                                                    {ep.overview || 'Sinopsis episode belum tersedia.'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-xs text-zinc-400">
                                    Daftar episode tidak ditemukan.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* DRAWER EPISODE KHUSUS DESKTOP (Panel Slide-Over Kanan) */}
            {type === 'tv' && (
                <>
                    {/* Backdrop Overlay */}
                    <div
                        className={cn(
                            'fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity duration-300 md:block hidden',
                            isEpisodeDrawerOpen
                                ? 'pointer-events-auto opacity-100'
                                : 'pointer-events-none opacity-0',
                        )}
                        onClick={() => setIsEpisodeDrawerOpen(false)}
                    />

                    {/* Panel Samping Desktop */}
                    <aside
                        className={cn(
                            'fixed z-50 hidden md:flex flex-col bg-[#141414] shadow-2xl transition-all duration-300 ease-in-out',
                            'top-0 right-0 bottom-0 w-full max-w-md border-l border-zinc-800',
                            isEpisodeDrawerOpen
                                ? 'translate-x-0'
                                : 'translate-x-full',
                        )}
                    >
                        {/* Header Drawer Episode */}
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
                                    htmlFor="desktop-season-select"
                                    className="sr-only"
                                >
                                    Pilih Musim
                                </label>
                                <select
                                    id="desktop-season-select"
                                    value={currentSeason}
                                    onChange={(e) => {
                                        setCurrentSeason(e.target.value);
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

                        {/* Daftar Episode Desktop */}
                        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
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

                                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p
                                                        className={cn(
                                                            'truncate text-sm font-bold',
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
