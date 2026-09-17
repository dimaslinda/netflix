import {
    Headphones,
    Loader2,
    Maximize,
    Pause,
    Play,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AudioTrack {
    id: number;
    name: string;
    language: string;
}

interface JwPlayerProps {
    src: string;
    title?: string;
    poster?: string;
    onError?: (error: string) => void;
    onReady?: () => void;
}

interface JwTrack {
    name?: string;
    language?: string;
}

interface JwTimeEvent {
    position: number;
    duration: number;
}

interface JwAudioTrackEvent {
    currentTrack: number;
}

interface JwErrorEvent {
    message?: string;
}

interface JwPlayerInstance {
    setup: (config: Record<string, unknown>) => JwPlayerInstance;
    on: (event: string, callback: (data?: unknown) => void) => void;
    getAudioTracks: () => JwTrack[] | undefined;
    setCurrentAudioTrack: (index: number) => void;
    play: () => void;
    pause: () => void;
    seek: (position: number) => void;
    setMute: (muted: boolean) => void;
    setVolume: (volume: number) => void;
    setFullscreen: (state: boolean) => void;
    remove: () => void;
}

declare global {
    interface Window {
        jwplayer?: (element: HTMLElement) => JwPlayerInstance;
    }
}

export default function JwPlayer({
    src,
    title,
    poster,
    onError,
    onReady,
}: JwPlayerProps) {
    const playerRef = useRef<HTMLDivElement>(null);
    const jwPlayerInstance = useRef<JwPlayerInstance | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [jwLoaded, setJwLoaded] = useState(false);

    // Load JWPlayer script
    useEffect(() => {
        if (window.jwplayer) {
            queueMicrotask(() => setJwLoaded(true));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jwplayer.com/libraries/IDzF9Zmk.js'; // Free player key
        script.async = true;
        script.onload = () => setJwLoaded(true);
        script.onerror = () => {
            setError('Failed to load video player');
            onError?.('Failed to load JWPlayer');
        };
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [onError]);

    // Initialize player when script is loaded
    useEffect(() => {
        if (!jwLoaded || !playerRef.current || !src || !window.jwplayer) return;

        try {
            jwPlayerInstance.current = window
                .jwplayer(playerRef.current)
                .setup({
                    file: src,
                    image: poster,
                    width: '100%',
                    height: '100%',
                    autostart: false,
                    mute: false,
                    controls: false, // We use custom controls
                    stretching: 'uniform',
                    preload: 'auto',
                });

            const player = jwPlayerInstance.current;

            player.on('ready', () => {
                setIsLoading(false);
                onReady?.();

                // Get audio tracks
                const tracks = player.getAudioTracks() || [];
                setAudioTracks(
                    tracks.map((t, idx: number) => ({
                        id: idx,
                        name: t.name || `Audio ${idx + 1}`,
                        language: t.language || 'unknown',
                    })),
                );
            });

            player.on('play', () => setIsPlaying(true));
            player.on('pause', () => setIsPlaying(false));
            player.on('time', (data?: unknown) => {
                const e = (data as JwTimeEvent) || { position: 0, duration: 0 };
                setCurrentTime(e.position);
                setDuration(e.duration);
            });
            player.on('audioTrackChanged', (data?: unknown) => {
                const e = (data as JwAudioTrackEvent) || { currentTrack: 0 };
                setCurrentAudioTrack(e.currentTrack);
            });
            player.on('error', (data?: unknown) => {
                const e = (data as JwErrorEvent) || {};
                const msg = e.message || 'Playback error';
                setError(msg);
                onError?.(msg);
            });
        } catch (e: unknown) {
            const err = e instanceof Error ? e.message : 'Failed to initialize player';
            queueMicrotask(() => {
                setError('Failed to initialize player');
                onError?.(err);
            });
        }

        return () => {
            if (jwPlayerInstance.current) {
                jwPlayerInstance.current.remove();
            }
        };
    }, [jwLoaded, src, poster, onError, onReady]);

    // Auto-hide controls
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            if (isPlaying) {
                timeout = setTimeout(() => setShowControls(false), 3000);
            }
        };

        const container = playerRef.current?.parentElement;
        container?.addEventListener('mousemove', handleMouseMove);

        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isPlaying]);

    const togglePlay = () => {
        if (jwPlayerInstance.current) {
            if (isPlaying) {
                jwPlayerInstance.current.pause();
            } else {
                jwPlayerInstance.current.play();
            }
        }
    };

    const toggleMute = () => {
        if (jwPlayerInstance.current) {
            jwPlayerInstance.current.setMute(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const switchAudioTrack = (trackId: number) => {
        if (jwPlayerInstance.current) {
            jwPlayerInstance.current.setCurrentAudioTrack(trackId);
        }
        setShowAudioMenu(false);
    };

    const toggleFullscreen = () => {
        if (jwPlayerInstance.current) {
            jwPlayerInstance.current.setFullscreen(true);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!jwPlayerInstance.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        jwPlayerInstance.current.seek(percent * duration);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <div className="text-center">
                    <p className="mb-2 text-lg text-red-500">Playback Error</p>
                    <p className="text-sm text-zinc-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-black">
            {/* JWPlayer Container */}
            <div
                ref={playerRef}
                className="h-full w-full"
                onClick={togglePlay}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-500" />
                        <p className="mt-4 text-white">
                            Loading multi-audio stream...
                        </p>
                    </div>
                </div>
            )}

            {/* Custom Controls Overlay */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-20 transition-opacity duration-300 ${
                    showControls
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title & Multi-Audio Badge */}
                {title && (
                    <div className="mb-4 flex items-center gap-3">
                        <span className="text-xl font-bold text-white">
                            {title}
                        </span>
                        {audioTracks.length > 1 && (
                            <span className="flex items-center gap-1 rounded-full bg-green-600/30 px-3 py-1 text-xs font-medium text-green-400">
                                <Headphones className="h-3 w-3" />
                                {audioTracks.length} Audio Tracks
                            </span>
                        )}
                    </div>
                )}

                {/* Progress Bar */}
                <div
                    className="group mb-4 h-1.5 cursor-pointer rounded-full bg-zinc-600"
                    onClick={handleSeek}
                >
                    <div
                        className="relative h-full rounded-full bg-red-600"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                        <div className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 rounded-full bg-red-600 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Play/Pause */}
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200"
                            onClick={togglePlay}
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" fill="black" />
                            ) : (
                                <Play className="ml-0.5 h-5 w-5" fill="black" />
                            )}
                        </button>

                        {/* Mute */}
                        <button
                            className="text-white transition hover:text-zinc-300"
                            onClick={toggleMute}
                        >
                            {isMuted ? (
                                <VolumeX className="h-6 w-6" />
                            ) : (
                                <Volume2 className="h-6 w-6" />
                            )}
                        </button>

                        {/* Time */}
                        <span className="text-sm font-medium text-white">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Audio Track Selector */}
                        {audioTracks.length > 1 && (
                            <div className="relative">
                                <button
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                                    onClick={() =>
                                        setShowAudioMenu(!showAudioMenu)
                                    }
                                >
                                    <Headphones className="h-4 w-4" />
                                    {audioTracks[
                                        currentAudioTrack
                                    ]?.language?.toUpperCase() || 'Audio'}
                                </button>

                                {showAudioMenu && (
                                    <div className="absolute right-0 bottom-full mb-2 min-w-[180px] rounded-lg border border-zinc-700 bg-zinc-900 py-2 shadow-2xl">
                                        <p className="px-4 py-1 text-xs tracking-wider text-zinc-500 uppercase">
                                            Audio Track
                                        </p>
                                        {audioTracks.map((track) => (
                                            <button
                                                key={track.id}
                                                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-zinc-800 ${
                                                    track.id ===
                                                    currentAudioTrack
                                                        ? 'bg-purple-600/20 text-purple-400'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    switchAudioTrack(track.id)
                                                }
                                            >
                                                <span className="flex-1">
                                                    {track.name}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {track.language.toUpperCase()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fullscreen */}
                        <button
                            className="text-white transition hover:text-zinc-300"
                            onClick={toggleFullscreen}
                        >
                            <Maximize className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
