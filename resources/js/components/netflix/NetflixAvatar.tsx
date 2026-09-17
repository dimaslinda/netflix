import React from 'react';

import { getAvatarPreset } from '@/lib/avatar-presets';
import { cn } from '@/lib/utils';

interface NetflixAvatarProps {
    avatarId?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export default function NetflixAvatar({
    avatarId,
    name,
    size = 'md',
    className,
}: NetflixAvatarProps) {
    const preset = getAvatarPreset(avatarId);

    const sizeClasses = {
        sm: 'w-8 h-8 rounded-sm text-xs',
        md: 'w-10 h-10 rounded-md text-sm',
        lg: 'w-16 h-16 rounded-lg text-lg',
        xl: 'w-24 h-24 rounded-xl text-2xl',
    };

    const eyeSize = {
        sm: 'w-1 h-1.5',
        md: 'w-1.5 h-2',
        lg: 'w-2.5 h-3',
        xl: 'w-3.5 h-4.5',
    };

    const mouthSize = {
        sm: 'w-4 h-1.5 border-b-2',
        md: 'w-5 h-2 border-b-2',
        lg: 'w-8 h-3 border-b-[3px]',
        xl: 'w-12 h-4 border-b-4',
    };

    return (
        <div
            className={cn(
                'relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br shadow-md transition select-none',
                preset.bgGradient,
                sizeClasses[size],
                className,
            )}
            title={name ?? preset.name}
        >
            {/* Netflix Classic Smile Face */}
            <div className="flex flex-col items-center justify-center gap-1">
                {/* Eyes */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    <div
                        className={cn('rounded-full', eyeSize[size])}
                        style={{ backgroundColor: preset.faceColor }}
                    />
                    <div
                        className={cn('rounded-full', eyeSize[size])}
                        style={{ backgroundColor: preset.faceColor }}
                    />
                </div>

                {/* Smile Mouth */}
                <div
                    className={cn(
                        'rounded-b-full border-solid',
                        mouthSize[size],
                    )}
                    style={{ borderColor: preset.faceColor }}
                />
            </div>
        </div>
    );
}
