import React from 'react';

interface PlayerSeekbarProps {
    playedSeconds: number;
    duration: number;
    seekTo: (value: number) => void;
}

export default function PlayerSeekbar({
    playedSeconds,
    duration,
    seekTo,
}: PlayerSeekbarProps) {
    const percentage = duration > 0 ? (playedSeconds / duration) * 100 : 0;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seekTo(parseFloat(e.target.value));
    };

    return (
        <div className="group relative flex h-8 w-full items-center">
            <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={playedSeconds}
                onChange={handleSeek}
                className="absolute inset-0 z-20 h-1.5 w-full cursor-pointer appearance-none bg-transparent"
            />
            {/* Custom Track */}
            <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-zinc-600 transition-all group-hover:h-2 md:h-1.5">
                <div
                    className="relative h-full rounded-full bg-red-600"
                    style={{ width: `${percentage}%` }}
                >
                    {/* Scrubber head */}
                    <div className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 scale-0 rounded-full bg-red-600 shadow-lg transition-transform duration-200 group-hover:scale-100" />
                </div>
            </div>
        </div>
    );
}
