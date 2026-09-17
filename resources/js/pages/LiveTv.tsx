import { App as CapApp } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Head, router } from '@inertiajs/react';
import Hls from 'hls.js';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Maximize,
    Minimize,
    Play,
    Radio,
    RotateCw,
    Search,
    Tv,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Navbar from '@/components/netflix/Navbar';
import { cn } from '@/lib/utils';

export interface LiveChannel {
    id: string;
    name: string;
    category: string;
    logo: string;
    stream_url: string;
    badge?: string;
    is_live?: boolean;
    description?: string;
}

export interface LiveCategory {
    id: string;
    name: string;
}

interface LiveTvProps {
    channels: LiveChannel[];
    categories: LiveCategory[];
    initialChannelId?: string;
    initialCategory?: string;
}

interface ChannelLogoProps {
    src?: string;
    name: string;
    className?: string;
    iconSize?: string;
}

function ChannelLogo({
    src,
    name,
    className = 'h-full w-full object-contain',
    iconSize = 'h-5 w-5',
}: ChannelLogoProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const isFailed = !src || failedSrc === src;

    if (isFailed) {
        const cleanName = name.replace(/\s*(HD|FHD)\s*$/i, '');
        const initials = cleanName
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();

        return (
            <div className="flex h-full w-full items-center justify-center rounded bg-linear-to-br from-zinc-800 to-zinc-950 text-[10px] font-black tracking-wider text-zinc-300 select-none">
                {initials || <Tv className={cn(iconSize, 'text-zinc-400')} />}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setFailedSrc(src)}
            className={className}
        />
    );
}

