import Hls from 'hls.js';
import {
    Loader2,
    Maximize,
    Minimize,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Volume1,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { StreamSource } from '@/types/playback';

interface VideoPlayerProps {
    source: StreamSource;
    title?: string;
    subtitle?: { url: string; label: string; language: string } | null;
    autoPlay?: boolean;
    onError?: (message: string) => void;
    onReady?: () => void;
    onEnded?: () => void;
}

interface AudioTrackOption {
    id: number;
    name: string;
    lang: string;
}

const SEEK_STEP_SECONDS = 10;
const CONTROLS_HIDE_DELAY_MS = 3000;

let nativeHlsSupport: boolean | null = null;

/**
 * Dukungan HLS bawaan peramban bersifat tetap sepanjang sesi, jadi hasilnya
 * cukup dihitung sekali dan tidak perlu disimpan sebagai state React.
 */
function supportsNativeHls(): boolean {
    if (nativeHlsSupport === null) {
        nativeHlsSupport =
            typeof document !== 'undefined' &&
            document
                .createElement('video')
                .canPlayType('application/vnd.apple.mpegurl') !== '';
    }

    return nativeHlsSupport;
}

/**
 * Pemutar tunggal untuk seluruh aplikasi.
 *
 * Komponen ini memuat media langsung ke elemen <video> milik kita sendiri.
 * Tidak ada iframe pihak ketiga, jadi tidak ada pihak luar yang bisa
 * menyuntikkan iklan, popup, atau pengalih halaman ke dalam sesi menonton.
 */
export default function VideoPlayer(props: VideoPlayerProps) {
    // Setiap sumber memulai sesi pemutaran yang benar-benar baru. Memasang
    // key pada URL membuat React melepas seluruh state lama, sehingga tidak
    // ada sisa durasi, jalur audio, atau galat dari berkas sebelumnya yang
    // perlu dibersihkan tangan di dalam efek.
    return <VideoPlayerSession key={props.source.url} {...props} />;
}

function VideoPlayerSession({
    source,
    title,
    subtitle,
    autoPlay = true,
    onError,
    onReady,
    onEnded,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
    const [activeAudioTrack, setActiveAudioTrack] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isIdle, setIsIdle] = useState(false);
    const [lastInteractionAt, setLastInteractionAt] = useState(0);

    // Callback prop bisa berubah identitas tiap render induk. Simpan di ref
    // supaya efek pemuatan media tidak ikut tereksekusi ulang tanpa alasan.
    const callbacksRef = useRef({ onError, onReady, onEnded });
    useEffect(() => {
        callbacksRef.current = { onError, onReady, onEnded };
    }, [onError, onReady, onEnded]);

    const failWith = useCallback((message: string) => {
        setError(message);
        setIsLoading(false);
        callbacksRef.current.onError?.(message);
    }, []);

    /* Pemuatan media. Jalur HLS dan berkas tunggal ditangani terpisah. */
    useEffect(() => {
        const video = videoRef.current;

        if (!video || !source.url) {
            return;
        }

        // Melepas sumber tanpa memanggil load(). Pemanggilan load() pada elemen
        // yang sudah tidak punya src memicu kejadian 'error', dan di mode ketat
        // React efek ini berjalan dua kali saat pasang, sehingga galat palsu itu
        // muncul sebelum berkas sempat diputar sama sekali.
        const detachSource = () => {
            video.pause();
            video.removeAttribute('src');
        };

        if (source.kind === 'progressive') {
            video.src = source.url;
            video.load();

            return detachSource;
        }

        if (supportsNativeHls()) {
            // Safari memutar HLS secara native dan hasilnya lebih hemat baterai
            // daripada memaksa Media Source Extensions lewat hls.js.
            video.src = source.url;
            video.load();

            return detachSource;
        }

        // Peramban tanpa dukungan HLS sudah disaring sebelum render, jadi
        // cabang ini hanya penjaga terakhir.
        if (!Hls.isSupported()) {
            return;
        }

        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;

        hls.loadSource(source.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setAudioTracks(
                hls.audioTracks.map((track, index) => ({
                    id: index,
                    name: track.name || `Audio ${index + 1}`,
                    lang: track.lang || 'und',
                })),
            );
        });

        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event, data) => {
            setActiveAudioTrack(data.id);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) {
                return;
            }

            // Galat jaringan dan media masih bisa dipulihkan tanpa memuat ulang
            // halaman. Hanya galat lain yang benar-benar menghentikan pemutaran.
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
                return;
            }

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
                return;
            }

            failWith('Aliran video terputus dan tidak bisa dipulihkan.');
        });

        return () => {
            hls.destroy();
            hlsRef.current = null;
        };
    }, [source.kind, source.url, failWith]);

    /* Sinkronisasi keadaan pemutar dengan elemen video. */
    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => setIsLoading(false);

        const handleProgress = () => {
            if (video.buffered.length === 0) {
                return;
            }

            setBuffered(video.buffered.end(video.buffered.length - 1));
        };

        const handleLoadedMetadata = () => {
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            setIsLoading(false);
            callbacksRef.current.onReady?.();

            if (autoPlay) {
                // Autoplay bersuara sering ditolak kebijakan peramban. Kegagalan
                // di sini bukan galat: pengguna tinggal menekan tombol putar.
                void video.play().catch(() => undefined);
            }
        };

        const handleError = () => {
            // Elemen yang sumbernya baru dilepas juga memancarkan 'error'.
            // Hanya kegagalan yang benar-benar meninggalkan MediaError, dan
            // masih punya src, yang boleh menghentikan pemutaran.
            if (video.error === null || video.getAttribute('src') === null) {
                return;
            }

            failWith(
                video.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                    ? 'Format berkas ini tidak didukung peramban.'
                    : 'Berkas video gagal dimuat. Periksa sambungan, lalu coba lagi.',
            );
        };

        const handleEnded = () => {
            setIsPlaying(false);
            callbacksRef.current.onEnded?.();
        };

        const handleVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('progress', handleProgress);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('volumechange', handleVolumeChange);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('progress', handleProgress);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('volumechange', handleVolumeChange);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, [autoPlay, failWith, source.url]);

    /* Status layar penuh dikendalikan peramban, jadi ikuti kejadiannya. */
    useEffect(() => {
        const handleChange = () =>
            setIsFullscreen(document.fullscreenElement !== null);

        document.addEventListener('fullscreenchange', handleChange);
        return () =>
            document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        if (video.paused) {
            void video.play().catch(() => undefined);
        } else {
            video.pause();
        }
    }, []);

    const seekBy = useCallback((seconds: number) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)) {
            return;
        }

        video.currentTime = Math.min(
            Math.max(video.currentTime + seconds, 0),
            video.duration,
        );
    }, []);

    const seekTo = useCallback((ratio: number) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)) {
            return;
        }

        video.currentTime = Math.min(Math.max(ratio, 0), 1) * video.duration;
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;

        if (video) {
            video.muted = !video.muted;
        }
    }, []);

    const changeVolume = useCallback((value: number) => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.volume = Math.min(Math.max(value, 0), 1);
        video.muted = value === 0;
    }, []);

    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        if (document.fullscreenElement) {
            void document.exitFullscreen().catch(() => undefined);
        } else {
            void container.requestFullscreen().catch(() => undefined);
        }
    }, []);

    const switchAudioTrack = useCallback((trackId: number) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = trackId;
        }
    }, []);

    /* Pintasan papan tik standar pemutar video. */
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target &&
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
            ) {
                return;
            }

            switch (event.key) {
                case ' ':
                case 'k':
                    event.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    seekBy(-SEEK_STEP_SECONDS);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    seekBy(SEEK_STEP_SECONDS);
                    break;
                case 'm':
                    toggleMute();
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seekBy, toggleMute, toggleFullscreen]);

    // Waktu interaksi terakhir dicatat dari penangan kejadian, bukan dari efek.
    // Efek di bawah hanya memasang pewaktu dan mengubah state saat pewaktu itu
    // berbunyi, jadi tidak ada render berantai saat pemirsa menggerakkan tetikus.
    const revealControls = useCallback(() => {
        setIsIdle(false);
        setLastInteractionAt(Date.now());
    }, []);

    useEffect(() => {
        if (!isPlaying || isIdle) {
            return;
        }

        const timer = setTimeout(() => setIsIdle(true), CONTROLS_HIDE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [isPlaying, isIdle, lastInteractionAt]);

    // Saat pemutaran berhenti, kendali selalu tampil. Pemirsa yang menjeda
    // video jelas sedang mencari tombol.
    const showControls = !isPlaying || !isIdle;

    const progressRatio = useMemo(
        () => (duration > 0 ? currentTime / duration : 0),
        [currentTime, duration],
    );

    const bufferedRatio = useMemo(
        () => (duration > 0 ? Math.min(buffered / duration, 1) : 0),
        [buffered, duration],
    );

    // Kemampuan peramban diperiksa sebelum render, bukan lewat state, supaya
    // pesan langsung muncul tanpa satu putaran render yang gagal lebih dulu.
    if (source.kind === 'hls' && !supportsNativeHls() && !Hls.isSupported()) {
        return (
            <PlayerMessage message="Peramban ini tidak mendukung pemutaran HLS." />
        );
    }

    if (error) {
        return <PlayerMessage message={error} />;
    }

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full bg-black"
            onMouseMove={revealControls}
            onDoubleClick={toggleFullscreen}
        >
            {/*
                Jangan pasang crossOrigin di sini. Internet Archive mengalihkan
                unduhan ke server simpul yang balasannya tidak membawa header
                Access-Control-Allow-Origin, jadi permintaan bermode CORS selalu
                gagal. Takarir aman tanpa atribut itu karena disajikan dari asal
                yang sama lewat /api/subtitles/stream.
            */}
            <video
                ref={videoRef}
                className="h-full w-full"
                poster={source.poster ?? undefined}
                playsInline
                onClick={togglePlay}
            >
                {subtitle && (
                    <track
                        key={subtitle.url}
                        kind="subtitles"
                        src={subtitle.url}
                        label={subtitle.label}
                        srcLang={subtitle.language}
                        default
                    />
                )}
            </video>

            {isLoading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
            )}

            {!isPlaying && !isLoading && (
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Putar"
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
                        <Play
                            className="ml-1 h-10 w-10 text-white"
                            fill="currentColor"
                        />
                    </span>
                </button>
            )}

            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pt-16 pb-5 transition-opacity duration-300',
                    showControls
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
            >
                {title && (
                    <p className="mb-3 truncate text-sm font-semibold text-white">
                        {title}
                    </p>
                )}

                <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Posisi pemutaran"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(currentTime)}
                    className="relative mb-4 h-1.5 cursor-pointer rounded-full bg-white/25"
                    onClick={(event) => {
                        const rect =
                            event.currentTarget.getBoundingClientRect();
                        seekTo((event.clientX - rect.left) / rect.width);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft') {
                            seekBy(-SEEK_STEP_SECONDS);
                        }

                        if (event.key === 'ArrowRight') {
                            seekBy(SEEK_STEP_SECONDS);
                        }
                    }}
                >
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                        style={{ width: `${bufferedRatio * 100}%` }}
                    />
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-red-600"
                        style={{ width: `${progressRatio * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={isPlaying ? 'Jeda' : 'Putar'}
                            className="text-white transition hover:text-zinc-300"
                        >
                            {isPlaying ? (
                                <Pause
                                    className="h-6 w-6"
                                    fill="currentColor"
                                />
                            ) : (
                                <Play className="h-6 w-6" fill="currentColor" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => seekBy(-SEEK_STEP_SECONDS)}
                            aria-label="Mundur 10 detik"
                            className="text-white transition hover:text-zinc-300"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => seekBy(SEEK_STEP_SECONDS)}
                            aria-label="Maju 10 detik"
                            className="text-white transition hover:text-zinc-300"
                        >
                            <RotateCw className="h-5 w-5" />
                        </button>

                        <div className="group flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={
                                    isMuted ? 'Nyalakan suara' : 'Bisukan'
                                }
                                className="text-white transition hover:text-zinc-300"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="h-5 w-5" />
                                ) : volume < 0.5 ? (
                                    <Volume1 className="h-5 w-5" />
                                ) : (
                                    <Volume2 className="h-5 w-5" />
                                )}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={isMuted ? 0 : volume}
                                aria-label="Volume"
                                onChange={(event) =>
                                    changeVolume(Number(event.target.value))
                                }
                                className="h-1 w-0 cursor-pointer accent-red-600 transition-all duration-300 group-hover:w-24 focus:w-24"
                            />
                        </div>

                        <span className="text-xs font-medium text-zinc-300 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {audioTracks.length > 1 && (
                            <select
                                aria-label="Jalur audio"
                                value={activeAudioTrack}
                                onChange={(event) =>
                                    switchAudioTrack(Number(event.target.value))
                                }
                                className="rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-white"
                            >
                                {audioTracks.map((track) => (
                                    <option key={track.id} value={track.id}>
                                        {track.name} ({track.lang})
                                    </option>
                                ))}
                            </select>
                        )}

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={
                                isFullscreen
                                    ? 'Keluar layar penuh'
                                    : 'Layar penuh'
                            }
                            className="text-white transition hover:text-zinc-300"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-5 w-5" />
                            ) : (
                                <Maximize className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00';
    }

    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const padded = (value: number) => value.toString().padStart(2, '0');

    return hours > 0
        ? `${hours}:${padded(minutes)}:${padded(secs)}`
        : `${minutes}:${padded(secs)}`;
}

function PlayerMessage({ message }: { message: string }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black px-8 text-center">
            <p className="text-lg font-semibold text-red-500">{message}</p>
            <p className="text-sm text-zinc-400">
                Coba sumber lain, atau periksa apakah berkas masih ada di
                pustaka.
            </p>
        </div>
    );
}
