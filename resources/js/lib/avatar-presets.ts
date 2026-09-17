export interface AvatarPreset {
    id: string;
    name: string;
    bgGradient: string;
    faceColor: string;
    borderColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
    {
        id: 'red_smile',
        name: 'Merah Netflix',
        bgGradient: 'from-[#E50914] to-[#990000]',
        faceColor: '#FFFFFF',
        borderColor: 'border-red-500',
    },
    {
        id: 'blue_classic',
        name: 'Biru Cool',
        bgGradient: 'from-[#0071EB] to-[#003882]',
        faceColor: '#FFFFFF',
        borderColor: 'border-blue-500',
    },
    {
        id: 'yellow_chill',
        name: 'Kuning Ceria',
        bgGradient: 'from-[#F5A623] to-[#B36B00]',
        faceColor: '#1A1A1A',
        borderColor: 'border-amber-400',
    },
    {
        id: 'green_zen',
        name: 'Hijau Santai',
        bgGradient: 'from-[#10B981] to-[#065F46]',
        faceColor: '#FFFFFF',
        borderColor: 'border-emerald-500',
    },
    {
        id: 'purple_mystic',
        name: 'Ungu Misterius',
        bgGradient: 'from-[#8B5CF6] to-[#4C1D95]',
        faceColor: '#FFFFFF',
        borderColor: 'border-purple-500',
    },
    {
        id: 'dark_ninja',
        name: 'Hitam Ninja',
        bgGradient: 'from-[#374151] to-[#111827]',
        faceColor: '#E50914',
        borderColor: 'border-zinc-500',
    },
];

export function getAvatarPreset(id?: string): AvatarPreset {
    return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}
