import { getNativeTvInfo } from './native-remote';

/**
 * Penentu apakah aplikasi sedang dipakai lewat remote TV.
 *
 * Urutan sumber kebenaran:
 * 1. Penimpaan manual lewat `?tv=1`, `?tv=0`, atau `?tv=auto` di alamat.
 *    Disimpan di localStorage agar bertahan antar halaman. Dipakai untuk
 *    menguji tampilan TV di peramban desktop.
 * 2. Laporan plugin native TvRemote (UiModeManager / fitur leanback).
 * 3. Perangkat tanpa penunjuk sama sekali (tanpa layar sentuh dan tetikus),
 *    yang di Android praktis hanya terjadi di TV.
 *
 * Saat aktif, kelas `tv-mode` dipasang di <html>. CSS memakai kelas itu lewat
 * varian `tv:` dan mesin navigasi spasial hanya bekerja selama kelas ini ada,
 * jadi pengguna keyboard di desktop tetap mendapat perilaku panah bawaan.
 */
const STORAGE_KEY = 'layar:tv-mode';
const CLASS_NAME = 'tv-mode';

let active = false;
const listeners = new Set<() => void>();

function readOverride(): boolean | null {
    try {
        const param = new URLSearchParams(window.location.search).get('tv');

        if (param === '1' || param === '0') {
            window.localStorage.setItem(STORAGE_KEY, param);
        } else if (param === 'auto') {
            window.localStorage.removeItem(STORAGE_KEY);
        }

        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (stored === '1') {
            return true;
        }

        if (stored === '0') {
            return false;
        }
    } catch {
        // Penyimpanan diblokir (mode privat, WebView tanpa DOM storage).
        // Deteksi otomatis tetap berjalan.
    }

    return null;
}

function hasNoPointer(): boolean {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(any-pointer: none)').matches
    );
}

function setActive(next: boolean): void {
    if (next === active) {
        return;
    }

    active = next;
    document.documentElement.classList.toggle(CLASS_NAME, next);
    listeners.forEach((listener) => listener());
}

export function isTvMode(): boolean {
    return active;
}

export function subscribeTvMode(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function initTvMode(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const override = readOverride();

    if (override !== null) {
        setActive(override);

        return;
    }

    setActive(hasNoPointer());

    void getNativeTvInfo().then((info) => {
        if (info?.television) {
            setActive(true);
        }
    });
}
