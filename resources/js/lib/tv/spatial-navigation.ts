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
 * - `data-tv-row`: wadah satu baris (rel film, deret chip). Kiri/kanan
 *   berhenti di ujungnya walaupun barisnya muat di layar.
 * - `data-tv-fixed`: bilah tetap di atas layar. Atas/bawah hanya menujunya
 *   bila tidak ada tujuan lain, karena bilah itu menimpa isi yang digulir
 *   di bawahnya dan secara geometris selalu tampak "paling dekat".
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

/** Sama dengan scroll-padding-top mode TV di app.css (tinggi bilah atas). */
const FIXED_HEADER_ROOM = 80;

/**
 * Jarak minimum antarlangkah saat panah ditahan. Remote mengirim ulang tombol
 * sekitar 20 kali per detik; tanpa batas ini fokus melompati belasan baris
 * dalam satu tahanan, dan di CPU TV yang lambat antrean tombol terus berjalan
 * sampai dua detik setelah tombol dilepas.
 */
const REPEAT_INTERVAL_MS = 120;

/** Tombol ulang yang sudah menunggu selama ini di antrean dibuang. */
const STALE_REPEAT_MS = 100;

const scopes: HTMLElement[] = [];

/**
 * Elemen isi terakhir yang difokus di luar bilah tetap. Bawah dari bilah atas
 * kembali ke sini, jadi Atas lalu Bawah selalu bisa dibalik.
 */
let lastContentFocus: HTMLElement | null = null;

let lastMoveAt = 0;

/**
 * Langkah terakhir. Menekan arah sebaliknya kembali ke elemen asal, jadi
 * Bawah lalu Atas selalu bisa dibalik walaupun perhitungan jarak dari elemen
 * tujuan menunjuk ke tempat lain (misalnya dari tombol halaman ke kartu).
 */
let lastStep: {
    from: HTMLElement;
    to: HTMLElement;
    direction: TvDirection;
} | null = null;

const OPPOSITE: Record<TvDirection, TvDirection> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
};

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
    // "Sebaris" berarti kotaknya benar-benar bertumpuk secara tegak, dengan
    // sedikit kelonggaran. Ambang setengah tinggi yang dulu dipakai membuat
    // Kanan dari tombol Kembali di pemutar turun ke baris server di bawahnya,
    // bukan ke tombol Episode di baris yang sama.
    if (
        sameRowOnly &&
        horizontal &&
        orthogonalGap > Math.min(8, origin.height * 0.25)
    ) {
        return null;
    }

    // Dari elemen yang jauh lebih lebar dari tujuannya (kolom pencarian di atas
    // kisi poster), kelurusan diukur dari tepi kiri, bukan dari tengah: Bawah
    // dari kolom pencarian mendarat di hasil pertama, bukan di poster keempat
    // yang kebetulan berada di bawah titik tengahnya.
    const alignByStart = !horizontal && origin.width > target.width * 2;

    const centerOffset = horizontal
        ? Math.abs(targetCenterY - originCenterY)
        : alignByStart
          ? Math.max(0, target.left - origin.left)
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
    if (element.closest('[data-tv-row]')) {
        return true;
    }

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

function isInFixedBar(element: Element): boolean {
    return element.closest('[data-tv-fixed]') !== null;
}

/** Terlihat utuh di jendela, bukan hanya tersisa beberapa piksel. */
function isUsable(element: HTMLElement): boolean {
    return element.isConnected && isInViewport(element);
}

/** Deret pilihan (baris, kelompok tombol) tempat sebuah elemen berada. */
function selectionGroup(element: HTMLElement): HTMLElement | null {
    return element.closest<HTMLElement>('[data-tv-row], [role="group"]');
}

function isSelected(element: HTMLElement): boolean {
    return (
        element.getAttribute('aria-pressed') === 'true' ||
        (element.hasAttribute('aria-current') &&
            element.getAttribute('aria-current') !== 'false')
    );
}

