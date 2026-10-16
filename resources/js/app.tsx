import '../css/app.css';

import { App as CapApp } from '@capacitor/app';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initializeTheme } from './hooks/use-appearance';
import { runBackHandler, runOverlayBackHandler } from './lib/tv/back-stack';
import { setNativeCursorMode } from './lib/tv/native-remote';
import {
    discardReturnFocus,
    rememberReturnFocus,
    restoreReturnFocus,
    trackCardFocus,
} from './lib/tv/return-focus';
import {
    focusInitial,
    installSpatialNavigation,
} from './lib/tv/spatial-navigation';
import { initTvMode, isTvMode, subscribeTvMode } from './lib/tv/tv-mode';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Halaman induk tombol Kembali di halaman rincian. Dulu Kembali di sana
 * memakai history.back(), sehingga rincian dan pemutar saling memantul tanpa
 * pernah sampai ke beranda.
 */
const TITLE_PARENT_KEY = 'tv:title-parent';

function recordAppUrl(url: string): void {
    try {
        if (!url.startsWith('/watch')) {
            sessionStorage.setItem('last_app_url', url);
        }

        if (!/^\/(title|watch|login)(\/|\?|$)/.test(url)) {
            sessionStorage.setItem(TITLE_PARENT_KEY, url);
        }
    } catch {
        // Penyimpanan diblokir: tombol Kembali jatuh ke beranda.
    }
}

function titleParentUrl(): string {
    try {
        return sessionStorage.getItem(TITLE_PARENT_KEY) || '/';
    } catch {
        return '/';
    }
}

/**
 * Setelah pindah halaman, fokus lama ikut hilang bersama DOM-nya. Di TV itu
 * berarti remote tidak menunjuk apa pun, jadi fokus dipasang ulang: ke kartu
 * yang ditinggalkan bila ini kunjungan kembali (`cameBack`), selain itu ke
 * tujuan pertama halaman. Dua frame memberi React waktu merender halaman.
 */
function restoreRemoteFocus(cameBack = false): void {
    if (!isTvMode()) {
        discardReturnFocus();

        return;
    }

    window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
            if (cameBack ? restoreReturnFocus() : discardReturnFocus()) {
                return;
            }

            const focused = document.activeElement;

            if (!focused || focused === document.body || !focused.isConnected) {
                focusInitial();
            }
        }),
    );
}

/**
 * Tombol Kembali di beranda. Dari dalam baris film, Kembali pertama membawa
 * ke puncak halaman; aplikasi baru ditutup bila Kembali tidak mengubah apa
 * pun lagi. Dulu satu Kembali dari baris mana pun langsung menutup aplikasi.
 */
function backOnHome(): void {
    if (isTvMode()) {
        const before = document.activeElement;
        const wasAtTop = window.scrollY < 8;

        window.scrollTo({ top: 0, behavior: 'instant' });
        focusInitial(document);

        if (!(wasAtTop && document.activeElement === before)) {
            return;
        }
    }

    void CapApp.exitApp();
}

if (typeof window !== 'undefined') {
    initTvMode();
    installSpatialNavigation();
    document.addEventListener('focusin', trackCardFocus);

    // Halaman yang dimuat ulang penuh tidak sempat mematikan kursor native
    // yang dinyalakan halaman tonton. Tanpa ini, panah remote tetap
    // menggerakkan kursor di halaman yang tidak membutuhkannya.
    void setNativeCursorMode(false);

    recordAppUrl(window.location.pathname + window.location.search);

    /*
     * Inertia 2 memicu event berbeda per jenis kunjungan:
     * - kunjungan biasa: before, navigate, success;
     * - kunjungan replace (semua tombol Kembali, ketikan di pencarian):
     *   before, success, TANPA navigate;
     * - maju/mundur riwayat peramban: hanya navigate.
     * Karena itu halaman baru ditangani di navigate atau di success, mana
     * yang lebih dulu, tepat sekali per kunjungan.
     */
    let pendingVisit: { fromPath: string } | null = null;

    const leftPlayback = (path: string) => /^\/(watch|title)(\/|$)/.test(path);

    const handlePageShown = (url: string, cameBack: boolean) => {
        recordAppUrl(url);
        restoreRemoteFocus(cameBack);
    };

    router.on('before', () => {
        pendingVisit = { fromPath: window.location.pathname };
        rememberReturnFocus();
    });

    router.on('navigate', (event) => {
        const visit = pendingVisit;
        pendingVisit = null;

        // Tanpa before berarti maju/mundur riwayat: selalu kunjungan kembali.
        handlePageShown(
            event.detail.page.url,
            visit === null || leftPlayback(visit.fromPath),
        );
    });

    router.on('success', (event) => {
        const visit = pendingVisit;
        pendingVisit = null;

        if (visit) {
            handlePageShown(
                event.detail.page.url,
                leftPlayback(visit.fromPath),
            );
        }
    });

    // Kunjungan yang batal (ketikan pencarian disusul ketikan baru) tidak
    // pernah sampai ke navigate/success.
    router.on('finish', () => {
        pendingVisit = null;
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && runOverlayBackHandler()) {
            event.preventDefault();
        }
    });

    // Penanganan gestur & tombol fisik "Back" di Android (Capacitor).
    // Lapisan dan halaman yang mendaftar lewat useBackHandler didahulukan.
    try {
        CapApp.addListener('backButton', () => {
            if (runBackHandler()) {
                return;
            }

            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/watch')) {
                const target = sessionStorage.getItem('last_app_url') || '/';
                router.visit(target, { replace: true });
            } else if (currentPath.startsWith('/title')) {
                router.visit(titleParentUrl(), { replace: true });
            } else if (currentPath !== '/') {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    router.visit('/');
                }
            } else {
                backOnHome();
            }
        }).catch(() => {});
    } catch {
        // Lingkungan peramban web standar tanpa native Capacitor
    }
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );

        // Mode TV bisa baru diketahui setelah plugin native menjawab, sesudah
        // render pertama. Kedua jalur sama-sama memasang fokus awal.
        restoreRemoteFocus();
        subscribeTvMode(restoreRemoteFocus);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
