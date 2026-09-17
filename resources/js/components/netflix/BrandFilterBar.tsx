import { router } from '@inertiajs/react';
import { Check, Sparkles } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

export type ProviderKey = 'all' | 'disney' | 'netflix' | 'prime' | 'hbomax' | 'apple';

interface BrandProvider {
    key: ProviderKey;
    label: string;
    badgeText?: string;
    activeClass: string;
    borderClass: string;
    glowClass: string;
    logoColorClass: string;
}

const BRAND_PROVIDERS: BrandProvider[] = [
    {
        key: 'all',
        label: 'Semua Katalog',
        activeClass: 'bg-white text-black font-extrabold shadow-lg shadow-white/10',
        borderClass: 'border-white/30',
        glowClass: 'ring-2 ring-white/40',
        logoColorClass: 'text-zinc-300',
    },
    {
        key: 'disney',
        label: 'Disney+',
        badgeText: 'HOTSTAR',
        activeClass: 'bg-gradient-to-r from-[#0c2144] to-[#113ccf] text-white font-extrabold shadow-lg shadow-blue-600/30',
        borderClass: 'border-blue-500/40',
        glowClass: 'ring-2 ring-blue-400/60',
        logoColorClass: 'text-blue-400',
    },
    {
        key: 'netflix',
        label: 'Netflix',
        activeClass: 'bg-[#E50914] text-white font-extrabold shadow-lg shadow-red-600/30',
        borderClass: 'border-red-600/40',
        glowClass: 'ring-2 ring-red-500/60',
        logoColorClass: 'text-red-500',
    },
    {
        key: 'prime',
        label: 'Prime Video',
        activeClass: 'bg-[#0f2336] text-[#00a8e1] font-extrabold shadow-lg shadow-cyan-500/20 border border-[#00a8e1]/60',
        borderClass: 'border-cyan-500/30',
        glowClass: 'ring-2 ring-[#00a8e1]/60',
        logoColorClass: 'text-[#00a8e1]',
    },
    {
        key: 'hbomax',
        label: 'HBO Max',
        activeClass: 'bg-gradient-to-r from-[#310c59] to-[#6d28d9] text-white font-extrabold shadow-lg shadow-purple-600/30',
        borderClass: 'border-purple-500/40',
        glowClass: 'ring-2 ring-purple-400/60',
        logoColorClass: 'text-purple-400',
    },
    {
        key: 'apple',
        label: 'Apple TV+',
        activeClass: 'bg-zinc-800 text-white font-extrabold shadow-lg shadow-zinc-600/20 border border-zinc-400/40',
        borderClass: 'border-zinc-700',
        glowClass: 'ring-2 ring-zinc-300/50',
        logoColorClass: 'text-zinc-300',
    },
];

interface BrandFilterBarProps {
    activeProvider?: string;
    className?: string;
}

export default function BrandFilterBar({
    activeProvider,
    className,
}: BrandFilterBarProps) {
    const currentKey: ProviderKey = (activeProvider as ProviderKey) || 'all';

    const handleSelect = (key: ProviderKey) => {
        if (key === currentKey) return;

        const targetUrl = key === 'all' ? '/' : `/?provider=${key}`;
        router.visit(targetUrl, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <section
            aria-label="Filter Platform Streaming"
            className={cn('relative z-20 px-4 md:px-12 lg:px-16', className)}
        >
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Pilih Studio & Platform
                        </span>
                    </div>

                    {currentKey !== 'all' && (
                        <button
                            type="button"
                            onClick={() => handleSelect('all')}
                            className="cinema-focus text-xs font-semibold text-zinc-400 transition hover:text-white"
                        >
                            Tampilkan Semua Katalog
                        </button>
                    )}
                </div>

                <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
                    {BRAND_PROVIDERS.map((provider) => {
                        const isActive = currentKey === provider.key;

                        return (
                            <button
                                key={provider.key}
                                type="button"
                                onClick={() => handleSelect(provider.key)}
                                aria-pressed={isActive}
                                className={cn(
                                    'cinema-focus group relative flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 md:text-sm',
                                    isActive
                                        ? cn(provider.activeClass, provider.glowClass)
                                        : 'border border-white/10 bg-zinc-900/90 text-zinc-300 hover:border-white/30 hover:bg-zinc-800 hover:text-white',
                                )}
                            >
                                {isActive && (
                                    <Check
                                        className="h-3.5 w-3.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                )}

                                <span>{provider.label}</span>

                                {provider.badgeText && (
                                    <span
                                        className={cn(
                                            'rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-blue-500/20 text-blue-300',
                                        )}
                                    >
                                        {provider.badgeText}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
