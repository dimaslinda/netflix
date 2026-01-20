import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface NetMirrorPlayerProps {
    title: string;
    streamUrl?: string;
    poster?: string;
    onError?: () => void;
    onReady?: () => void;
}

export default function NetMirrorPlayer({
    title,
    streamUrl,
    poster,
    onError,
    onReady,
}: NetMirrorPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (streamUrl) {
            console.log('Stream URL:', streamUrl);
            setIsLoading(false);
            onReady?.();
        }
    }, [streamUrl, onReady]);

    // Check if URL is embeddable
    const getEmbedUrl = (): string | null => {
        if (!streamUrl) return null;

        // NetMirror URLs usually follow pattern: https://net51.cc/play/...
        // We need to check if it's an HLS stream or embed URL

        // If it's already a full URL, try to use it
        if (streamUrl.startsWith('http')) {
            return streamUrl;
        }
        return null;
    };

    const embedUrl = getEmbedUrl();

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <div className="text-center max-w-md px-4">
                    <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <p className="text-red-400 mb-2">⚠️ {error}</p>
                    <p className="text-sm text-zinc-400 mb-4">
                        The stream couldn't be loaded directly. You can try opening it in a new tab.
                    </p>
                    {embedUrl && (
                        <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Stream
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (!embedUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                    <p className="text-yellow-400">No stream URL available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-black">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-500" />
                        <p className="mt-4 text-zinc-400">Loading stream...</p>
                    </div>
                </div>
            )}

            {/* Iframe Player */}
            <iframe
                src={embedUrl}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                    setIsLoading(false);
                    onReady?.();
                }}
                onError={() => {
                    setError('Failed to load the stream');
                    onError?.();
                }}
            />

            {/* Title overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-10 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-pink-500">
                        <span className="text-xs font-bold text-white">NM</span>
                    </div>
                    <span className="text-sm font-medium text-white">{title}</span>
                    <span className="rounded bg-green-600/30 px-2 py-0.5 text-[10px] text-green-400">
                        🎧 Multi-Audio
                    </span>
                </div>
            </div>
        </div>
    );
}
