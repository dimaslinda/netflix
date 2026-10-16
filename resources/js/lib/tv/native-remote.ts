import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Jembatan ke plugin TvRemote di android/app (TvRemotePlugin.java).
 *
 * Plugin ini hanya ada di APK yang dibangun sesudah plugin ditambahkan. APK
 * lama, peramban HP, dan peramban desktop tidak memilikinya, jadi setiap
 * pemanggilan di sini harus tetap aman ketika plugin tidak ditemukan.
 */
export interface NativeTvInfo {
    /** Perangkat berjalan dalam mode televisi (Android TV / Google TV). */
    television: boolean;
    /** Kursor remote native tersedia untuk mengendalikan iframe pemutar. */
    cursor: boolean;
    versionName?: string;
    versionCode?: number;
}

/**
 * Keadaan plugin, cukup rinci untuk ditampilkan ke pemirsa:
 * - `ready`: plugin menjawab.
 * - `web`: bukan aplikasi Android (peramban biasa).
 * - `missing`: aplikasi Android tanpa plugin, yaitu APK versi lama.
 * - `error`: plugin ada tetapi panggilannya gagal.
 */
export type NativeTvStatus =
    | { kind: 'ready'; info: NativeTvInfo }
    | { kind: 'web' }
    | { kind: 'missing'; build: string | null }
    | { kind: 'error'; message: string };

interface TvRemotePlugin {
    getInfo(): Promise<NativeTvInfo>;
    setCursorMode(options: { enabled: boolean }): Promise<void>;
}

const TvRemote = registerPlugin<TvRemotePlugin>('TvRemote');

/**
 * Panggilan native yang tidak pernah dijawab (pengecualian di sisi Java hanya
 * dicatat ke log) akan menggantung selamanya tanpa batas waktu ini.
 */
const NATIVE_TIMEOUT_MS = 3000;

let statusRequest: Promise<NativeTvStatus> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`Tidak ada jawaban dalam ${ms} ms`)),
                ms,
            ),
        ),
    ]);
}

/** Versi APK terpasang. Plugin App sudah ada di APK lama sekalipun. */
async function installedBuild(): Promise<string | null> {
    try {
        const info = await withTimeout(App.getInfo(), NATIVE_TIMEOUT_MS);

        return `${info.version} (${info.build})`;
    } catch {
        return null;
    }
}

export function getNativeTvStatus(): Promise<NativeTvStatus> {
    if (!statusRequest) {
        statusRequest = (async (): Promise<NativeTvStatus> => {
            if (!Capacitor.isNativePlatform()) {
                return { kind: 'web' };
            }

            if (!Capacitor.isPluginAvailable('TvRemote')) {
                return { kind: 'missing', build: await installedBuild() };
            }

            try {
                return {
                    kind: 'ready',
                    info: await withTimeout(
                        TvRemote.getInfo(),
                        NATIVE_TIMEOUT_MS,
                    ),
                };
            } catch (cause) {
                // Kegagalan tidak disimpan: panggilan berikutnya mencoba lagi.
                statusRequest = null;

                return {
                    kind: 'error',
                    message:
                        cause instanceof Error ? cause.message : String(cause),
                };
            }
        })();
    }

    return statusRequest;
}

export async function getNativeTvInfo(): Promise<NativeTvInfo | null> {
    const status = await getNativeTvStatus();

    return status.kind === 'ready' ? status.info : null;
}

/**
 * Menyalakan atau mematikan kursor native. Mengembalikan false bila plugin
 * tidak tersedia atau tidak menjawab.
 */
export async function setNativeCursorMode(enabled: boolean): Promise<boolean> {
    const info = await getNativeTvInfo();

    if (!info?.cursor) {
        return false;
    }

    try {
        await withTimeout(
            TvRemote.setCursorMode({ enabled }),
            NATIVE_TIMEOUT_MS,
        );

        return true;
    } catch {
        return false;
    }
}
