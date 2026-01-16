import { Head, router } from '@inertiajs/react';

type ProviderKey = 'netflix' | 'prime' | 'disney' | 'viu' | 'vidio' | 'hbomax';

interface ProviderCard {
    key: ProviderKey;
    label: string;
    logoText: string;
    logoBgClass: string;
    logoTextClass: string;
}

const PROVIDERS: ProviderCard[] = [
    {
        key: 'netflix',
        label: 'Netflix',
        logoText: 'N',
        logoBgClass: 'bg-red-600',
        logoTextClass: 'text-white',
    },
    {
        key: 'prime',
        label: 'Prime Video',
        logoText: 'prime',
        logoBgClass: 'bg-[#0f171e]',
        logoTextClass: 'text-[#00a8e1]',
    },
    {
        key: 'disney',
        label: 'Disney+',
        logoText: 'D+',
        logoBgClass: 'bg-[#040714]',
        logoTextClass: 'text-[#1f80ff]',
    },
    {
        key: 'viu',
        label: 'Viu',
        logoText: 'viu',
        logoBgClass: 'bg-[#fdd835]',
        logoTextClass: 'text-[#1a1a1a]',
    },
    {
        key: 'vidio',
        label: 'Vidio',
        logoText: 'V',
        logoBgClass: 'bg-white',
        logoTextClass: 'text-[#e50914]',
    },
    {
        key: 'hbomax',
        label: 'HBO Max',
        logoText: 'max',
        logoBgClass:
            'bg-gradient-to-tr from-[#0f1a2a] via-[#4b2a7a] to-[#b535f6]',
        logoTextClass: 'text-white',
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
            <h1 className="mb-8 text-2xl font-bold md:text-3xl">
                Pilih Layanan Streaming Anda
            </h1>
            <p className="mb-6 max-w-md text-center text-sm text-zinc-300">
                Pilih platform langganan yang ingin Anda lihat katalognya.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
                {PROVIDERS.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSelect(p.key)}
                        className="flex h-24 w-40 flex-col items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-zinc-800"
                    >
                        <div
                            className={`mb-2 flex h-10 w-20 items-center justify-center rounded ${p.logoBgClass}`}
                        >
                            <span
                                className={`text-lg font-bold ${p.logoTextClass}`}
                            >
                                {p.logoText}
                            </span>
                        </div>
                        <span className="text-xs text-zinc-200">{p.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
