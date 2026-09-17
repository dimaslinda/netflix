import { Volume2, VolumeX } from 'lucide-react';

import PlayerControlButton from './PlayerControlButton';

interface VolumeControllersProps {
    value: number;
    handleVolume: (value: number) => void;
    handleVolumeToggle: () => void;
    muted: boolean;
}

export default function VolumeControllers({
    value,
    handleVolume,
    handleVolumeToggle,
    muted,
}: VolumeControllersProps) {
    return (
        <div className="group/volume flex items-center gap-2">
            <PlayerControlButton onClick={handleVolumeToggle}>
                {muted || value === 0 ? (
                    <VolumeX className="h-6 w-6" />
                ) : (
                    <Volume2 className="h-6 w-6" />
                )}
            </PlayerControlButton>

            <div className="w-0 overflow-hidden transition-all duration-300 group-hover/volume:ml-2 group-hover/volume:w-24">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : value * 100}
                    onChange={(e) =>
                        handleVolume(parseInt(e.target.value) / 100)
                    }
                    className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-zinc-600 accent-red-600"
                />
            </div>
        </div>
    );
}
