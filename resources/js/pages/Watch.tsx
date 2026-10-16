import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    LayoutGrid,
    Loader2,
    Maximize,
    Minimize,
    MousePointer2,
    Play,
    RotateCw,
    Server,
    SkipForward,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBackHandler } from '@/hooks/use-back-handler';
import { useFocusScope } from '@/hooks/use-focus-scope';
import { useRemotePlayerControl } from '@/hooks/use-remote-player-control';
import { useTvMode } from '@/hooks/use-tv-mode';
import { saveContinueWatching } from '@/lib/continue-watching';
import type { NativeTvStatus } from '@/lib/tv/native-remote';
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

    const isTv = useTvMode();
    const controlButtonRef = useRef<HTMLButtonElement>(null);
    const episodeDrawerRef = useRef<HTMLElement>(null);
    const remote = useRemotePlayerControl({
        enabled: isTv,
        menuTargetRef: controlButtonRef,
    });

    // Musim yang sedang dilihat di daftar episode, terpisah dari musim yang
    // diputar. Dulu memilih musim di daftar langsung memutar episode 1 musim
    // itu dan menutup laci, sehingga episode yang sedang ditonton hilang
    // hanya karena pemirsa melihat-lihat.
    const [browseSeason, setBrowseSeason] = useState(initialSeason);
    const [browseLoaded, setBrowseLoaded] = useState<{
        season: string;
        details: TmdbSeasonDetails | null;
    } | null>(null);

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

    // Daftar episode musim yang sedang dilihat. Musim yang sama dengan yang
    // diputar memakai data di atas, jadi tidak diambil dua kali.
    useEffect(() => {
        if (type !== 'tv' || !id || browseSeason === currentSeason) return;
        const controller = new AbortController();

        fetch(`/api/tmdb/tv/${id}/season/${browseSeason}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data: TmdbSeasonDetails) => {
                setBrowseLoaded({ season: browseSeason, details: data });
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setBrowseLoaded({ season: browseSeason, details: null });
                }
            });

        return () => controller.abort();
    }, [id, type, browseSeason, currentSeason]);

    const isBrowsingCurrentSeason = browseSeason === currentSeason;
    const isBrowseLoading = isBrowsingCurrentSeason
        ? seasonDetails === null
        : browseLoaded?.season !== browseSeason;
    const browseSeasonDetails = isBrowsingCurrentSeason
        ? seasonDetails
        : browseLoaded?.season === browseSeason
          ? browseLoaded.details
          : null;

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

    // Deteksi & Pelacak Orientasi Layar (Potret <-> Lanskap)
    const [isLandscape, setIsLandscape] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth > window.innerHeight;
    });

    useEffect(() => {
        const updateOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        window.addEventListener('resize', updateOrientation);
        window.addEventListener('orientationchange', updateOrientation);

        let removeListener: (() => void) | null = null;
        try {
            ScreenOrientation.addListener('screenOrientationChange', (res) => {
                setIsLandscape(res.type.includes('landscape'));
            })
                .then((handle) => {
                    removeListener = () => handle.remove();
                })
                .catch(() => {});
        } catch {
            // Berjalan di luar Capacitor native
        }

        return () => {
            window.removeEventListener('resize', updateOrientation);
            window.removeEventListener('orientationchange', updateOrientation);
            if (removeListener) {
                removeListener();
            }
            try {
                ScreenOrientation.unlock().catch(() => {});
            } catch {
                // Abaikan kesalahan pembatalan kunci orientasi
            }
        };
    }, []);

    // Aksi Putar Layar (Screen Rotation Toggle)
    const toggleRotation = useCallback(async () => {
        const nextIsLandscape = !isLandscape;
        setIsLandscape(nextIsLandscape);
        resetHideTimer();

        // 1. Coba gunakan plugin native Capacitor ScreenOrientation (Android/iOS)
        try {
            if (nextIsLandscape) {
                await ScreenOrientation.lock({ orientation: 'landscape' });
            } else {
                await ScreenOrientation.lock({ orientation: 'portrait' });
            }
            return;
        } catch {
            // Bukan runtime native Capacitor
        }

        // 2. Fallback ke Web Screen Orientation API (standar W3C modern)
        try {
            const so = (
                screen as unknown as {
                    orientation?: {
                        lock: (orientation: string) => Promise<void>;
                    };
                }
            ).orientation;
            if (so && typeof so.lock === 'function') {
                await so.lock(nextIsLandscape ? 'landscape' : 'portrait');
                return;
            }
        } catch {
            // Web browser membatasi lock tanpa Fullscreen
        }

        // 3. Fallback Fullscreen API untuk browser mobile reguler
        try {
            if (nextIsLandscape && !document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } else if (!nextIsLandscape && document.fullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch {
            // Fullscreen API fallback
        }
    }, [isLandscape, resetHideTimer]);

    // Tombol kembali langsung mengarahkan ke halaman sebelumnya di aplikasi
    const handleBack = useCallback(() => {
        try {
            ScreenOrientation.unlock().catch(() => {});
        } catch {
            // Abaikan kesalahan unlock orientasi
        }

        // replace: entri halaman tonton ditimpa, jadi Kembali dari halaman
        // tujuan tidak pernah memantul lagi ke pemutar.
        router.visit(
            returnUrl && returnUrl.startsWith('/') ? returnUrl : '/',
            { replace: true },
        );
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

    // Tombol fisik Back / gestur swipe di Android. Laci episode dan mode
    // kendali pemutar mendaftar di atasnya, jadi keduanya ditutup lebih dulu.
    useBackHandler(handleBack);

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
        setBrowseSeason(sStr);
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

    // Laci selalu dibuka pada musim yang sedang diputar.
    const openEpisodeDrawer = () => {
        setBrowseSeason(currentSeason);
        setIsEpisodeDrawerOpen(true);
    };

    // Laci episode: Escape/Kembali menutupnya, remote tetap di dalamnya
    // selama terbuka, dan fokus kembali ke tombol Episode saat ditutup.
    useBackHandler(() => setIsEpisodeDrawerOpen(false), {
        enabled: isEpisodeDrawerOpen,
        overlay: true,
    });
    useFocusScope(episodeDrawerRef, isEpisodeDrawerOpen);

    // Tombol Kendalikan Pemutar baru dirender setelah plugin native menjawab,
    // biasanya sesudah fokus awal halaman sudah dipasang ke tombol Kembali.
    // Saat tombol itu muncul, fokus dipindah ke sana, kecuali pemirsa sudah
    // memilih tempat lain.
    const isRemoteReady = remote.status?.kind === 'ready';

    useEffect(() => {
        if (!isTv || !isRemoteReady) return;

        const focused = document.activeElement;

        if (
            !focused ||
            focused === document.body ||
            focused.getAttribute('aria-label') === 'Kembali'
        ) {
            controlButtonRef.current?.focus({ preventScroll: true });
        }
    }, [isTv, isRemoteReady]);

    // Di TV menu atas tidak bersembunyi mengikuti gerak tetikus. Menu tampil
    // selama remote menavigasi halaman, dan menyingkir hanya saat kendali
    // diserahkan ke pemutar.
    const isHeaderVisible = isTv
        ? remote.mode === 'menu'
        : showUi || isEpisodeDrawerOpen;

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
                    {/* Tombol Putar Layar ke Lanskap */}
                    <button
                        type="button"
                        onClick={toggleRotation}
                        aria-label="Putar Layar ke Mode Lanskap"
                        title="Putar Layar (Lanskap)"
                        className="cinema-focus flex h-8 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
                    >
                        <RotateCw className="h-3.5 w-3.5 text-zinc-200" />
                        <span>Putar</span>
                    </button>

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
                                    openEpisodeDrawer();
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

            {/* HEADER MENGAMBANG (Sinematik & Otomatis Sembunyi untuk Mode Lanskap & Desktop) */}
            <header
                className={cn(
                    'pointer-events-none fixed inset-x-0 top-0 z-45 flex-col bg-linear-to-b from-black/95 via-black/80 to-transparent px-4 pt-3 pb-6 transition-all duration-300 md:px-8',
                    'hidden md:flex mobile-landscape-visible',
                    isHeaderVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-4 pointer-events-none',
                )}
                // Di TV, saat kendali di pemutar, isi menu tidak boleh dituju
                // remote maupun ikut terketuk kursor. Di desktop tidak dipakai:
                // menu yang bersembunyi tetap harus terjangkau Tab.
                inert={isTv && !isHeaderVisible}
            >
                {/* Baris 1: Tombol Navigasi, Judul, dan Tombol Kontrol Cepat */}
                <div className="flex items-center justify-between gap-2">
                    {/* Sisi Kiri: Tombol Kembali & Info Judul */}
                    <div className="flex min-w-0 items-center gap-3 md:gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            aria-label="Kembali"
                            className="pointer-events-auto cinema-focus flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md"
                        >
                            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                        </button>

                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                                <span className="flex h-4.5 w-4.5 md:h-5 md:w-5 shrink-0 items-center justify-center rounded bg-[#E50914] text-[9px] md:text-[10px] font-black text-white">
                                    N
                                </span>
                                <h1 className="truncate text-sm md:text-base font-bold text-white drop-shadow max-w-50 xs:max-w-xs md:max-w-md">
                                    {title}
                                </h1>
                            </div>

                            {type === 'tv' && (
                                <p className="truncate text-[11px] md:text-xs text-zinc-300 drop-shadow">
                                    M{currentSeason} : E{currentEpisode}
                                    {currentEpisodeData?.name ? ` - ${currentEpisodeData.name}` : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sisi Kanan: Kontrol Putar Layar, Episode & Fullscreen */}
                    <div className="flex shrink-0 items-center gap-2">
                        {/* Tombol utama di TV: menyerahkan remote ke pemutar
                            agar tombol Putar, CC, dan pengaturan di dalam
                            iframe bisa dijangkau. Hanya tampil bila kursor
                            native benar-benar tersedia; tanpa kursor tombol
                            ini dulu membuat remote mati sampai Kembali. */}
                        {isTv && remote.status?.kind === 'ready' && (
                            <button
                                ref={controlButtonRef}
                                type="button"
                                onClick={() => void remote.takeControl()}
                                data-tv-autofocus
                                className="pointer-events-auto cinema-focus flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85"
                            >
                                <MousePointer2
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>Kendalikan Pemutar</span>
                            </button>
                        )}

                        {/* Tombol Putar Layar. Tidak berguna di TV yang
                            selalu lanskap. */}
                        <button
                            type="button"
                            onClick={toggleRotation}
                            aria-label={isLandscape ? 'Kembali ke Mode Potret' : 'Putar Layar ke Mode Lanskap'}
                            title={isLandscape ? 'Kembali ke Mode Potret' : 'Putar Layar (Lanskap)'}
                            className="pointer-events-auto cinema-focus flex h-9 md:h-11 items-center gap-1.5 rounded-full bg-white/15 px-3 md:px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm transition hover:bg-white/25 active:scale-95 tv:hidden"
                        >
                            <RotateCw className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" aria-hidden="true" />
                            <span>{isLandscape ? 'Potret' : 'Putar Layar'}</span>
                        </button>

                        {type === 'tv' && nextEpisode && (
                            <button
                                type="button"
                                onClick={handleNextEpisode}
                                aria-label={`Putar Episode Berikutnya: Episode ${nextEpisode.episode_number}`}
                                className="pointer-events-auto cinema-focus flex h-9 md:h-11 items-center gap-1.5 rounded-full bg-white/15 px-3 md:px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
                            >
                                <SkipForward className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" aria-hidden="true" />
                                <span className="hidden sm:inline">Berikutnya</span>
                            </button>
                        )}

                        {type === 'tv' && (
                            <button
                                type="button"
                                onClick={openEpisodeDrawer}
                                aria-label="Buka Daftar Episode"
                                className="pointer-events-auto cinema-focus flex h-9 md:h-11 items-center gap-1.5 rounded-full bg-black/70 px-3 md:px-4 py-1.5 text-xs font-semibold text-white border border-white/15 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" aria-hidden="true" />
                                <span>Episode</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                            // Aplikasi TV sudah memenuhi layar, dan Fullscreen
                            // API di WebView TV tidak selalu tersedia.
                            className="pointer-events-auto cinema-focus hidden sm:flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full bg-black/70 text-white border border-white/15 backdrop-blur-md transition hover:bg-white/20 active:scale-95 tv:hidden"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-4 w-4" />
                            ) : (
                                <Maximize className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Baris 2: Pemilihan Server */}
                <div
                    data-tv-row
                    className="pointer-events-auto no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-white/10 py-2"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pr-1">
                        Server:
                    </span>
                    {SERVERS.map((server) => {
                        const isActive = server.id === activeServerId;
                        return (
                            <button
                                key={server.id}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => {
                                    setActiveServerId(server.id);
                                    resetHideTimer();
                                }}
                                className={cn(
                                    'cinema-focus flex shrink-0 items-center gap-1 rounded-full px-2.5 md:px-3 py-1 text-[11px] md:text-xs font-bold transition active:scale-95',
                                    isActive
                                        ? 'bg-[#E50914] text-white shadow-md ring-2 ring-red-500/50'
                                        : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/10 backdrop-blur-sm',
                                )}
                            >
                                <span>{server.name}</span>
                            </button>
                        );
                    })}

                    <span className="text-[10px] md:text-[11px] text-zinc-400 pl-2 hidden sm:inline tv:hidden">
                        💡 Takarir (CC) dapat diaktifkan langsung di tombol CC pemutar video
                    </span>
                </div>

                {isTv && remote.status && (
                    <p
                        role="status"
                        className={cn(
                            'mt-1 max-w-2xl text-sm leading-relaxed',
                            remote.status.kind === 'ready'
                                ? 'text-zinc-300'
                                : 'font-semibold text-amber-300',
                        )}
                    >
                        {remoteStatusText(remote.status)}
                    </p>
                )}
            </header>

            {isTv && remote.mode === 'player' && <RemotePlayerHint />}

            {/* KONTEN PEMUTAR VIDEO (16:9 di Mobile Portrait, Fullscreen di Mobile Landscape & Desktop) */}
            <div className="mobile-landscape-fullscreen relative w-full aspect-video bg-black shrink-0 md:absolute md:inset-0 md:h-full md:w-full md:aspect-auto">
                <iframe
                    key={`${activeServerId}-${currentSeason}-${currentEpisode}`}
                    src={embedUrl}
                    title={`Pemutar ${title}`}
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    // Di TV iframe tidak pernah difokus: pemutar pihak ketiga
                    // tidak menanggapi tombol arah, dan remote yang masuk ke
                    // sana tidak bisa keluar selain lewat tombol Kembali.
                    // Pemutar dikendalikan lewat kursor native.
                    tabIndex={isTv ? -1 : undefined}
                />

                {/* Area Sentuh Cepat Bagian Atas untuk Memunculkan Header Lengkap saat Tersembunyi */}
                {!isTv && !showUi && !isEpisodeDrawerOpen && (
                    <div
                        onClick={() => resetHideTimer()}
                        onTouchStart={() => resetHideTimer()}
                        className="pointer-events-auto fixed inset-x-0 top-0 h-16 z-35 cursor-pointer"
                        aria-hidden="true"
                    />
                )}

                {/* Tombol Aksi Cepat Mengambang (Selalu Muncul Elegan saat Header Tersembunyi) */}
                <div
                    className={cn(
                        // Di TV menu atas yang menggantikan tombol-tombol ini,
                        // dan saat kursor aktif tombol ini hanya akan ikut
                        // terketuk di atas kontrol pemutar.
                        'pointer-events-auto fixed top-3.5 inset-x-3.5 z-40 flex items-center justify-between transition-all duration-300 tv:hidden',
                        showUi || isEpisodeDrawerOpen
                            ? 'opacity-0 pointer-events-none -translate-y-2'
                            : 'opacity-85 hover:opacity-100 translate-y-0',
                    )}
                >
                    {/* Kiri: Tombol Kembali Mengambang */}
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Kembali"
                        title="Kembali"
                        className="cinema-focus flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white border border-white/20 shadow-xl backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Kanan: Tombol Putar Layar & Tombol Menu Kontrol */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleRotation}
                            aria-label={isLandscape ? 'Mode Potret' : 'Putar Layar'}
                            title={isLandscape ? 'Kembali ke Potret' : 'Putar Layar (Lanskap)'}
                            className="cinema-focus flex h-10 items-center gap-1.5 rounded-full bg-black/80 px-3.5 text-xs font-semibold text-white border border-white/20 shadow-xl backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95"
                        >
                            <RotateCw className="h-4 w-4 text-zinc-200" />
                            <span className="text-[11px]">{isLandscape ? 'Potret' : 'Putar'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => resetHideTimer()}
                            aria-label="Tampilkan Pilihan Server & Episode"
                            title="Menu Server & Kontrol"
                            className="cinema-focus flex h-10 items-center gap-1.5 rounded-full bg-black/80 px-3.5 text-xs font-semibold text-white border border-white/20 shadow-xl backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95"
                        >
                            <Server className="h-4 w-4 text-[#E50914]" />
                            <span className="text-[11px]">Server</span>
                        </button>
                    </div>
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
                                    value={browseSeason}
                                    onChange={(e) => setBrowseSeason(e.target.value)}
                                    aria-label="Pilih Musim"
                                    className="cinema-focus rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white"
                                >
                                    {seasonList.map((s) => (
                                        <option key={s.season_number} value={s.season_number}>
                                            Musim {s.season_number} ({s.episode_count} Ep)
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* List Episode Cards */}
                        <div className="space-y-2.5">
                            {isBrowseLoading ? (
                                <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                                    <span className="text-xs">Memuat episode...</span>
                                </div>
                            ) : browseSeasonDetails?.episodes && browseSeasonDetails.episodes.length > 0 ? (
                                browseSeasonDetails.episodes.map((ep) => {
                                    const isCurrent =
                                        isBrowsingCurrentSeason &&
                                        String(ep.episode_number) === String(currentEpisode);

                                    return (
                                        <div
                                            key={ep.id}
                                            onClick={() => selectEpisode(browseSeason, ep.episode_number)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    selectEpisode(browseSeason, ep.episode_number);
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
                                                <EpisodeStill
                                                    path={ep.still_path}
                                                    alt={`Episode ${ep.episode_number}`}
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
                        ref={episodeDrawerRef}
                        role="dialog"
                        aria-modal={isEpisodeDrawerOpen}
                        aria-label="Daftar episode"
                        // Laci tertutup hanya digeser ke luar layar. Tanpa
                        // inert, isinya tetap bisa dituju Tab dan remote.
                        inert={!isEpisodeDrawerOpen}
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

                        {/* Pemilih Musim. Di TV berupa deret tombol di dalam
                            laci: pilihan bawaan <select> membuka dialog sistem
                            Android di luar laci. Memilih musim hanya
                            menampilkan daftarnya; episode yang diputar baru
                            berganti setelah sebuah episode dipilih. */}
                        {seasonList.length > 1 &&
                            (isTv ? (
                                <div
                                    data-tv-row
                                    role="group"
                                    aria-label="Pilih musim"
                                    className="no-scrollbar flex gap-2 overflow-x-auto border-b border-zinc-800 px-5 py-3"
                                >
                                    {seasonList.map((s) => {
                                        const isBrowsed =
                                            String(s.season_number) ===
                                            browseSeason;

                                        return (
                                            <button
                                                key={s.season_number}
                                                type="button"
                                                aria-pressed={isBrowsed}
                                                onClick={() =>
                                                    setBrowseSeason(
                                                        String(s.season_number),
                                                    )
                                                }
                                                className={cn(
                                                    'cinema-focus shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                                                    isBrowsed
                                                        ? 'border-white text-white'
                                                        : 'border-zinc-700 text-zinc-300',
                                                    'focus-visible:bg-white focus-visible:text-black',
                                                )}
                                            >
                                                Musim {s.season_number}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="border-b border-zinc-800 px-5 py-3">
                                    <label
                                        htmlFor="desktop-season-select"
                                        className="sr-only"
                                    >
                                        Pilih Musim
                                    </label>
                                    <select
                                        id="desktop-season-select"
                                        value={browseSeason}
                                        onChange={(e) =>
                                            setBrowseSeason(e.target.value)
                                        }
                                        className="cinema-focus w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:border-zinc-500"
                                    >
                                        {seasonList.map((s) => (
                                            <option
                                                key={s.season_number}
                                                value={s.season_number}
                                            >
                                                Musim {s.season_number} (
                                                {s.episode_count} episode)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                        {/* Daftar Episode Desktop. scroll-py memberi ruang bagi
                            cincin fokus episode yang digulir ke tepi daftar. */}
                        <div className="no-scrollbar flex-1 scroll-py-6 space-y-3 overflow-y-auto p-4">
                            {isBrowseLoading ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-400">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
                                    <span className="text-xs">
                                        Memuat episode...
                                    </span>
                                </div>
                            ) : browseSeasonDetails?.episodes &&
                              browseSeasonDetails.episodes.length > 0 ? (
                                browseSeasonDetails.episodes.map((ep) => {
                                    const isCurrent =
                                        isBrowsingCurrentSeason &&
                                        String(ep.episode_number) ===
                                            String(currentEpisode);

                                    return (
                                        <div
                                            key={ep.id}
                                            onClick={() =>
                                                selectEpisode(
                                                    browseSeason,
                                                    ep.episode_number,
                                                )
                                            }
                                            role="button"
                                            tabIndex={0}
                                            aria-current={
                                                isCurrent ? 'true' : undefined
                                            }
                                            // Laci dibuka dengan fokus di
                                            // episode yang sedang diputar.
                                            data-tv-autofocus={
                                                isCurrent ? true : undefined
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault();
                                                    selectEpisode(
                                                        browseSeason,
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
                                                <EpisodeStill
                                                    path={ep.still_path}
                                                    alt={`Cuplikan episode ${ep.episode_number}`}
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

/**
 * Gambar episode. Episode tanpa cuplikan di TMDB dulu menunjuk ke
 * /placeholder.jpg yang tidak ada, jadi setiap kartunya menampilkan ikon
 * gambar rusak.
 */
function EpisodeStill({ path, alt }: { path?: string | null; alt: string }) {
    if (!path) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-500">
                Tanpa gambar
            </div>
        );
    }

    return (
        <img
            src={`https://image.tmdb.org/t/p/w300${path}`}
            alt={alt}
            className="h-full w-full object-cover"
            loading="lazy"
        />
    );
}

/** Lama petunjuk kendali tampil sebelum memudar, cukup untuk dibaca sekali. */
const REMOTE_HINT_MS = 6000;

/**
 * Pengingat singkat saat remote diserahkan ke pemutar. Menu atas sudah
 * menyingkir pada saat itu, jadi tanpa petunjuk ini pemirsa tidak tahu cara
 * kembali ke pilihan server dan episode. Tidak menangkap ketukan, supaya
 * kursor tetap bisa mengenai kontrol pemutar di bawahnya.
 */
/**
 * Teks petunjuk kendali remote di menu atas. Bila kursor tidak tersedia,
 * pemirsa diberi tahu penyebabnya dan apa yang harus dilakukan, bukan
 * dibiarkan menekan tombol yang tidak berbuat apa-apa.
 */
function remoteStatusText(status: NativeTvStatus): string {
    switch (status.kind) {
        case 'ready':
            return 'Pilih Kendalikan Pemutar, lalu gerakkan kursor dengan tombol panah dan tekan OK untuk Putar, takarir (CC), atau pengaturan pemutar. Tekan Kembali untuk membuka menu ini lagi.';
        case 'missing':
            return `Aplikasi di TV ini masih versi lama${status.build ? ` (${status.build})` : ''}, jadi kursor remote untuk pemutar belum ada. Hapus aplikasinya dari TV, lalu pasang APK terbaru.`;
        case 'web':
            return 'Kendali pemutar dengan remote hanya tersedia di aplikasi Android TV.';
        case 'error':
            return `Kursor remote tidak tersedia: ${status.message}`;
    }
}

function RemotePlayerHint() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), REMOTE_HINT_MS);

        return () => clearTimeout(timer);
    }, []);

    return (
        <p
            role="status"
            className={cn(
                'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-opacity duration-500',
                isVisible ? 'opacity-100' : 'opacity-0',
            )}
        >
            Panah menggerakkan kursor, OK untuk klik. Kembali membuka menu.
        </p>
    );
}
