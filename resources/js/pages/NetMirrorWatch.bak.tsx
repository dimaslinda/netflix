import { Head } from '@inertiajs/react';
import Hls from 'hls.js';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    Headphones,
    Maximize,
    Minimize,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    RotateCw,
    Settings2,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NetMirrorWatchProps {
    contentId: string;
}

interface AudioTrack {
    id: number;
    name: string;
    lang: string;
}

export default function NetMirrorWatch({ contentId }: NetMirrorWatchProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('NetMirror');

    // Player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);

    // Fetch stream URL
    const fetchStream = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/stream/proxied?tmdb_id=${contentId}&type=movie`,
            );
            const data = await response.json();

            if (data.success && data.data?.playlistUrl) {
                setStreamUrl(data.data.playlistUrl);
                setTitle(data.data.title || 'NetMirror');
            } else {
                setError(data.error || 'Failed to get stream');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (contentId) {
            fetchStream();
        }
    }, [contentId]);

    // Initialize HLS.js
    useEffect(() => {
        if (!streamUrl || !videoRef.current) return;

        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                fragLoadingMaxRetry: 5,
                manifestLoadingMaxRetry: 5,
                xhrSetup: (xhr) => {
                    xhr.withCredentials = false;
                },
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                const tracks = hls.audioTracks.map((t, i) => ({
                    id: i,
                    name: t.name || `Audio ${i + 1}`,
                    lang: t.lang || 'unknown',
                }));
                setAudioTracks(tracks);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        setError('Stream error: ' + data.details);
                    }
                }
            });

            return () => hls.destroy();
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => setIsLoading(false));
        }
    }, [streamUrl]);

    // Video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, []);

    // Fullscreen listener
    useEffect(() => {
        const handleFullscreen = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreen);
        return () =>
            document.removeEventListener('fullscreenchange', handleFullscreen);
    }, []);

    // Controls activity
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleActivity = () => {
            setShowControls(true);
            clearTimeout(timeout);
            if (isPlaying) {
                timeout = setTimeout(() => setShowControls(false), 3500);
            }
        };

        const container = containerRef.current;
        container?.addEventListener('mousemove', handleActivity);
        container?.addEventListener('mousedown', handleActivity);
        return () => {
            container?.removeEventListener('mousemove', handleActivity);
            container?.removeEventListener('mousedown', handleActivity);
            clearTimeout(timeout);
        };
    }, [isPlaying]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pct * duration;
    };

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) document.exitFullscreen();
            else containerRef.current.requestFullscreen();
        }
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
            : `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleBack = () => window.history.back();

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 overflow-hidden bg-black font-sans text-white select-none"
        >
            <Head title={`Watching ${title}`} />

            {/* Video Element */}
            <video
                ref={videoRef}
                className="h-full w-full object-contain"
                onClick={togglePlay}
                playsInline
                autoPlay
            />

            {/* 1. Header (Top Row) */}
            <div
                className={`absolute inset-x-0 top-0 z-50 bg-linear-to-b from-black/70 via-black/30 to-transparent p-6 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
            >
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleBack}
                        className="-m-2 p-2 transition hover:text-zinc-300"
                    >
                        <ArrowLeft className="h-8 w-8" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <span className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
                            Watching Now
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Middle Controls (Play/Rewind/Forward) */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center gap-12 transition-opacity duration-300 md:gap-24 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                <button
                    onClick={() => skip(-10)}
                    className="group transition active:scale-95"
                >
                    <RotateCcw className="h-10 w-10 fill-white/10 text-white transition-transform group-hover:scale-110 md:h-14 md:w-14" />
                    <span className="mt-2 block text-center text-xs font-bold">
                        10
                    </span>
                </button>

                <button
                    onClick={togglePlay}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-90 md:h-28 md:w-28"
                >
                    {isPlaying ? (
                        <Pause className="h-10 w-10 fill-current md:h-14 md:w-14" />
                    ) : (
                        <Play className="ml-2 h-10 w-10 fill-current md:h-14 md:w-14" />
                    )}
                </button>

                <button
                    onClick={() => skip(10)}
                    className="group transition active:scale-95"
                >
                    <RotateCw className="h-10 w-10 fill-white/10 text-white transition-transform group-hover:scale-110 md:h-14 md:w-14" />
                    <span className="mt-2 block text-center text-xs font-bold">
                        10
                    </span>
                </button>
            </div>

            {/* 3. Bottom Controls */}
            <div
                className={`absolute inset-x-0 bottom-0 z-50 bg-linear-to-t from-black/90 via-black/40 to-transparent px-6 pt-24 pb-8 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
            >
                {/* Progress Bar */}
                <div className="group relative mb-6 flex items-center">
                    <div
                        className="h-1 w-full cursor-pointer rounded-full bg-zinc-600 transition-all group-hover:h-2"
                        onClick={handleSeek}
                    >
                        <div
                            className="relative h-full rounded-full bg-red-600"
                            style={{
                                width: `${(currentTime / duration) * 100 || 0}%`,
                            }}
                        >
                            <div className="absolute top-1/2 right-[-8px] h-4 w-4 -translate-y-1/2 scale-0 rounded-full bg-red-600 opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
                        </div>
                    </div>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={togglePlay}
                            className="transition hover:scale-110"
                        >
                            {isPlaying ? (
                                <Pause className="h-7 w-7 fill-current" />
                            ) : (
                                <Play className="h-7 w-7 fill-current" />
                            )}
                        </button>

                        <div className="group flex items-center gap-4">
                            <button
                                onClick={toggleMute}
                                className="transition hover:scale-110"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="h-7 w-7" />
                                ) : (
                                    <Volume2 className="h-7 w-7" />
                                )}
                            </button>
                            {/* Volume Slider visible on hover or mobile? */}
                        </div>

                        <span className="text-[15px] font-medium tracking-wide">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Audio & Subtitles selector */}
                        {audioTracks.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowAudioMenu(!showAudioMenu)
                                    }
                                    className="rounded-md p-1 transition hover:bg-white/10"
                                >
                                    <Headphones className="h-6 w-6" />
                                </button>
                                {showAudioMenu && (
                                    <div className="absolute right-0 bottom-full mb-4 min-w-[220px] overflow-hidden rounded-lg border border-zinc-700 bg-[#181818] py-2 shadow-2xl">
                                        <div className="border-b border-zinc-800 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                                            Audio Tracks
                                        </div>
                                        {audioTracks.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    if (hlsRef.current)
                                                        hlsRef.current.audioTrack =
                                                            t.id;
                                                    setCurrentAudioTrack(t.id);
                                                    setShowAudioMenu(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-zinc-800 ${t.id === currentAudioTrack ? 'font-bold text-white' : 'text-zinc-400'}`}
                                            >
                                                <span>{t.name}</span>
                                                {t.id === currentAudioTrack && (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="transition hover:scale-110">
                            <Settings2 className="h-6 w-6" />
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="transition hover:scale-110"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-7 w-7" />
                            ) : (
                                <Maximize className="h-7 w-7" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Loading State */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center">
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-red-600" />
                        </div>
                        <span className="mt-6 animate-pulse text-sm font-bold tracking-widest text-red-600 uppercase">
                            Loading Stream
                        </span>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 px-4">
                    <div className="w-full max-w-md text-center">
                        <AlertCircle className="mx-auto mb-6 h-16 w-16 text-red-600" />
                        <h2 className="mb-2 text-2xl font-bold">
                            Something went wrong
                        </h2>
                        <p className="mb-8 text-zinc-400">{error}</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={fetchStream}
                                className="flex items-center gap-2 rounded bg-white px-8 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </button>
                            <button
                                onClick={handleBack}
                                className="rounded bg-zinc-700 px-8 py-2.5 text-sm font-bold transition hover:bg-zinc-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