function findNext(
    from: HTMLElement,
    direction: TvDirection,
    candidates: HTMLElement[],
    scope: HTMLElement | Document,
): HTMLElement | null {
    if (
        lastStep &&
        lastStep.to === from &&
        lastStep.direction === OPPOSITE[direction] &&
        candidates.includes(lastStep.from) &&
        isUsable(lastStep.from)
    ) {
        return lastStep.from;
    }

    const next = findGeometric(from, direction, candidates, scope);

    // Masuk ke deret pilihan dari luar (daftar musim, chip studio) mendarat di
    // item yang sedang aktif, bukan di item yang kebetulan paling dekat.
    const group = next ? selectionGroup(next) : null;

    if (next && group && !group.contains(from)) {
        const selected = candidates.find(
            (candidate) =>
                group.contains(candidate) &&
                isSelected(candidate) &&
                isUsable(candidate),
        );

        if (selected) {
            return selected;
        }
    }

    return next;
}

function findGeometric(
    from: HTMLElement,
    direction: TvDirection,
    candidates: HTMLElement[],
    scope: HTMLElement | Document,
): HTMLElement | null {
    const fromFixedBar = isInFixedBar(from);
    const contentOnly = fromFixedBar
        ? candidates
        : candidates.filter((candidate) => !isInFixedBar(candidate));

    if (direction === 'up' || direction === 'down') {
        // Turun dari bilah atas: kembali ke tempat terakhir di isi halaman,
        // lalu ke tujuan pertama halaman, baru perhitungan jarak. Tanpa ini
        // tombol di kanan bilah atas jatuh ke chip paling kanan dan
        // melewatkan tombol Putar di kiri.
        if (fromFixedBar && direction === 'down' && scope === document) {
            const remembered =
                lastContentFocus &&
                isUsable(lastContentFocus) &&
                candidates.includes(lastContentFocus)
                    ? lastContentFocus
                    : candidates.find(
                          (candidate) =>
                              candidate.hasAttribute('data-tv-autofocus') &&
                              candidate.closest('main') &&
                              isUsable(candidate),
                      );

            if (remembered) {
                return remembered;
            }

            return findBest(
                from,
                direction,
                candidates.filter((candidate) => !isInFixedBar(candidate)),
                true,
            );
        }

        return (
            findBest(from, direction, contentOnly, true) ??
            findBest(from, direction, candidates, true)
        );
    }

    // Kiri/kanan di bilah atas tetap di bilah atas. Dulu ujung bilah
    // melompat ke kartu di bawahnya dan menggulir halaman.
    if (fromFixedBar) {
        return findBest(
            from,
            direction,
            candidates.filter((candidate) => isInFixedBar(candidate)),
            true,
        );
    }

    const sameRow = findBest(from, direction, candidates, true);

    if (sameRow) {
        return sameRow;
    }

    // Tata letak berkolom (daftar kanal di samping pemutar) butuh kiri/kanan
    // yang boleh pindah baris. Dibatasi ke elemen yang tampak di layar, tidak
    // ke bilah atas, dan tidak dari dalam rel: di ujung baris film, remote
    // berhenti, bukan melompat ke baris lain.
    if (isInHorizontalRail(from)) {
        return null;
    }

    return findBest(from, direction, contentOnly.filter(isInViewport), false);
}

/** Berada lebih dari setengah layar di luar jendela. */
function isFarOffscreen(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const marginY = window.innerHeight * 0.5;
    const marginX = window.innerWidth * 0.5;

    return (
        rect.bottom < -marginY ||
        rect.top > window.innerHeight + marginY ||
        rect.right < -marginX ||
        rect.left > window.innerWidth + marginX
    );
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

    // Di rel, geser kanan/kiri menaruh kartu terfokus di slot pertama, jadi
    // judul berikutnya yang tampak, bukan judul yang sudah dilewati. Peramban
    // menahan sendiri di ujung baris.
    const horizontalInRail =
        (direction === 'left' || direction === 'right') &&
        isInHorizontalRail(element);

    element.scrollIntoView({
        block: vertical ? 'center' : 'nearest',
        inline: horizontalInRail ? 'start' : 'nearest',
        behavior,
    });
}

