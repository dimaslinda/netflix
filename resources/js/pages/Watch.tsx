import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    ChevronDown,
    Languages,
    Loader2,
    Maximize,
    Minimize,
    Play,
    RotateCcw,
    SkipBack,
    SkipForward,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { TmdbDetails, TmdbSeasonDetails } from '@/types/tmdb';

interface WatchProps {
    type: 'movie' | 'tv';
    id: string;
    season?: string;
    episode?: string;
    title?: string;
    source?: 'vidlink' | 'vidsrc';
}

interface Subtitle {
    id: number;
    file_id: number;
    file_name: string;
    language: string;
    language_name: string;
    release: string;
    download_count: number;
    ratings: number;
    from_trusted: boolean;
    hearing_impaired: boolean;
    uploader: string;
    fps: number | null;
    download_url?: string; // SubDL provides direct download URL
}

// VidLink with optional external subtitle support
const getEmbedUrl = (
    type: 'movie' | 'tv',
    id: string,
    season: string,
    episode: string,
    subtitleUrl?: string,
    subtitleLabel?: string,
): string => {
    const params = new URLSearchParams({
        primaryColor: 'e50914',
        secondaryColor: '141414',
        iconColor: 'ffffff',
        icons: 'default',
        player: 'default',
        title: 'false',
        poster: 'true',
        autoplay: 'true',
    });

    // Add external subtitle if provided
    if (subtitleUrl) {
        params.set('sub_file', subtitleUrl);
        params.set('sub_label', subtitleLabel || 'External');
    }

    if (type === 'tv') {
        return `https://vidlink.pro/tv/${id}/${season}/${episode}?${params.toString()}`;
    }
    return `https://vidlink.pro/movie/${id}?${params.toString()}`;
};

