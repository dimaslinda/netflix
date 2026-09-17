import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.netflix.app',
    appName: 'Netflix',
    webDir: 'public',
    server: {
        // Mode Live Server: Muat URL Laravel secara langsung
        // Ganti dengan IP lokal Wi-Fi Anda (misal: http://192.168.1.50:8000) saat pengujian di perangkat fisik/TV
        // atau domain HTTPS saat rilis produksi.
        url:
            process.env.CAPACITOR_SERVER_URL ||
            'https://netflix-eight-blush.vercel.app',
        cleartext: true,
        androidScheme: 'https',
    },
    android: {
        allowMixedContent: true,
        captureInput: true,
        webContentsDebuggingEnabled: true,
    },
};

export default config;
