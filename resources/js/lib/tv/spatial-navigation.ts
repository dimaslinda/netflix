import { isTvMode } from './tv-mode';

/**
 * Navigasi spasial untuk remote TV.
 *
 * Remote hanya punya empat panah dan OK. Tanpa lapisan ini, panah di WebView
 * menggeser halaman atau berpindah fokus mengikuti heuristik Chromium yang
 * sering melompat ke elemen tak terlihat (rel gulir, tombol yang baru muncul
 * saat disentuh tetikus) atau masuk ke iframe dan tidak bisa keluar lagi.
 *
 * Aturannya:
 * - Panah memindahkan fokus ke elemen terfokus terdekat ke arah itu, diukur
 *   dari kotak elemen di layar. Kiri/kanan hanya mencari di baris yang sama,
 *   supaya ujung satu baris film tidak melompat ke baris lain.
 * - Elemen yang difokus digulir ke tengah layar (atas/bawah) atau secukupnya
 *   (kiri/kanan, di dalam rel horizontal).
 * - Bila tidak ada tujuan, halaman diberi event `tv:edge` lebih dulu (misalnya
 *   untuk ganti kanal), lalu wadah yang bisa digulir digeser agar teks panjang
 *   tetap terbaca.
 * - Modal dan laci membatasi pencarian lewat pushFocusScope.
 *
 * Atribut yang dibaca:
 * - `data-tv-skip`: elemen ini dan seluruh isinya tidak pernah dituju.
 * - `data-tv-autofocus`: tujuan pertama saat halaman atau lingkup dibuka.
 */
export type TvDirection = 'up' | 'down' | 'left' | 'right';

export interface TvEdgeEventDetail {
    direction: TvDirection;
}

export const TV_EDGE_EVENT = 'tv:edge';

const KEY_DIRECTIONS: Record<string, TvDirection> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const NATIVE_INTERACTIVE_TAGS = new Set([
    'A',
    'BUTTON',
    'INPUT',
    'SELECT',
    'TEXTAREA',
]);

const TEXT_INPUT_TYPES = new Set([
    'text',
    'search',
    'email',
    'password',
    'url',
    'tel',
    'number',
]);

/** Luapan minimal (px) agar sebuah wadah dianggap rel gulir. */
const RAIL_OVERFLOW_THRESHOLD = 24;

/** Porsi tinggi wadah yang digeser saat panah tidak menemukan tujuan. */
const FALLBACK_SCROLL_RATIO = 0.4;

const scopes: HTMLElement[] = [];

/**
 * Membatasi navigasi ke dalam satu elemen (modal, laci, menu). Mengembalikan
 * fungsi pelepas. Lingkup terakhir yang masih terpasang di DOM yang berlaku.
 */
export function pushFocusScope(element: HTMLElement): () => void {
    scopes.push(element);

    return () => {
        const index = scopes.lastIndexOf(element);

        if (index !== -1) {
            scopes.splice(index, 1);
        }
    };
}

function activeScope(): HTMLElement | Document {
    for (let index = scopes.length - 1; index >= 0; index -= 1) {
        if (scopes[index].isConnected) {
            return scopes[index];
        }
    }

    // Dialog Radix dan dialog lain yang tidak mendaftar lewat pushFocusScope.
    const modals = document.querySelectorAll<HTMLElement>(
        '[aria-modal="true"]',
    );

    for (let index = modals.length - 1; index >= 0; index -= 1) {
        if (isRendered(modals[index], new Map())) {
            return modals[index];
        }
    }

    return document;
}

function isRendered(element: Element, cache: Map<Element, boolean>): boolean {
    const rect = element.getBoundingClientRect();

    if (rect.width < 1 || rect.height < 1) {
        return false;
    }

    // Opacity tidak diwariskan ke gaya terhitung anak, jadi leluhur diperiksa
    // satu per satu. Hasilnya disimpan karena kartu satu baris berbagi leluhur.
    for (
        let node: Element | null = element;
        node && node !== document.documentElement;
        node = node.parentElement
    ) {
        let visible = cache.get(node);

        if (visible === undefined) {
            const style = window.getComputedStyle(node);
            visible =
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                // Lebih dari nol, bukan ambang tertentu: elemen yang sedang
                // memudar masuk sudah boleh dituju.
                Number.parseFloat(style.opacity) > 0;
            cache.set(node, visible);
        }

        if (!visible) {
            return false;
        }
    }

    return true;
}

function containsReachableFocusable(element: HTMLElement): boolean {
    return Array.from(element.querySelectorAll(FOCUSABLE_SELECTOR)).some(
        (descendant) => !descendant.closest('[data-tv-skip]'),
    );
}

function getFocusableElements(scope: HTMLElement | Document): HTMLElement[] {
    const cache = new Map<Element, boolean>();

    return Array.from(
        scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => {
        if (element.closest('[data-tv-skip], [inert], [aria-hidden="true"]')) {
            return false;
        }

        // Wadah ber-tabindex yang berisi elemen terfokus lain (rel film yang
        // bisa digeser keyboard) bukan tujuan: kartunya yang dituju.
        if (
            !NATIVE_INTERACTIVE_TAGS.has(element.tagName) &&
            containsReachableFocusable(element)
        ) {
            return false;
        }

        return isRendered(element, cache);
    });
}