/**
 * Memfokuskan elemen tertentu dengan aturan gulir yang sama seperti navigasi
 * panah. Dipakai untuk memulihkan posisi setelah kembali dari halaman lain.
 */
export function focusTarget(element: HTMLElement): void {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'instant',
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
    const isAutofocus = (element: HTMLElement) =>
        element.hasAttribute('data-tv-autofocus');

    // Di tingkat halaman, tujuan bertanda hanya dipakai bila tampak: setelah
    // kembali lewat riwayat, peramban memulihkan posisi gulir dan tombol
    // Putar di panel pembuka sudah jauh di atas layar. Di laci dan modal
    // aturan ini tidak berlaku, karena laci masih bergeser masuk saat fokus
    // dipasang dan episode aktif boleh berada di bawah daftar.
    const target =
        scope === document
            ? (candidates.find(
                  (element) => isAutofocus(element) && isInViewport(element),
              ) ??
              candidates.find(
                  (element) => element.closest('main') && isInViewport(element),
              ) ??
              candidates.find(isInViewport) ??
              candidates.find(isAutofocus) ??
              candidates[0])
            : (candidates.find(isAutofocus) ??
              candidates.find(
                  (element) => element.closest('main') && isInViewport(element),
              ) ??
              candidates.find(isInViewport) ??
              candidates[0]);

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

    // Fokus yang sudah tergulir jauh keluar layar (misalnya setelah peramban
    // memulihkan posisi gulir) tidak dipakai sebagai titik awal: pemirsa tidak
    // melihatnya, jadi langkah pertama memilih tujuan yang tampak. Tujuan
    // langkah panah sebelumnya tidak termasuk: saat tombol ditekan cepat
    // berturut-turut, fokus memang mendahului gulir halus halaman.
    if (
        !from ||
        !scope.contains(from) ||
        (scope === document &&
            from !== lastStep?.to &&
            !isInFixedBar(from) &&
            isFarOffscreen(from))
    ) {
        focusInitial(scope);

        return;
    }

    const next = findNext(from, direction, getFocusableElements(scope), scope);

    if (next) {
        lastStep = { from, to: next, direction };
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
        let step = container.clientHeight * FALLBACK_SCROLL_RATIO;

        // Di gulir halaman, langkah turun dibatasi agar elemen terfokus tidak
        // masuk ke bawah bilah atas yang tetap. Wadah dalam (laci, modal)
        // tidak punya bilah seperti itu.
        if (
            direction === 'down' &&
            container ===
                (document.scrollingElement ?? document.documentElement)
        ) {
            step = Math.max(
                0,
                Math.min(
                    step,
                    from.getBoundingClientRect().top - FIXED_HEADER_ROOM,
                ),
            );
        }

        if (step > 0) {
            container.scrollBy({
                top: (direction === 'down' ? 1 : -1) * step,
                behavior: instant ? 'instant' : 'smooth',
            });
        }
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

    if (event.repeat) {
        const now = performance.now();

        if (
            now - event.timeStamp > STALE_REPEAT_MS ||
            now - lastMoveAt < REPEAT_INTERVAL_MS
        ) {
            return;
        }
    }

    lastMoveAt = performance.now();
    moveFocus(direction, event.repeat);
}

function rememberContentFocus(event: FocusEvent): void {
    const target = event.target;

    if (
        target instanceof HTMLElement &&
        !isInFixedBar(target) &&
        activeScope() === document
    ) {
        lastContentFocus = target;
    }
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
    document.addEventListener('focusin', rememberContentFocus);
}
