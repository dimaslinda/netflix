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
    focusInitial,
    installSpatialNavigation,
} from './lib/tv/spatial-navigation';
import { initTvMode, isTvMode, subscribeTvMode } from './lib/tv/tv-mode';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Setelah pindah halaman, fokus lama ikut hilang bersama DOM-nya. Di TV itu
 * berarti remote tidak menunjuk apa pun, jadi fokus dipasang ulang ke tujuan
 * pertama halaman baru. Dua frame memberi React waktu merender halaman.
 */
function restoreRemoteFocus(): void {
    if (!isTvMode()) {
        return;
    }

    window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
            const focused = document.activeElement;

            if (!focused || focused === document.body || !focused.isConnected) {
                focusInitial();
            }
        }),
    );
}

if (typeof window !== 'undefined') {
    initTvMode();
    installSpatialNavigation();

    // Halaman yang dimuat ulang penuh tidak sempat mematikan kursor native
    // yang dinyalakan halaman tonton. Tanpa ini, panah remote tetap
    // menggerakkan kursor di halaman yang tidak membutuhkannya.
    void setNativeCursorMode(false);

    if (!window.location.pathname.startsWith('/watch')) {
        sessionStorage.setItem(
            'last_app_url',
            window.location.pathname + window.location.search,
        );
    }
    router.on('navigate', (event) => {
        const url = event.detail.page.url;
        if (!url.startsWith('/watch')) {
            sessionStorage.setItem('last_app_url', url);
        }
        restoreRemoteFocus();
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
                router.visit(target);
            } else if (currentPath !== '/') {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    router.visit('/');
                }
            } else {
                CapApp.exitApp();
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
