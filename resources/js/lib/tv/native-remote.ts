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
}

interface TvRemotePlugin {
    getInfo(): Promise<NativeTvInfo>;
    setCursorMode(options: { enabled: boolean }): Promise<void>;
}

const TvRemote = registerPlugin<TvRemotePlugin>('TvRemote');

let infoRequest: Promise<NativeTvInfo | null> | null = null;

export function getNativeTvInfo(): Promise<NativeTvInfo | null> {
    if (!infoRequest) {
        infoRequest = Capacitor.isNativePlatform()
            ? TvRemote.getInfo().catch(() => null)
            : Promise.resolve(null);
    }

    return infoRequest;
}

/**
 * Menyalakan atau mematikan kursor native. Mengembalikan false bila plugin
 * tidak tersedia, supaya pemanggil bisa memakai jalur cadangan.
 */
export async function setNativeCursorMode(enabled: boolean): Promise<boolean> {
    const info = await getNativeTvInfo();

    if (!info?.cursor) {
        return false;
    }

    try {
        await TvRemote.setCursorMode({ enabled });

        return true;
    } catch {
        return false;
    }
}
