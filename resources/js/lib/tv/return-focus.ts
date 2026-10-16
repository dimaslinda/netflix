import { focusTarget } from './spatial-navigation';

/**
 * Mengingat kartu yang terakhir difokus di sebuah halaman daftar, supaya
 * setelah menonton atau membuka rincian lalu kembali, remote menunjuk kartu
 * itu lagi, bukan tombol Putar di puncak beranda yang berjarak sepuluh
 * tekanan tombol.
 *
 * Kartu dikenali lewat `data-tv-id` (tipe-id TMDB) dan judul barisnya, karena
 * judul yang sama bisa muncul di lebih dari satu baris. Urutan baris tidak
 * dipakai: baris Lanjutkan Menonton muncul setelah sebuah film ditonton dan
 * menggeser urutan semua baris di bawahnya.
 *
 * Posisi disimpan di sessionStorage per alamat dan dipakai sekali saja, dan
 * hanya bila pemirsa pergi dari sebuah kartu atau dari modal yang dibuka
 * kartu. Pergi lewat chip studio, tombol Putar di panel pembuka, atau bilah
 * menu tidak meninggalkan posisi apa pun.
 */
const STORAGE_KEY = 'tv:return-focus';

interface ReturnEntry {
    id: string;
    row: string;
}

type ReturnMap = Record<string, ReturnEntry>;

let lastCard: { url: string; entry: ReturnEntry } | null = null;

function readMap(): ReturnMap {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);

        return raw ? (JSON.parse(raw) as ReturnMap) : {};
    } catch {
        return {};
    }
}

function writeMap(map: ReturnMap): void {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Penyimpanan diblokir: pemulihan posisi dilewati, navigasi tetap jalan.
    }
}

function currentUrl(): string {
    return window.location.pathname + window.location.search;
}

/** Judul baris tempat sebuah elemen berada, dari h2 terdekat di atasnya. */
function rowTitle(element: Element): string {
    for (
        let node: Element | null = element.parentElement;
        node && node !== document.body;
        node = node.parentElement
    ) {
        const heading = node.querySelector('h2');

        if (heading) {
            return heading.textContent?.trim() ?? '';
        }
    }

    return '';
}

/** Dipasang sebagai pendengar focusin. Mencatat kartu terakhir di halaman ini. */
export function trackCardFocus(event: FocusEvent): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    const card = target.closest<HTMLElement>('[data-tv-id]');

    if (!card?.dataset.tvId) {
        return;
    }

    lastCard = {
        url: currentUrl(),
        entry: { id: card.dataset.tvId, row: rowTitle(card) },
    };
}

/** Dipanggil tepat sebelum meninggalkan halaman lewat kunjungan Inertia. */
export function rememberReturnFocus(): void {
    const url = currentUrl();
    const map = readMap();
    const focused = document.activeElement;
    const leavingFromCard =
        focused instanceof HTMLElement &&
        (focused.closest('[data-tv-id]') !== null ||
            focused.closest('[role="dialog"]') !== null);

    if (leavingFromCard && lastCard?.url === url) {
        map[url] = lastCard.entry;
    } else {
        delete map[url];
    }

    writeMap(map);
}

/** Membuang posisi tersimpan untuk halaman ini tanpa memakainya. */
export function discardReturnFocus(): false {
    const url = currentUrl();
    const map = readMap();

    if (map[url]) {
        delete map[url];
        writeMap(map);
    }

    return false;
}

/**
 * Dipanggil setelah halaman tujuan kunjungan kembali dirender. Mengembalikan
 * true bila sebuah kartu berhasil difokus ulang.
 */
export function restoreReturnFocus(): boolean {
    const url = currentUrl();
    const map = readMap();
    const entry = map[url];

    if (!entry) {
        return false;
    }

    delete map[url];
    writeMap(map);

    const cards = Array.from(
        document.querySelectorAll<HTMLElement>(
            `[data-tv-id="${CSS.escape(entry.id)}"]`,
        ),
    );
    const card =
        cards.find((candidate) => rowTitle(candidate) === entry.row) ??
        cards[0];

    if (!card) {
        return false;
    }

    focusTarget(card);

    return true;
}