/** Jarak antara dua rentang satu dimensi, nol bila keduanya bertumpuk. */
function gapBetween(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
): number {
    return Math.max(0, startB - endA, startA - endB);
}

function scoreCandidate(
    origin: DOMRect,
    target: DOMRect,
    direction: TvDirection,
    sameRowOnly: boolean,
): number | null {
    const horizontal = direction === 'left' || direction === 'right';

    // Kartu yang sedang difokus diperbesar sedikit, jadi kotaknya boleh
    // bertumpuk tipis dengan tetangganya tanpa membatalkan arah.
    const tolerance = horizontal
        ? Math.min(origin.width, target.width) * 0.25
        : Math.min(origin.height, target.height) * 0.25;

    const originCenterX = origin.left + origin.width / 2;
    const originCenterY = origin.top + origin.height / 2;
    const targetCenterX = target.left + target.width / 2;
    const targetCenterY = target.top + target.height / 2;

    let primary: number;

    switch (direction) {
        case 'right':
            if (
                target.left < origin.right - tolerance ||
                targetCenterX <= originCenterX
            ) {
                return null;
            }
            primary = Math.max(0, target.left - origin.right);
            break;
        case 'left':
            if (
                target.right > origin.left + tolerance ||
                targetCenterX >= originCenterX
            ) {
                return null;
            }
            primary = Math.max(0, origin.left - target.right);
            break;
        case 'down':
            if (
                target.top < origin.bottom - tolerance ||
                targetCenterY <= originCenterY
            ) {
                return null;
            }
            primary = Math.max(0, target.top - origin.bottom);
            break;
        case 'up':
            if (
                target.bottom > origin.top + tolerance ||
                targetCenterY >= originCenterY
            ) {
                return null;
            }
            primary = Math.max(0, origin.top - target.bottom);
            break;
    }

    const orthogonalGap = horizontal
        ? gapBetween(origin.top, origin.bottom, target.top, target.bottom)
        : gapBetween(origin.left, origin.right, target.left, target.right);

    // Kiri/kanan diutamakan tetap di baris yang sama. Tanpa batas ini, kartu
    // tersembunyi di ujung rel lain (yang posisinya di luar layar kanan)
    // terpilih saat baris sekarang sudah habis.
    if (sameRowOnly && horizontal && orthogonalGap > origin.height * 0.5) {
        return null;
    }

    const centerOffset = horizontal
        ? Math.abs(targetCenterY - originCenterY)
        : Math.abs(targetCenterX - originCenterX);

    return primary + orthogonalGap * 3 + centerOffset * 0.25;
}

function findBest(
    from: HTMLElement,
    direction: TvDirection,
    candidates: HTMLElement[],
    sameRowOnly: boolean,
): HTMLElement | null {
    const origin = from.getBoundingClientRect();
    let best: HTMLElement | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
        if (
            candidate === from ||
            candidate.contains(from) ||
            from.contains(candidate)
        ) {
            continue;
        }

        const score = scoreCandidate(
            origin,
            candidate.getBoundingClientRect(),
            direction,
            sameRowOnly,
        );

        if (score !== null && score < bestScore) {
            best = candidate;
            bestScore = score;
        }
    }

    return best;
}

/** Berada di dalam rel yang menggulir mendatar (baris film, deret chip). */
function isInHorizontalRail(element: HTMLElement): boolean {
    for (
        let node: HTMLElement | null = element.parentElement;
        node && node !== document.body;
        node = node.parentElement
    ) {
        const { overflowX } = window.getComputedStyle(node);

        // Ambang 24px: kartu terfokus yang diperbesar membuat daftar vertikal
        // ikut melebar beberapa piksel, dan itu bukan rel. Wadah yang juga
        // menggulir tegak (daftar kanal) bukan rel.
        if (
            (overflowX === 'auto' || overflowX === 'scroll') &&
            node.scrollWidth - node.clientWidth > RAIL_OVERFLOW_THRESHOLD &&
            node.scrollHeight - node.clientHeight <= RAIL_OVERFLOW_THRESHOLD
        ) {
            return true;
        }
    }

    return false;
}

function findNext(
    from: HTMLElement,
    direction: TvDirection,
    candidates: HTMLElement[],
): HTMLElement | null {
    const sameRow = findBest(from, direction, candidates, true);

    if (sameRow || direction === 'up' || direction === 'down') {
        return sameRow;
    }

    // Tata letak berkolom (daftar kanal di samping pemutar) butuh kiri/kanan
    // yang boleh pindah baris. Dibatasi ke elemen yang tampak di layar, dan
    // tidak dari dalam rel: di ujung baris film, remote berhenti, bukan
    // melompat ke baris lain.
    if (isInHorizontalRail(from)) {
        return null;
    }

    return findBest(from, direction, candidates.filter(isInViewport), false);
}

function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
    );
}