// 2embed URL - better content coverage
const getVidSrcUrl = (
    type: 'movie' | 'tv',
    id: string,
    season: string,
    episode: string,
): string => {
    if (type === 'tv') {
        return `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
    }
    return `https://www.2embed.cc/embed/${id}`;
};

export default function Watch({
    type,
    id,
    season: initialSeason = '1',
    episode: initialEpisode = '1',
    title: propTitle,
    source: initialSource = 'vidlink',
}: WatchProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTopBar, setShowTopBar] = useState(true);
    const [showBottomBar, setShowBottomBar] = useState(true);
    const [showEpisodePanel, setShowEpisodePanel] = useState(false);
    const [showSubtitlePanel, setShowSubtitlePanel] = useState(false);

    // Source state  
    const [currentSource, setCurrentSource] = useState<'vidlink' | 'vidsrc'>(initialSource);

    // Episode navigation state
    const [currentSeason, setCurrentSeason] = useState(initialSeason);
    const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

    // Content details
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [seasonDetails, setSeasonDetails] =
        useState<TmdbSeasonDetails | null>(null);
    const [seasonLoading, setSeasonLoading] = useState(false);

    // Subtitle state
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [subtitlesLoading, setSubtitlesLoading] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(
        null,
    );
    const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>();
    const [subtitleLabel, setSubtitleLabel] = useState<string | undefined>();
    const [downloadingSubId, setDownloadingSubId] = useState<number | null>(
        null,
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Choose embed URL based on source
    const embedUrl = currentSource === 'vidsrc'
        ? getVidSrcUrl(type, id, currentSeason, currentEpisode)
        : getEmbedUrl(type, id, currentSeason, currentEpisode, subtitleUrl, subtitleLabel);

    const title =
        details?.name || details?.title || propTitle || 'Now Playing';
    const currentEpisodeData = seasonDetails?.episodes?.find(
        (ep) => ep.episode_number === parseInt(currentEpisode),
    );

    // Fetch content details
    useEffect(() => {
        fetch(`/api/tmdb/${type}/${id}`)
            .then((r) => r.json())
            .then((data) => setDetails(data))
            .catch(() => { });
    }, [type, id]);

    // Fetch season details for TV shows
    useEffect(() => {
        if (type !== 'tv') return;

        setSeasonLoading(true);
        fetch(`/api/tmdb/tv/${id}/season/${currentSeason}`)
            .then((r) => r.json())
            .then((data: TmdbSeasonDetails) => {
                setSeasonDetails(data);
            })
            .catch(() => { })
            .finally(() => setSeasonLoading(false));
    }, [type, id, currentSeason]);

    // Fetch available subtitles
    useEffect(() => {
        setSubtitlesLoading(true);
        const params = new URLSearchParams({
            tmdb_id: id,
            type: type,
        });

        if (type === 'tv') {
            params.set('season', currentSeason);
            params.set('episode', currentEpisode);
        }

        fetch(`/api/subtitles/search?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setSubtitles(data.data || []);
                }
            })
            .catch(() => { })
            .finally(() => setSubtitlesLoading(false));
    }, [type, id, currentSeason, currentEpisode]);

    // Handle mouse position for showing/hiding bars
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const y = e.clientY - rect.top;
            const height = rect.height;

            // Top 15% of screen - show top bar
            const isInTopZone = y < height * 0.15;
            // Bottom 20% of screen - show bottom bar
            const isInBottomZone = y > height * 0.8;

            if (isInTopZone) {
                setShowTopBar(true);
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
            } else if (!showEpisodePanel && !showSubtitlePanel) {
                // Auto-hide top bar after a delay if not in top zone
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
                hideTimeoutRef.current = setTimeout(() => {
                    setShowTopBar(false);
                }, 2000);
            }

            if (isInBottomZone) {
                setShowBottomBar(true);
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
            } else {
                // Auto-hide bottom bar after a delay if not in bottom zone
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
                hideTimeoutRef.current = setTimeout(() => {
                    setShowBottomBar(false);
                }, 2000);
            }
        },
        [showEpisodePanel, showSubtitlePanel],
    );

    const handleMouseLeave = useCallback(() => {
        if (!showEpisodePanel && !showSubtitlePanel) {
            hideTimeoutRef.current = setTimeout(() => {
                setShowTopBar(false);
                setShowBottomBar(false);
            }, 1000);
        }
    }, [showEpisodePanel, showSubtitlePanel]);

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    // Fullscreen handling
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            }
            if (e.key === 'Escape') {
                setShowEpisodePanel(false);
                setShowSubtitlePanel(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleFullscreen]);

    // Episode navigation
    const goToEpisode = (season: number, episode: number) => {
        const newSeason = season.toString();
        const newEpisode = episode.toString();
        setCurrentSeason(newSeason);
        setCurrentEpisode(newEpisode);
        setIsLoading(true);

        // Reset subtitle when changing episode
        setSelectedSubtitle(null);
        setSubtitleUrl(undefined);
        setSubtitleLabel(undefined);

        const url = `/watch/tv/${id}?season=${newSeason}&episode=${newEpisode}`;
        window.history.replaceState({}, '', url);

        setShowEpisodePanel(false);
    };

    const goToPreviousEpisode = () => {
        if (!seasonDetails) return;

        const currentEp = parseInt(currentEpisode);
        if (currentEp > 1) {
            goToEpisode(parseInt(currentSeason), currentEp - 1);
        } else if (parseInt(currentSeason) > 1) {
            const prevSeason = parseInt(currentSeason) - 1;
            fetch(`/api/tmdb/tv/${id}/season/${prevSeason}`)
                .then((r) => r.json())
                .then((data: TmdbSeasonDetails) => {
                    const lastEp = data.episodes?.length || 1;
                    goToEpisode(prevSeason, lastEp);
                });
        }
    };

    const goToNextEpisode = () => {
        if (!seasonDetails) return;

        const currentEp = parseInt(currentEpisode);
        const totalEpisodes = seasonDetails.episodes?.length || 0;
        const totalSeasons = details?.number_of_seasons || 1;

        if (currentEp < totalEpisodes) {
            goToEpisode(parseInt(currentSeason), currentEp + 1);
        } else if (parseInt(currentSeason) < totalSeasons) {
            goToEpisode(parseInt(currentSeason) + 1, 1);
        }
    };

    // Select and apply subtitle
    const selectSubtitle = async (subtitle: Subtitle) => {
        setDownloadingSubId(subtitle.file_id);

        try {
            // SubDL provides direct download URL - use it if available
            if (subtitle.download_url) {
                setSelectedSubtitle(subtitle);
                setSubtitleUrl(subtitle.download_url);
                setSubtitleLabel(subtitle.language_name);
                setIsLoading(true);
                setShowSubtitlePanel(false);
                setDownloadingSubId(null);
                return;
            }

            // Fallback: fetch download URL from API
            const response = await fetch('/api/subtitles/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ url: subtitle.download_url || '' }),
            });

            const data = await response.json();

            if (data.success && data.data?.link) {
                setSelectedSubtitle(subtitle);
                setSubtitleUrl(data.data.link);
                setSubtitleLabel(subtitle.language_name);
                setIsLoading(true);
                setShowSubtitlePanel(false);
            } else {
                alert(
                    data.message || 'Failed to load subtitle. Please try again.',
                );
            }
        } catch (error) {
            console.error('Subtitle download error:', error);
            alert('Failed to load subtitle. Please try again.');
        } finally {
            setDownloadingSubId(null);
        }
    };

    // Remove subtitle
    const removeSubtitle = () => {
        setSelectedSubtitle(null);
        setSubtitleUrl(undefined);
        setSubtitleLabel(undefined);
        setIsLoading(true);
    };

    const goBack = () => {
        window.history.back();
    };

    const retry = () => {
        setHasError(false);
        setIsLoading(true);
    };

    // Group subtitles by language
    const subtitlesByLanguage = subtitles.reduce(
        (acc, sub) => {
            if (!acc[sub.language_name]) {
                acc[sub.language_name] = [];
            }
            acc[sub.language_name].push(sub);
            return acc;
        },
        {} as Record<string, Subtitle[]>,
    );

    return (
        <div
            ref={containerRef}
            className="relative h-screen w-screen overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <Head title={title ? `Watch - ${title}` : 'Watch'} />

            {/* Video Player (iframe) - Full screen, clickable for VidLink controls */}
            <div className="absolute inset-0">
                <iframe
                    key={embedUrl}
                    src={embedUrl}
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="origin"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-700 border-t-red-600" />
                    </div>
                    <p className="mt-4 text-zinc-400">Loading video...</p>
                </div>
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black">
                    <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
                    <h2 className="mb-2 text-xl font-bold text-white">
                        Unable to load video
                    </h2>
                    <p className="mb-6 text-zinc-400">
                        Content may not be available at this time
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={retry}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Try Again
                        </button>
                        <button
                            onClick={goBack}
                            className="rounded-lg bg-zinc-700 px-6 py-3 font-semibold text-white transition hover:bg-zinc-600"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            )}

            {/* TOP BAR - Only covers top area, does not block middle */}
            <div
                className={cn(
                    'absolute top-0 right-0 left-0 z-30 transition-all duration-300',
                    showTopBar
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none -translate-y-full opacity-0',
                )}
                onMouseEnter={() => setShowTopBar(true)}
            >
                <div className="bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 pb-12 md:p-6 md:pb-16">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goBack}
                            className="flex items-center gap-2 text-white transition hover:text-zinc-300"
                        >
                            <ArrowLeft className="h-6 w-6 md:h-7 md:w-7" />
                            <span className="text-base font-medium md:text-lg">
                                Back
                            </span>
                        </button>

                        <div className="flex items-center gap-2">
                            {/* Subtitle Button */}
                            <button
                                onClick={() => {
                                    setShowSubtitlePanel(!showSubtitlePanel);
                                    setShowEpisodePanel(false);
                                }}
                                className={cn(
                                    'flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-white transition',
                                    showSubtitlePanel
                                        ? 'bg-white/20'
                                        : 'bg-zinc-800/80 hover:bg-zinc-700',
                                    selectedSubtitle &&
                                    'ring-1 ring-green-500/50',
                                )}
                            >
                                <Languages className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    {selectedSubtitle
                                        ? selectedSubtitle.language_name
                                        : 'Subtitles'}
                                </span>
                            </button>

                            {type === 'tv' && (
                                <button
                                    onClick={() => {
                                        setShowEpisodePanel(!showEpisodePanel);
                                        setShowSubtitlePanel(false);
                                    }}
                                    className={cn(
                                        'flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition',
                                        showEpisodePanel
                                            ? 'bg-white/20'
                                            : 'bg-zinc-800/80 hover:bg-zinc-700',
                                    )}
                                >
                                    <span>
                                        S{currentSeason}:E{currentEpisode}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 transition-transform',
                                            showEpisodePanel && 'rotate-180',
                                        )}
                                    />
                                </button>
                            )}

                            <button
                                onClick={toggleFullscreen}
                                className="rounded-full bg-zinc-800/80 p-2.5 text-white transition hover:bg-zinc-700"
                                title={
                                    isFullscreen
                                        ? 'Exit Fullscreen (F)'
                                        : 'Fullscreen (F)'
                                }
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

            {/* BOTTOM BAR - Only covers bottom area, does not block middle */}
            <div
                className={cn(
                    'absolute right-0 bottom-0 left-0 z-30 transition-all duration-300',
                    showBottomBar
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-full opacity-0',
                )}
                onMouseEnter={() => setShowBottomBar(true)}
            >
                <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 md:p-6 md:pt-16">
                    {/* Title & Episode Info */}
                    <div className="mb-3">
                        <h1 className="text-lg font-bold text-white md:text-xl">
                            {title}
                        </h1>
                        {type === 'tv' && currentEpisodeData && (
                            <p className="text-sm text-zinc-400">
                                S{currentSeason} E{currentEpisode}
                                {currentEpisodeData.name &&
                                    ` • ${currentEpisodeData.name}`}
                            </p>
                        )}
                        {selectedSubtitle && (
                            <p className="mt-1 text-xs text-green-400">
                                ✓ External subtitle:{' '}
                                {selectedSubtitle.language_name}
                            </p>
                        )}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Skip buttons for TV */}
                            {type === 'tv' && (
                                <>
                                    <button
                                        onClick={goToPreviousEpisode}
                                        className="flex items-center gap-1.5 rounded bg-zinc-800/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
                                        disabled={
                                            parseInt(currentEpisode) === 1 &&
                                            parseInt(currentSeason) === 1
                                        }
                                    >
                                        <SkipBack className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Previous
                                        </span>
                                    </button>
                                    <button
                                        onClick={goToNextEpisode}
                                        className="flex items-center gap-1.5 rounded bg-white/90 px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
                                    >
                                        <span>Next Episode</span>
                                        <SkipForward className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Tip */}
                        <p className="hidden text-xs text-zinc-500 md:block">
                            Click video for player controls • Press F for
                            fullscreen
                        </p>
                    </div>
                </div>
            </div>

            {/* Subtitle Panel */}
            {showSubtitlePanel && (
                <div
                    className="absolute top-20 right-4 z-50 max-h-[60vh] w-80 overflow-y-auto rounded-lg bg-zinc-900/95 shadow-2xl backdrop-blur-sm md:right-6"
                    onMouseEnter={() => setShowTopBar(true)}
                >
                    <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">
                                <Languages className="mr-2 inline-block h-4 w-4" />
                                External Subtitles
                            </h3>
                            <button
                                onClick={() => setShowSubtitlePanel(false)}
                                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                            Powered by SubDL
                        </p>
                    </div>

                    <div className="p-2">
                        {/* Remove subtitle option */}
                        {selectedSubtitle && (
                            <button
                                onClick={removeSubtitle}
                                className="mb-2 flex w-full items-center gap-2 rounded bg-red-600/20 p-3 text-left text-sm text-red-400 transition hover:bg-red-600/30"
                            >
                                <X className="h-4 w-4" />
                                Remove external subtitle
                            </button>
                        )}

                        {subtitlesLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        ) : subtitles.length === 0 ? (
                            <div className="p-4 text-center text-sm text-zinc-500">
                                <p>No subtitles found</p>
                                <p className="mt-1 text-xs">
                                    Try using the player's built-in CC button
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(subtitlesByLanguage).map(
                                    ([language, subs]) => (
                                        <div key={language}>
                                            <h4 className="mb-1 px-2 text-xs font-medium text-zinc-400">
                                                {language} ({subs.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {subs
                                                    .slice(0, 3)
                                                    .map((sub) => (
                                                        <button
                                                            key={sub.file_id}
                                                            onClick={() =>
                                                                selectSubtitle(
                                                                    sub,
                                                                )
                                                            }
                                                            disabled={
                                                                downloadingSubId ===
                                                                sub.file_id
                                                            }
                                                            className={cn(
                                                                'flex w-full items-center gap-2 rounded p-2 text-left transition',
                                                                selectedSubtitle?.file_id ===
                                                                    sub.file_id
                                                                    ? 'border border-green-600 bg-green-600/20'
                                                                    : 'hover:bg-zinc-800',
                                                                downloadingSubId ===
                                                                sub.file_id &&
                                                                'opacity-50',
                                                            )}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate text-xs font-medium text-white">
                                                                    {sub.release ||
                                                                        sub.file_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                    <span>
                                                                        {sub.download_count.toLocaleString()}{' '}
                                                                        downloads
                                                                    </span>
                                                                    {sub.from_trusted && (
                                                                        <span className="text-green-500">
                                                                            ✓
                                                                            Trusted
                                                                        </span>
                                                                    )}
                                                                    {sub.hearing_impaired && (
                                                                        <span className="text-blue-400">
                                                                            CC
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {downloadingSubId ===
                                                                sub.file_id ? (
                                                                <Loader2 className="h-4 w-4 flex-none animate-spin text-zinc-400" />
                                                            ) : selectedSubtitle?.file_id ===
                                                                sub.file_id ? (
                                                                <Check className="h-4 w-4 flex-none text-green-500" />
                                                            ) : null}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-800 p-3">
                        <p className="text-center text-xs text-zinc-600">
                            Tip: VidLink also has built-in subtitles
                        </p>
                    </div>
                </div>
            )}

            {/* Episode Panel (TV Shows) */}
            {type === 'tv' && showEpisodePanel && (
                <div
                    className="absolute top-20 right-4 z-50 max-h-[60vh] w-80 overflow-y-auto rounded-lg bg-zinc-900/95 shadow-2xl backdrop-blur-sm md:right-6"
                    onMouseEnter={() => setShowTopBar(true)}
                >
                    <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">
                                Episodes
                            </h3>
                            <button
                                onClick={() => setShowEpisodePanel(false)}
                                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {details?.number_of_seasons &&
                            details.number_of_seasons > 1 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {Array.from(
                                        { length: details.number_of_seasons },
                                        (_, i) => i + 1,
                                    ).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() =>
                                                setCurrentSeason(s.toString())
                                            }
                                            className={cn(
                                                'rounded px-2.5 py-1 text-xs font-medium transition',
                                                parseInt(currentSeason) === s
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                                            )}
                                        >
                                            S{s}
                                        </button>
                                    ))}
                                </div>
                            )}
                    </div>

                    <div className="p-2">
                        {seasonLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {seasonDetails?.episodes?.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() =>
                                            goToEpisode(
                                                parseInt(currentSeason),
                                                ep.episode_number,
                                            )
                                        }
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded p-2 text-left transition',
                                            parseInt(currentEpisode) ===
                                                ep.episode_number
                                                ? 'border border-red-600 bg-red-600/20'
                                                : 'hover:bg-zinc-800',
                                        )}
                                    >
                                        <div className="h-12 w-20 flex-none overflow-hidden rounded bg-zinc-800">
                                            {ep.still_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                                                    alt={ep.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                                    <Play className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium text-white">
                                                {ep.episode_number}. {ep.name}
                                            </p>
                                            {ep.runtime && (
                                                <p className="text-xs text-zinc-500">
                                                    {ep.runtime}m
                                                </p>
                                            )}
                                        </div>
                                        {parseInt(currentEpisode) ===
                                            ep.episode_number && (
                                                <div className="flex-none pr-1">
                                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                                                </div>
                                            )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close panels */}
            {(showEpisodePanel || showSubtitlePanel) && (
                <div
                    className="absolute inset-0 z-40"
                    onClick={() => {
                        setShowEpisodePanel(false);
                        setShowSubtitlePanel(false);
                    }}
                />
            )}
        </div>
    );
}
