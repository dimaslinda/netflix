import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoJSPlayerProps {
    options: any;
    onReady?: (player: Player) => void;
}

export default function VideoJSPlayer({
    options,
    onReady,
}: VideoJSPlayerProps) {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    useEffect(() => {
        // Initializing video.js
        if (!playerRef.current && videoRef.current) {
            const videoElement = document.createElement('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = (playerRef.current = videojs(
                videoElement,
                options,
                () => {
                    onReady && onReady(player);
                },
            ));
        } else if (playerRef.current) {
            const player = playerRef.current;
            player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options, videoRef]);

    // Dispose the player on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div data-vjs-player className="h-full w-full">
            <div ref={videoRef} className="h-full w-full" />
        </div>
    );
}

// Custom Netflix-like VideoJS styles
const css = `
  .video-js {
    font-family: 'Inter', sans-serif;
    color: #fff;
    background-color: #000;
  }
  .vjs-big-play-button {
    display: none !important;
  }
  .vjs-control-bar {
    display: none !important;
  }
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
}
