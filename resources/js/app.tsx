import '../css/app.css';

import { App as CapApp } from '@capacitor/app';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

if (typeof window !== 'undefined') {
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
    });

    // Penanganan gestur & tombol fisik "Back" di Android (Capacitor)
    try {
        CapApp.addListener('backButton', () => {
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
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