function focusElement(
    element: HTMLElement,
    direction: TvDirection | null,
    instant: boolean,
): void {
    element.focus({ preventScroll: true });

    const behavior: ScrollBehavior = instant ? 'instant' : 'smooth';
    const vertical = direction === 'up' || direction === 'down';

    // Elemen di layar pertama halaman: gulir ke paling atas agar panel pembuka
    // tampil utuh, bukan terpotong karena elemennya dipusatkan.
    if (
        direction === 'up' &&
        activeScope() === document &&
        element.getBoundingClientRect().top + window.scrollY <
            window.innerHeight * 0.6
    ) {
        window.scrollTo({ top: 0, behavior });

        return;
    }

    element.scrollIntoView({
        block: vertical ? 'center' : 'nearest',
        inline: 'nearest',
        behavior,
    });
}

function scrollableAncestor(element: Element): Element {
    for (
        let node: Element | null = element.parentElement;
        node && node !== document.body;
        node = node.parentElement
    ) {
        const { overflowY } = window.getComputedStyle(node);

        if (
            (overflowY === 'auto' || overflowY === 'scroll') &&
            node.scrollHeight > node.clientHeight
        ) {
            return node;
        }
    }

    return document.scrollingElement ?? document.documentElement;
}

/**
 * Memfokuskan tujuan pertama di sebuah lingkup: elemen bertanda
 * data-tv-autofocus, lalu elemen pertama di <main> yang terlihat, lalu elemen
 * pertama yang terlihat. Mengembalikan false bila lingkupnya kosong.
 */
export function focusInitial(scope: HTMLElement | Document = activeScope()) {
    const candidates = getFocusableElements(scope);
    const target =
        candidates.find((element) =>
            element.hasAttribute('data-tv-autofocus'),
        ) ??
        candidates.find(
            (element) => element.closest('main') && isInViewport(element),
        ) ??
        candidates.find(isInViewport) ??
        candidates[0];

    if (!target) {
        return false;
    }

    focusElement(target, null, true);

    return true;
}

function currentFocus(): HTMLElement | null {
    const element = document.activeElement;

    return element instanceof HTMLElement && element !== document.body
        ? element
        : null;
}

/** Elemen yang memakai panah untuk dirinya sendiri (kursor teks, slider). */
function handlesArrowItself(
    element: HTMLElement,
    direction: TvDirection,
): boolean {
    if (element.isContentEditable || element instanceof HTMLTextAreaElement) {
        return true;
    }

    if (!(element instanceof HTMLInputElement)) {
        return false;
    }

    const horizontal = direction === 'left' || direction === 'right';

    if (element.type === 'range') {
        return horizontal;
    }

    if (!TEXT_INPUT_TYPES.has(element.type) || !horizontal) {
        return false;
    }

    const { selectionStart, selectionEnd, value } = element;

    if (selectionStart === null || selectionEnd === null) {
        return false;
    }

    if (selectionStart !== selectionEnd) {
        return true;
    }

    // Panah keluar dari kolom hanya ketika kursor teks sudah di ujungnya.
    return direction === 'left'
        ? selectionStart > 0
        : selectionEnd < value.length;
}

export function moveFocus(direction: TvDirection, instant = false): void {
    const scope = activeScope();
    const from = currentFocus();

    if (!from || !scope.contains(from)) {
        focusInitial(scope);

        return;
    }

    const next = findNext(from, direction, getFocusableElements(scope));

    if (next) {
        focusElement(next, direction, instant);

        return;
    }

    const edge = new CustomEvent<TvEdgeEventDetail>(TV_EDGE_EVENT, {
        bubbles: true,
        cancelable: true,
        detail: { direction },
    });

    if (!from.dispatchEvent(edge)) {
        return;
    }

    if (direction === 'up' || direction === 'down') {
        const container = scrollableAncestor(from);
        container.scrollBy({
            top:
                (direction === 'down' ? 1 : -1) *
                container.clientHeight *
                FALLBACK_SCROLL_RATIO,
            behavior: instant ? 'instant' : 'smooth',
        });
    }
}

function handleKeyDown(event: KeyboardEvent): void {
    if (
        !isTvMode() ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
    ) {
        return;
    }

    // OK ditekan tanpa ada yang difokus: tombol itu jangan sampai mati.
    if (event.key === 'Enter' && !currentFocus()) {
        event.preventDefault();
        focusInitial();

        return;
    }

    const direction = KEY_DIRECTIONS[event.key];

    if (!direction) {
        return;
    }

    const focused = currentFocus();

    if (focused && handlesArrowItself(focused, direction)) {
        return;
    }

    event.preventDefault();
    moveFocus(direction, event.repeat);
}

let installed = false;

/**
 * Dipasang sekali dari app.tsx. Pendengar berada di fase bubble pada window,
 * jadi komponen yang menangani panah sendiri cukup memanggil preventDefault.
 */
export function installSpatialNavigation(): void {
    if (installed || typeof window === 'undefined') {
        return;
    }

    installed = true;
    window.addEventListener('keydown', handleKeyDown);
}
