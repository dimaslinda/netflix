import Hls from 'hls.js';
import {
    Headphones,
    Loader2,
    Play,
    Settings,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AudioTrack {
    id: number;
    name: string;
    lang: string;
}

interface HlsPlayerProps {
    src: string;
    title?: string;
    poster?: string;
    onError?: (error: string) => void;
    onReady?: () => void;
}

export default function HlsPlayer({
    src,
    title,
    poster,
    onError,
    onReady,
}: HlsPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!src || !videoRef.current) return;

        const video = videoRef.current;

        // Check if HLS is supported
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                onReady?.();

                // Get audio tracks
                const tracks = hls.audioTracks.map((track, idx) => ({
                    id: idx,
                    name: track.name || `Track ${idx + 1}`,
                    lang: track.lang || 'unknown',
                }));
                setAudioTracks(tracks);
            });

            hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
                setCurrentAudioTrack(data.id);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    const errorMsg = `Stream error: ${data.type}`;
                    setError(errorMsg);
                    onError?.(errorMsg);
                }
            });

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                onReady?.();
            });
        } else {
            queueMicrotask(() => {
                setError('HLS is not supported in this browser');
                onError?.('HLS is not supported in this browser');
            });
        }
    }, [src, onError, onReady]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

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

        const container = containerRef.current;
        container?.addEventListener('mousemove', handleMouseMove);

        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isPlaying]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const switchAudioTrack = (trackId: number) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = trackId;
        }
        setShowAudioMenu(false);
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

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * duration;
    };

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <div className="text-center">
                    <p className="text-lg text-red-500">{error}</p>
                    <p className="mt-2 text-sm text-zinc-400">
                        Try using an alternative source
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full bg-black"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="h-full w-full"
                poster={poster}
                playsInline
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-500" />
                        <p className="mt-4 text-white">
                            Loading multi-audio stream...
                        </p>
                    </div>
                </div>
            )}

            {/* Play Button Overlay */}
            {!isPlaying && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
                        onClick={togglePlay}
                    >
                        <Play
                            className="ml-1 h-10 w-10 text-white"
                            fill="white"
                        />
                    </button>
                </div>
            )}

            {/* Controls */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${
                    showControls ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                {title && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-lg font-medium text-white">
                            {title}
                        </span>
                        {audioTracks.length > 1 && (
                            <span className="rounded bg-green-600/30 px-2 py-0.5 text-xs text-green-400">
                                🎧 Multi-Audio
                            </span>
                        )}
                    </div>
                )}

                {/* Progress Bar */}
                <div
                    className="mb-4 h-1 cursor-pointer rounded bg-zinc-600"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full rounded bg-red-600"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="text-white transition hover:text-zinc-300"
                            onClick={togglePlay}
                        >
                            <Play
                                className={`h-6 w-6 ${isPlaying ? 'hidden' : ''}`}
                                fill="white"
                            />
                            {isPlaying && (
                                <div className="flex gap-1">
                                    <div className="h-6 w-2 rounded bg-white" />
                                    <div className="h-6 w-2 rounded bg-white" />
                                </div>
                            )}
                        </button>

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

                        <span className="text-sm text-white">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Audio Track Selector */}
                        {audioTracks.length > 1 && (
                            <div className="relative">
                                <button
                                    className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700"
                                    onClick={() =>
                                        setShowAudioMenu(!showAudioMenu)
                                    }
                                >
                                    <Headphones className="h-4 w-4" />
                                    {audioTracks[
                                        currentAudioTrack
                                    ]?.lang?.toUpperCase() || 'Audio'}
                                </button>

                                {showAudioMenu && (
                                    <div className="absolute right-0 bottom-full mb-2 rounded bg-zinc-900 py-1 shadow-xl">
                                        {audioTracks.map((track) => (
                                            <button
                                                key={track.id}
                                                className={`block w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 ${
                                                    track.id ===
                                                    currentAudioTrack
                                                        ? 'bg-zinc-800'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    switchAudioTrack(track.id)
                                                }
                                            >
                                                {track.name} ({track.lang})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="text-white transition hover:text-zinc-300">
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
