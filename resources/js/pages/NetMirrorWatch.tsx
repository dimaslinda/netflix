import { Head } from '@inertiajs/react';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Headphones, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

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

    // Fetch stream URL
    const fetchStream = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/stream/proxied?id=${contentId}`);
            const data = await response.json();

            console.log('Stream response:', data);

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

    // Initialize HLS.js player
    useEffect(() => {
        if (!streamUrl || !videoRef.current) return;

        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                // More fault-tolerant settings
                fragLoadingMaxRetry: 3,
                manifestLoadingMaxRetry: 3,
                levelLoadingMaxRetry: 3,
                fragLoadingRetryDelay: 1000,
                // Don't fail on audio track errors
                startLevel: -1, // Auto-select level
                abrEwmaDefaultEstimate: 500000,
                xhrSetup: (xhr) => {
                    xhr.withCredentials = false;
                },
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed');
                setIsLoading(false);

                // Get audio tracks
                const tracks = hls.audioTracks.map((t, i) => ({
                    id: i,
                    name: t.name || `Audio ${i + 1}`,
                    lang: t.lang || 'unknown',
                }));
                setAudioTracks(tracks);
                console.log('Audio tracks:', tracks);
            });

            hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
                setCurrentAudioTrack(data.id);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        setError('Network error - stream may be unavailable');
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        // Try to recover
                        hls.recoverMediaError();
                    } else {
                        setError('Stream error: ' + data.details);
                    }
                }
            });

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => setIsLoading(false));
        } else {
            setError('HLS not supported in this browser');
        }
    }, [streamUrl]);

    // Video event listeners
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

    // Auto-hide controls
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            if (isPlaying) {
                timeout = setTimeout(() => setShowControls(false), 3000);
            }
        };

        const container = containerRef.current;
        container?.addEventListener('mousemove', handleMove);
        return () => {
            container?.removeEventListener('mousemove', handleMove);
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

    const switchAudio = (id: number) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = id;
        }
        setShowAudioMenu(false);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pct * duration;
    };

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
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
        <div ref={containerRef} className="fixed inset-0 bg-black text-white">
            <Head title={`Watch - ${title}`} />

            {/* Header */}
            <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="flex items-center gap-2 rounded-lg bg-zinc-800/80 backdrop-blur px-4 py-2 text-sm transition hover:bg-zinc-700">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-10 flex items-center justify-center rounded bg-gradient-to-br from-purple-600 to-pink-500 text-xs font-bold">NM</div>
                        <span className="text-sm font-medium">{title}</span>
                        {audioTracks.length > 1 && (
                            <span className="rounded-full bg-green-600/30 px-2 py-0.5 text-[10px] text-green-400">🎧 Multi-Audio</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-16 w-16 animate-spin text-purple-500" />
                        <p className="mt-4 text-lg">Loading stream...</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/90">
                    <div className="text-center max-w-md px-4">
                        <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
                        <h2 className="mt-4 text-xl font-semibold">Stream Error</h2>
                        <p className="mt-2 text-zinc-400">{error}</p>
                        <div className="mt-6 flex gap-3 justify-center">
                            <button onClick={fetchStream} className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 font-semibold transition hover:bg-purple-700">
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                            <button onClick={handleBack} className="rounded-lg bg-zinc-700 px-6 py-2.5 font-semibold transition hover:bg-zinc-600">
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video */}
            <video
                ref={videoRef}
                className="h-full w-full"
                onClick={togglePlay}
                playsInline
            />

            {/* Play button overlay */}
            {!isPlaying && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button onClick={togglePlay} className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                        <Play className="h-10 w-10 ml-1" fill="white" />
                    </button>
                </div>
            )}

            {/* Controls */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Progress */}
                <div onClick={handleSeek} className="mb-4 h-1.5 cursor-pointer rounded-full bg-zinc-600 group">
                    <div className="h-full rounded-full bg-red-600 relative" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200">
                            {isPlaying ? <Pause className="h-5 w-5" fill="black" /> : <Play className="h-5 w-5 ml-0.5" fill="black" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-zinc-300">
                            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                        </button>
                        <span className="text-sm font-medium">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Audio selector */}
                        {audioTracks.length > 1 && (
                            <div className="relative">
                                <button onClick={() => setShowAudioMenu(!showAudioMenu)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium transition hover:bg-purple-700">
                                    <Headphones className="h-4 w-4" />
                                    {audioTracks[currentAudioTrack]?.lang?.toUpperCase() || 'Audio'}
                                </button>
                                {showAudioMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 min-w-[180px] rounded-lg bg-zinc-900 py-2 shadow-2xl border border-zinc-700">
                                        <p className="px-4 py-1 text-xs text-zinc-500 uppercase">Audio Track</p>
                                        {audioTracks.map((t) => (
                                            <button key={t.id} onClick={() => switchAudio(t.id)} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-zinc-800 ${t.id === currentAudioTrack ? 'bg-purple-600/20 text-purple-400' : ''}`}>
                                                <span className="flex-1">{t.name}</span>
                                                <span className="text-xs text-zinc-500">{t.lang.toUpperCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={toggleFullscreen} className="text-white hover:text-zinc-300">
                            <Maximize className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