export default function LiveTv({
    channels = [],
    categories = [],
    initialChannelId,
    initialCategory = 'all',
}: LiveTvProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Channel yang sedang aktif diputar
    const [activeChannelId, setActiveChannelId] = useState<string>(() => {
        if (initialChannelId && channels.some((c) => c.id === initialChannelId)) {
            return initialChannelId;
        }
        return channels[0]?.id ?? '';
    });

    const activeChannel = useMemo(() => {
        return channels.find((c) => c.id === activeChannelId) ?? channels[0];
    }, [channels, activeChannelId]);

    // State Video Player (Murni HTML5 Native Player Tunggal)
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Kontrol UI mengambang di player
    const [showPlayerControls, setShowPlayerControls] = useState<boolean>(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Filter daftar channel berdasarkan kategori dan pencarian
    const filteredChannels = useMemo(() => {
        return channels.filter((channel) => {
            const matchesCategory =
                selectedCategory === 'all' || channel.category === selectedCategory;
            const matchesQuery =
                !searchQuery.trim() ||
                channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                channel.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [channels, selectedCategory, searchQuery]);

    // Timer sembunyikan kontrol player otomatis
    const resetControlsTimer = useCallback(() => {
        setShowPlayerControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowPlayerControls(false);
        }, 3500);
    }, []);

    // Screen Wake Lock (Layar tidak sleep saat nonton TV)
    useEffect(() => {
        let wakeLock: { release: () => Promise<void> } | null = null;
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                try {
                    const nav = navigator as unknown as {
                        wakeLock: {
                            request: (type: string) => Promise<{ release: () => Promise<void> }>;
                        };
                    };
                    wakeLock = await nav.wakeLock.request('screen');
                } catch {
                    // Abaikan jika tidak didukung
                }
            }
        };
        requestWakeLock();

        const handleVisChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisChange);
            if (wakeLock) {
                wakeLock.release().catch(() => {});
            }
        };
    }, []);

    // Deteksi Orientasi Layar (Potret vs Lanskap)
    const [isLandscape, setIsLandscape] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth > window.innerHeight;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        let removeOrientationListener: (() => void) | null = null;
        try {
            ScreenOrientation.addListener('screenOrientationChange', (res) => {
                setIsLandscape(res.type.includes('landscape'));
            })
                .then((h) => {
                    removeOrientationListener = () => h.remove();
                })
                .catch(() => {});
        } catch {
            // Bukan native Capacitor
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (removeOrientationListener) {
                removeOrientationListener();
            }
            try {
                ScreenOrientation.unlock().catch(() => {});
            } catch {
                // Abaikan kesalahan unlock
            }
        };
    }, []);

    // Tombol Putar Layar (Screen Rotation Toggle)
    const toggleRotation = useCallback(async () => {
        const nextLandscape = !isLandscape;
        setIsLandscape(nextLandscape);
        resetControlsTimer();

        try {
            if (nextLandscape) {
                await ScreenOrientation.lock({ orientation: 'landscape' });
            } else {
                await ScreenOrientation.lock({ orientation: 'portrait' });
            }
            return;
        } catch {
            // Native lock gagal atau bukan runtime Capacitor
        }

        try {
            const so = (
                screen as unknown as {
                    orientation?: {
                        lock: (orientation: string) => Promise<void>;
                    };
                }
            ).orientation;
            if (so && typeof so.lock === 'function') {
                await so.lock(nextLandscape ? 'landscape' : 'portrait');
                return;
            }
        } catch {
            // Web screen orientation lock gagal
        }

        try {
            if (nextLandscape && !document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else if (!nextLandscape && document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        } catch {
            // Fullscreen fallback
        }
    }, [isLandscape, resetControlsTimer]);

    // Pelacak Fullscreen
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                const el = document.getElementById('live-player-container');
                if (el?.requestFullscreen) {
                    await el.requestFullscreen();
                } else if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch {
            // Fullscreen gagal
        }
    }, []);

    // Tangani tombol fisik Back di Android (Capacitor)
    useEffect(() => {
        let removeListener: (() => void) | null = null;
        try {
            const listenerPromise = CapApp.addListener('backButton', () => {
                if (isFullscreen) {
                    toggleFullscreen();
                } else {
                    router.visit('/');
                }
            });
            listenerPromise
                .then((h) => {
                    removeListener = () => h.remove();
                })
                .catch(() => {});
        } catch {
            // Berjalan di browser biasa
        }

        return () => {
            if (removeListener) {
                removeListener();
            }
        };
    }, [isFullscreen, toggleFullscreen]);

    // Muat & Putar Siaran HLS saat Channel Aktif Berubah
    const loadStream = useCallback((streamUrl: string) => {
        const video = videoRef.current;
        if (!video || !streamUrl) return;

        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');

        // Prioritaskan suara langsung aktif (unmuted)
        video.muted = false;
        video.volume = 1.0;
        setIsMuted(false);

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 30,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 6,
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                video.muted = false;
                video.volume = 1.0;
                video.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsMuted(false);
                    })
                    .catch(() => {
                        // Jika cold-load dicegah oleh browser autoplay policy tanpa interaksi user,
                        // fallback mute agar video tetap mulai jalan (tidak macet)
                        video.muted = true;
                        setIsMuted(true);
                        video.play().catch(() => {});
                    });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            setHasError(true);
                            setErrorMessage('Siaran sedang mengalami gangguan atau offline sementara.');
                            setIsLoading(false);
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Dukungan native HLS di Apple Safari / iOS
            video.src = streamUrl;
            video.muted = false;
            video.volume = 1.0;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsMuted(false);
                    })
                    .catch(() => {
                        video.muted = true;
                        setIsMuted(true);
                        video.play().catch(() => {});
                    });
            });
            video.addEventListener('error', () => {
                setHasError(true);
                setErrorMessage('Siaran tidak dapat dimuat pada peramban ini.');
                setIsLoading(false);
            });
        } else {
            setHasError(true);
            setErrorMessage('Peramban Anda tidak mendukung pemutaran siaran HLS langsung.');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const streamUrl = activeChannel?.stream_url;
        if (streamUrl) {
            const timer = setTimeout(() => {
                loadStream(streamUrl);
            }, 0);
            return () => {
                clearTimeout(timer);
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [activeChannel, loadStream]);

    // Ganti channel (channel zapping)
    const selectChannel = useCallback((channel: LiveChannel) => {
        if (channel.id === activeChannelId) return;
        setActiveChannelId(channel.id);
        // Pastikan langsung bersuara pada interaksi klik user
        setIsMuted(false);
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
        }
        resetControlsTimer();
    }, [activeChannelId, resetControlsTimer]);

    // Tombol Next / Prev Channel
    const currentIndex = useMemo(() => {
        return channels.findIndex((c) => c.id === activeChannelId);
    }, [channels, activeChannelId]);

    const handleNextChannel = useCallback(() => {
        if (channels.length === 0) return;
        const nextIdx = (currentIndex + 1) % channels.length;
        selectChannel(channels[nextIdx]);
    }, [channels, currentIndex, selectChannel]);

    const handlePrevChannel = useCallback(() => {
        if (channels.length === 0) return;
        const prevIdx = (currentIndex - 1 + channels.length) % channels.length;
        selectChannel(channels[prevIdx]);
    }, [channels, currentIndex, selectChannel]);

    // Toggle Play/Pause
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.muted = false;
            video.volume = 1.0;
            setIsMuted(false);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            video.pause();
            setIsPlaying(false);
        }
        resetControlsTimer();
    }, [resetControlsTimer]);

    // Toggle Mute
    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
        resetControlsTimer();
    }, [resetControlsTimer]);

    // Unmute langsung
    const handleUnmute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = false;
        video.volume = 1.0;
        setIsMuted(false);
        resetControlsTimer();
    }, [resetControlsTimer]);

    return (
        <div className="min-h-screen bg-(--cinema-base) text-(--cinema-ink) flex flex-col font-sans select-none overflow-x-hidden">
            <Head title={`Live TV: ${activeChannel?.name ?? 'Siaran Langsung'} - Netflix`} />

            {/* Navbar Utama (Hanya terlihat di mode normal, disembunyikan saat fullscreen) */}
            {!isFullscreen && <Navbar activePath="/live-tv" />}

            <main className={cn('flex-1 flex flex-col', !isFullscreen && 'pt-16')}>
                {/* GRID UTAMA LIVE TV */}
                <div className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-8 flex flex-col lg:flex-row gap-5 lg:gap-8">
                    {/* KOLOM KIRI / ATAS: PEMUTAR VIDEO LIVE */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div
                            id="live-player-container"
                            onMouseMove={resetControlsTimer}
                            onTouchStart={resetControlsTimer}
                            className={cn(
                                'relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group',
                                isFullscreen && 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none aspect-auto',
                            )}
                        >
                            {/* Video Element Tunggal (Murni Native HTML5 Video - Tanpa Iframe) */}
                            <video
                                ref={videoRef}
                                playsInline
                                className="h-full w-full object-contain bg-black cursor-pointer"
                                onClick={isMuted ? handleUnmute : togglePlay}
                            />

                            {/* Tombol Cepat Unmute jika Autoplay Awal Terbisukan oleh Kebijakan Browser */}
                            {isMuted && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleUnmute}
                                    className="cinema-focus absolute top-14 left-4 z-30 flex items-center gap-2 rounded-full bg-red-600/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md hover:bg-red-600 transition active:scale-95 animate-bounce border border-white/20"
                                >
                                    <VolumeX className="h-4 w-4" />
                                    <span>Ketuk untuk Nyalakan Suara</span>
                                </button>
                            )}

                            {/* Loading Spinner */}
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs gap-3 z-20 pointer-events-none">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#E50914]" />
                                    <span className="text-xs font-semibold text-zinc-300">
                                        Menghubungkan ke siaran {activeChannel?.name}...
                                    </span>
                                </div>
                            )}

                            {/* Error Fallback State */}
                            {hasError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 p-6 text-center gap-3 z-25">
                                    <Radio className="h-12 w-12 text-red-500 animate-pulse" />
                                    <h3 className="text-base font-bold text-white">
                                        Siaran Tidak Dapat Dimuat
                                    </h3>
                                    <p className="text-xs text-zinc-400 max-w-md">
                                        {errorMessage || 'Server penyedia siaran sedang offline atau mengalami gangguan.'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {activeChannel?.stream_url && (
                                            <button
                                                type="button"
                                                onClick={() => activeChannel.stream_url && loadStream(activeChannel.stream_url)}
                                                className="cinema-focus flex items-center gap-1.5 rounded-full bg-[#E50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition active:scale-95"
                                            >
                                                <RotateCw className="h-3.5 w-3.5" />
                                                <span>Coba Lagi</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleNextChannel}
                                            className="cinema-focus flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition active:scale-95"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            <span>Channel Berikutnya</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Top Watermark & Live Badge (Selalu Tampil / Sinematik) */}
                            <div className="absolute top-3 inset-x-3.5 flex items-center justify-between pointer-events-none z-20">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow-md backdrop-blur-md animate-pulse">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                        LIVE
                                    </span>
                                    {activeChannel?.badge && (
                                        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 border border-white/10 backdrop-blur-md">
                                            {activeChannel.badge}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md">
                                    <div className="h-4 w-6 shrink-0 flex items-center justify-center">
                                        <ChannelLogo
                                            src={activeChannel?.logo}
                                            name={activeChannel?.name || ''}
                                            className="h-4 w-auto object-contain max-w-15"
                                            iconSize="h-3 w-3"
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-white">
                                        {activeChannel?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Floating Overlay Controls Bar */}
                            <div
                                className={cn(
                                    'absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 flex items-center justify-between transition-opacity duration-300',
                                    showPlayerControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
                                )}
                            >
                                {/* Sisi Kiri: Play/Pause, Channel Switcher & Volume */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        aria-label={isPlaying ? 'Jeda' : 'Putar'}
                                        className="cinema-focus flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/10"
                                    >
                                        {isPlaying ? <span className="h-3 w-3 bg-white block rounded-xs" /> : <Play className="h-4 w-4 fill-white" />}
                                    </button>

                                    <div className="flex items-center gap-1 bg-black/50 rounded-full border border-white/10 p-0.5">
                                        <button
                                            type="button"
                                            onClick={handlePrevChannel}
                                            aria-label="Channel Sebelumnya"
                                            title="Channel Sebelumnya"
                                            className="cinema-focus flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="text-[11px] font-bold text-zinc-300 px-1 min-w-6 text-center">
                                            {currentIndex + 1}/{channels.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleNextChannel}
                                            aria-label="Channel Berikutnya"
                                            title="Channel Berikutnya"
                                            className="cinema-focus flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                                        className="cinema-focus flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                                    >
                                        {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Sisi Kanan: Putar Layar & Fullscreen */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleRotation}
                                        aria-label={isLandscape ? 'Mode Potret' : 'Putar Layar ke Lanskap'}
                                        title={isLandscape ? 'Mode Potret' : 'Putar Layar'}
                                        className="cinema-focus flex h-8 sm:h-9 items-center gap-1 rounded-full bg-white/15 px-2.5 sm:px-3 text-[11px] font-semibold text-white border border-white/15 transition hover:bg-white/25 active:scale-95"
                                    >
                                        <RotateCw className="h-3.5 w-3.5" />
                                        <span className="hidden xs:inline">{isLandscape ? 'Potret' : 'Putar'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={toggleFullscreen}
                                        aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                                        className="cinema-focus flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/15"
                                    >
                                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Info Detail Channel yang Sedang Tayang */}
                        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xs flex items-start gap-3.5">
                            <div className="h-12 w-12 shrink-0 rounded-lg bg-black/80 border border-white/15 p-1.5 flex items-center justify-center overflow-hidden">
                                <ChannelLogo
                                    src={activeChannel?.logo}
                                    name={activeChannel?.name || ''}
                                    className="h-full w-full object-contain"
                                    iconSize="h-6 w-6"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-white truncate">
                                        {activeChannel?.name}
                                    </h1>
                                    <span className="rounded bg-[#E50914]/20 border border-[#E50914]/50 px-2 py-0.5 text-[10px] font-bold text-[#E50914] uppercase">
                                        {activeChannel?.category}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                                    {activeChannel?.description || 'Menayangkan program siaran langsung berkualitas.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN / BAWAH: DAFTAR CHANNEL & KATEGORI (EPG Mini) */}
                    <div className="w-full lg:w-96 flex flex-col gap-4">
                        {/* Filter Kategori Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            'cinema-focus shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95',
                                            isSelected
                                                ? 'bg-[#E50914] text-white shadow-md'
                                                : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5',
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bilah Pencarian Channel */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama channel TV..."
                                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 py-2 pr-3 pl-9 text-xs text-white placeholder-zinc-500 focus:border-[#E50914] focus:outline-none"
                            />
                        </div>

                        {/* List Channel Cards (Scrollable) */}
                        <div className="space-y-2 max-h-130 overflow-y-auto no-scrollbar pr-0.5">
                            {filteredChannels.length === 0 ? (
                                <div className="p-8 text-center text-xs text-zinc-500">
                                    Tidak ada channel yang cocok dengan pencarian Anda.
                                </div>
                            ) : (
                                filteredChannels.map((channel) => {
                                    const isCurrent = channel.id === activeChannelId;
                                    return (
                                        <div
                                            key={channel.id}
                                            onClick={() => selectChannel(channel)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    selectChannel(channel);
                                                }
                                            }}
                                            className={cn(
                                                'cinema-focus group flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition',
                                                isCurrent
                                                    ? 'border-[#E50914] bg-[#E50914]/10 shadow-md ring-1 ring-[#E50914]/40'
                                                    : 'border-white/5 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900',
                                            )}
                                        >
                                            {/* Channel Logo */}
                                            <div className="relative h-10 w-12 shrink-0 rounded bg-black/70 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                                                <ChannelLogo
                                                    src={channel.logo}
                                                    name={channel.name}
                                                    className="h-full w-full object-contain"
                                                    iconSize="h-4 w-4"
                                                />
                                                {isCurrent && (
                                                    <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                                )}
                                            </div>

                                            {/* Channel Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p
                                                        className={cn(
                                                            'truncate text-xs font-bold',
                                                            isCurrent ? 'text-[#E50914]' : 'text-white',
                                                        )}
                                                    >
                                                        {channel.name}
                                                    </p>
                                                    {channel.badge && (
                                                        <span className="shrink-0 text-[9px] font-bold text-zinc-400 bg-white/5 px-1 py-0.5 rounded">
                                                            {channel.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                                                    {channel.description || channel.category}
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            {isCurrent ? (
                                                <div className="flex items-center gap-1 rounded bg-[#E50914] px-1.5 py-0.5 text-[9px] font-black text-white shrink-0">
                                                    <span>DIPUTAR</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[9px] font-semibold text-zinc-500 group-hover:text-zinc-300 shrink-0">
                                                    <Play className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
