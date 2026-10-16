/**
 * Satu-satunya pintu untuk tombol Kembali (remote TV, tombol Back Android) dan
 * tombol Escape.
 *
 * Sebelumnya setiap halaman memasang pendengar `backButton` Capacitor sendiri
 * di samping pendengar global di app.tsx. Capacitor memanggil semua pendengar,
 * jadi satu tekanan Back di halaman tonton menjalankan dua navigasi sekaligus.
 *
 * Di sini penangan disusun sebagai tumpukan: yang terakhir didaftarkan (laci,
 * modal, mode kursor) menang. Bila tumpukan kosong, app.tsx menjalankan
 * perilaku bawaan.
 */
interface BackEntry {
    handler: () => void;
    /**
     * Lapisan yang bisa ditutup (modal, laci, menu). Hanya lapisan seperti ini
     * yang ikut menanggapi Escape; penangan tingkat halaman (misalnya keluar
     * dari pemutar) hanya menanggapi tombol Back perangkat.
     */
    overlay: boolean;
}

const stack: BackEntry[] = [];

export function pushBackHandler(
    handler: () => void,
    options: { overlay?: boolean } = {},
): () => void {
    const entry: BackEntry = { handler, overlay: options.overlay ?? false };
    stack.push(entry);

    return () => {
        const index = stack.lastIndexOf(entry);

        if (index !== -1) {
            stack.splice(index, 1);
        }
    };
}

/** Menjalankan penangan teratas. Mengembalikan false bila tumpukan kosong. */
export function runBackHandler(): boolean {
    const entry = stack[stack.length - 1];

    if (!entry) {
        return false;
    }

    entry.handler();

    return true;
}

/** Seperti runBackHandler, tetapi hanya bila penangan teratas adalah lapisan. */
export function runOverlayBackHandler(): boolean {
    const entry = stack[stack.length - 1];

    if (!entry?.overlay) {
        return false;
    }

    entry.handler();

    return true;
}
