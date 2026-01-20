import { Head, router } from '@inertiajs/react';

type ProviderKey = 'netflix' | 'prime' | 'disney' | 'viu' | 'vidio' | 'hbomax';

interface ProviderCard {
    key: ProviderKey;
    label: string;
    logoText: string;
    logoBgClass: string;
    logoTextClass: string;
    description?: string;
}

const PROVIDERS: ProviderCard[] = [
    {
        key: 'netflix',
        label: 'Netflix',
        logoText: 'N',
        logoBgClass: 'bg-red-600',
        logoTextClass: 'text-white',
        description: '🎧 Multi-Audio Available',
    },
    {
        key: 'prime',
        label: 'Prime Video',
        logoText: 'prime',
        logoBgClass: 'bg-[#0f171e]',
        logoTextClass: 'text-[#00a8e1]',
        description: '🎧 Multi-Audio Available',
    },
    {
        key: 'disney',
        label: 'Disney+',
        logoText: 'D+',
        logoBgClass: 'bg-[#040714]',
        logoTextClass: 'text-[#1f80ff]',
        description: '🎧 Multi-Audio Available',
    },
    {
        key: 'viu',
        label: 'Viu',
        logoText: 'viu',
        logoBgClass: 'bg-[#fdd835]',
        logoTextClass: 'text-[#1a1a1a]',
        description: '🎧 Multi-Audio Available',
    },
    {
        key: 'vidio',
        label: 'Vidio',
        logoText: 'V',
        logoBgClass: 'bg-white',
        logoTextClass: 'text-[#e50914]',
        description: '🎧 Multi-Audio Available',
    },
    {
        key: 'hbomax',
        label: 'HBO Max',
        logoText: 'max',
        logoBgClass:
            'bg-gradient-to-tr from-[#0f1a2a] via-[#4b2a7a] to-[#b535f6]',
        logoTextClass: 'text-white',
        description: '🎧 Multi-Audio Available',
    },
];

export default function StreamingSelect() {
    const handleSelect = (key: ProviderKey) => {
        try {
            window.localStorage.setItem('selectedProvider', key);
        } catch {
            // ignore
        }
        router.visit(`/?provider=${key}`);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] text-white">
            <Head title="Pilih Layanan Streaming" />
            <h1 className="mb-4 text-2xl font-bold md:text-3xl">
                Pilih Layanan Streaming Anda
            </h1>
            <p className="mb-8 max-w-md text-center text-sm text-zinc-300">
                Pilih platform langganan yang ingin Anda lihat katalognya.
            </p>

            <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
                {PROVIDERS.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSelect(p.key)}
                        className="relative flex h-32 w-44 flex-col items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-zinc-800 hover:ring-2 hover:ring-white/30"
                    >
                        <div
                            className={`mb-3 flex h-12 w-24 items-center justify-center rounded-lg ${p.logoBgClass}`}
                        >
                            <span
                                className={`text-xl font-bold ${p.logoTextClass}`}
                            >
                                {p.logoText}
                            </span>
                        </div>
                        <span className="text-sm text-zinc-100">{p.label}</span>
                        {p.description && (
                            <span className="mt-1 text-[10px] text-green-400">
                                {p.description}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <p className="mt-10 text-xs text-zinc-500">
                💡 Multi-Audio tersedia untuk konten yang mendukung via NetMirror
            </p>
        </div>
    );
}
