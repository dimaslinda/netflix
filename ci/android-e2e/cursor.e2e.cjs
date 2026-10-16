'use strict';

/**
 * Uji ujung-ke-ujung kursor remote native di emulator Android TV.
 *
 * Yang dibuktikan, berurutan:
 * B  APK memuat jembatan Capacitor dan plugin TvRemote, dan halaman tonton
 *    (kode web dari commit yang sama) melihat kursor tersedia.
 * C  "Kendalikan Pemutar" menyalakan kursor native, panah menggesernya,
 *    dan OK menjadi ketukan sungguhan di dalam iframe lintas asal.
 * D  Kembali mematikan kursor dan mengembalikan remote ke menu halaman.
 *
 * Tombol remote dikirim lewat `adb shell input keyevent`, jadi jalurnya sama
 * dengan remote fisik: MainActivity.dispatchKeyEvent -> RemoteCursor. Kursor
 * digambar sebagai View native di atas WebView, sehingga hanya terlihat di
 * tangkapan layar perangkat (screencap), bukan di tangkapan layar DevTools.
 *
 * Satu-satunya campur tangan pada halaman: atribut src iframe pemutar diganti
 * ke fixture lintas asal setelah halaman termuat. Kode produksi tidak punya
 * kait uji apa pun.
 *
 * Hasil: <E2E_OUT>/results.json, shots/*.png, console.txt. Anotasi GitHub
 * dibuat terpisah oleh report.cjs.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CFG = {
    pkg: process.env.E2E_PACKAGE || 'com.netflix.app',
    appOrigin: process.env.E2E_APP_ORIGIN || 'http://10.0.2.2:8000',
    fixtureUrl:
        process.env.E2E_FIXTURE_URL || 'http://10.0.2.2:8001/player.html',
    startPath: process.env.E2E_START_PATH || '/watch/movie/550',
    expectTv: process.env.E2E_EXPECT_TV === 'true',
    probeRealPlayer: process.env.E2E_PROBE_REAL_PLAYER === 'true',
    out: path.resolve(process.env.E2E_OUT || 'e2e-out'),
    fixtureLog: process.env.E2E_FIXTURE_LOG || '',
};

/** Harus sama dengan konstanta di RemoteCursor.java. */
const CURSOR = { baseStepDp: 14, radiusDp: 11 };

/** Toleransi posisi: piksel CSS untuk ketukan, piksel layar untuk kursor. */
const TOL = { css: 3, px: 8 };

/**
 * Teks dari Watch.tsx (remoteStatusText dan RemotePlayerHint). Tanpa plugin,
 * menu menampilkan pesan "masih versi lama" dan tombol kendali tidak ada.
 */
const TEXT = {
    controlButton: 'Kendalikan Pemutar',
    headerHintCursor: 'lalu gerakkan kursor',
    headerHintFallback: 'masih versi lama',
    playerHintCursor: 'Panah menggerakkan kursor',
    playerHintFallback: 'Kursor remote tidak tersedia',
};

const IFRAME_SELECTOR = 'iframe[title^="Pemutar"]';
const MOVE_RIGHT = 5;
const MOVE_DOWN = 3;

class Abort extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (n) => (typeof n === 'number' ? Math.round(n) : n);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function createReport(cfg) {
    const report = {
        startedAt: new Date().toISOString(),
        config: { ...cfg },
        info: {},
        assertions: [],
    };

    function add(id, ok, level, msg, data) {
        report.assertions.push({
            id,
            ok: Boolean(ok),
            level,
            msg,
            data: data ?? null,
        });
        const tag = ok ? 'PASS' : level === 'soft' ? 'WARN' : 'FAIL';
        console.log(`${tag} ${id} - ${msg}`);

        return Boolean(ok);
    }

    return {
        report,
        /** Wajib, dan langkah berikutnya bergantung padanya: gagal = berhenti. */
        must(id, ok, msg, data) {
            add(id, ok, 'must', msg, data);
            if (!ok) {
                throw new Abort(`${id}: ${msg}`);
            }

            return true;
        },
        /** Wajib, tetapi uji tetap lanjut supaya bukti lain ikut terkumpul. */
        check: (id, ok, msg, data) => add(id, ok, 'check', msg, data),
        /** Pengamatan; tidak menggagalkan job. */
        soft: (id, ok, msg, data) => add(id, ok, 'soft', msg, data),
        info(key, value) {
            report.info[key] = value;
        },
    };
}

/** Mengulang fn sampai mengembalikan { ok: true } atau waktu habis. */
async function waitFor(fn, timeout = 5000, interval = 250) {
    const end = Date.now() + timeout;
    let last = { ok: false };

    do {
        try {
            last = (await fn()) || { ok: false };
        } catch (error) {
            last = {
                ok: false,
                error: String(error && error.message ? error.message : error),
            };
        }

        if (last.ok) {
            return last;
        }

        await sleep(interval);
    } while (Date.now() < end);

    return last;
}

/**
 * Lingkaran putih kursor native di sekitar (cx, cy), dalam piksel layar.
 * Mengembalikan jumlah piksel putih dan titik beratnya.
 */
function findWhiteBlob(png, cx, cy, half = 100) {
    const x0 = Math.max(0, Math.round(cx - half));
    const x1 = Math.min(png.width - 1, Math.round(cx + half));
    const y0 = Math.max(0, Math.round(cy - half));
    const y1 = Math.min(png.height - 1, Math.round(cy + half));
    let count = 0;
    let sx = 0;
    let sy = 0;

    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const i = (png.width * y + x) << 2;

            if (
                png.data[i] >= 235 &&
                png.data[i + 1] >= 235 &&
                png.data[i + 2] >= 235
            ) {
                count++;
                sx += x;
                sy += y;
            }
        }
    }

    return {
        count,
        x: count ? sx / count : null,
        y: count ? sy / count : null,
    };
}

/** Batas luas lingkaran kursor, dari radius 11dp dan cincin 3dp. */
function blobLimits(dpr) {
    const inner = Math.max(1, (CURSOR.radiusDp - 2) * dpr);
    const outer = (CURSOR.radiusDp + 2) * dpr;

    return {
        min: Math.PI * inner * inner * 0.5,
        max: Math.PI * outer * outer * 1.5,
    };
}

function isCursorAt(blob, expected, dpr) {
    const limits = blobLimits(dpr);

    return (
        blob.count >= limits.min &&
        blob.count <= limits.max &&
        blob.x !== null &&
        dist(blob, expected) <= TOL.px
    );
}

function isCursorAbsent(blob, dpr) {
    return blob.count < blobLimits(dpr).min * 0.2;
}

/** Posisi kursor yang diharapkan dalam piksel layar. */
function cursorPx(vp, offset, dxDp, dyDp) {
    return {
        x: offset.x + (vp.w * vp.dpr) / 2 + dxDp * vp.dpr,
        y: offset.y + (vp.h * vp.dpr) / 2 + dyDp * vp.dpr,
    };
}

function describeBlob(blob) {
    return blob.x === null
        ? `${blob.count} px putih`
        : `${blob.count} px putih, pusat (${round(blob.x)},${round(blob.y)})`;
}

function androidDriver(device) {
    const serial = device.serial();

    return {
        name: 'android',
        async key(...codes) {
            await device.shell(`input keyevent ${codes.join(' ')}`);
        },
        async screencap() {
            try {
                return execFileSync(
                    'adb',
                    ['-s', serial, 'exec-out', 'screencap', '-p'],
                    {
                        maxBuffer: 1 << 26,
                    },
                );
            } catch {
                return await device.screenshot();
            }
        },
        async shell(command) {
            return (await device.shell(command)).toString();
        },
    };
}

async function activeLabel(page) {
    return page.evaluate(() => {
        const el = document.activeElement;

        if (!el || el === document.body) {
            return '(body)';
        }

        const label =
            el.getAttribute('aria-label') || el.textContent || el.tagName;

        return `${el.tagName.toLowerCase()}: ${label.replace(/\s+/g, ' ').trim().slice(0, 60)}`;
    });
}

async function parentState(page) {
    return page.evaluate(() => ({
        keys: window.__e2eParent.keys.slice(),
        clicks: window.__e2eParent.clicks,
    }));
}

async function fixtureState(frame) {
    return frame.evaluate(() => ({
        clicks: window.__e2e.clicks.slice(),
        pointerdowns: window.__e2e.pointerdowns.length,
        touches: window.__e2e.touches.length,
        moves: window.__e2e.moves.length,
        lastMove: window.__e2e.moves[window.__e2e.moves.length - 1] || null,
    }));
}

/**
 * Letak WebView di layar. Di TV WebView memenuhi layar; selain itu (image HP
 * sebagai cadangan) batasnya dibaca dari uiautomator.
 */
async function webViewOffset(png, vp, driver) {
    const w = Math.round(vp.w * vp.dpr);
    const h = Math.round(vp.h * vp.dpr);

    if (Math.abs(png.width - w) <= 2 && Math.abs(png.height - h) <= 2) {
        return { x: 0, y: 0, source: 'layar penuh' };
    }

    if (driver.shell) {
        try {
            await driver.shell('uiautomator dump /sdcard/e2e-ui.xml');
            const xml = await driver.shell('cat /sdcard/e2e-ui.xml');
            const match = xml.match(
                /class="android\.webkit\.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/,
            );

            if (match) {
                return { x: +match[1], y: +match[2], source: 'uiautomator' };
            }
        } catch {
            // uiautomator bisa gagal bila layar terus beranimasi.
        }
    }

    return { x: 0, y: Math.max(0, png.height - h), source: 'tebakan' };
}

async function runFlow({ page, driver, r, cfg, PNG }) {
    page.setDefaultTimeout(15000);

    let shotIndex = 0;
    const shotsDir = path.join(cfg.out, 'shots');
    fs.mkdirSync(shotsDir, { recursive: true });

    function save(name, buffer) {
        shotIndex += 1;
        fs.writeFileSync(
            path.join(
                shotsDir,
                `${String(shotIndex).padStart(2, '0')}-${name}.png`,
            ),
            buffer,
        );
    }

    async function shot(name) {
        const buffer = await driver.screencap();
        save(name, buffer);

        return PNG.sync.read(buffer);
    }

    /** Menangkap layar berulang sampai test(png) lulus; tangkapan terakhir disimpan. */
    async function waitForScreen(name, test, timeout = 6000) {
        let buffer = null;
        const result = await waitFor(
            async () => {
                buffer = await driver.screencap();

                return test(PNG.sync.read(buffer));
            },
            timeout,
            600,
        );

        if (buffer) {
            save(name, buffer);
        }

        return result;
    }

    function waitForCursor(name, expected, dpr) {
        return waitForScreen(name, (png) => {
            const blob = findWhiteBlob(png, expected.x, expected.y);

            return { ok: isCursorAt(blob, expected, dpr), blob };
        });
    }

    // ---- B. Jembatan, plugin, mode TV ------------------------------------

    const loaded = await waitFor(
        async () => {
            const s = await page.evaluate(
                (sel) => ({
                    path: location.pathname,
                    search: location.search,
                    iframe: Boolean(document.querySelector(sel)),
                }),
                IFRAME_SELECTOR,
            );

            return { ok: s.path.startsWith('/watch') && s.iframe, s };
        },
        60000,
        500,
    );
    r.must(
        'B1.watch-page',
        loaded.ok,
        loaded.ok
            ? `Halaman tonton termuat dari ${cfg.appOrigin}${loaded.s.path}${loaded.s.search}`
            : `Halaman tonton tidak termuat: ${JSON.stringify(loaded.s || loaded.error || null)}`,
    );

    const bridge = await page.evaluate(() => {
        const cap = window.Capacitor || {};
        const headers = Array.isArray(cap.PluginHeaders)
            ? cap.PluginHeaders
            : [];
        const tv = headers.find((h) => h.name === 'TvRemote');

        return {
            androidBridge: typeof window.androidBridge !== 'undefined',
            platform:
                typeof cap.getPlatform === 'function'
                    ? cap.getPlatform()
                    : null,
            native:
                typeof cap.isNativePlatform === 'function'
                    ? cap.isNativePlatform()
                    : null,
            nativePromise: typeof cap.nativePromise === 'function',
            plugins: headers.map((h) => h.name),
            tvMethods: tv ? tv.methods.map((m) => m.name) : null,
        };
    });
    r.info('bridge', bridge);
    r.must(
        'B2.bridge',
        bridge.native === true &&
            bridge.platform === 'android' &&
            bridge.nativePromise,
        `Capacitor platform=${bridge.platform}, native=${bridge.native}, plugin=[${bridge.plugins.join(',')}]`,
    );
    r.must(
        'B3.plugin-header',
        Boolean(bridge.tvMethods) &&
            ['getInfo', 'setCursorMode'].every((m) =>
                bridge.tvMethods.includes(m),
            ),
        `TvRemote di PluginHeaders: ${bridge.tvMethods ? bridge.tvMethods.join(',') : 'TIDAK ADA (APK lama?)'}`,
    );

    // Langsung ke native, melewati native-remote.ts: membuktikan sisi Java.
    const info = await page
        .evaluate(() =>
            window.Capacitor.nativePromise('TvRemote', 'getInfo', {}),
        )
        .catch((error) => ({
            error: String(error && error.message ? error.message : error),
        }));
    r.info('getInfo', info);
    r.must(
        'B4.getInfo-cursor',
        info && info.cursor === true,
        `TvRemote.getInfo() = ${JSON.stringify(info)}`,
    );
    r.check(
        'B4.getInfo-version',
        Boolean(info && info.versionName) && Number(info.versionCode) > 1000,
        `Versi APK yang dilaporkan: ${info && info.versionName} (${info && info.versionCode})`,
    );
    if (cfg.expectTv) {
        r.check(
            'B4.getInfo-television',
            info.television === true,
            `television=${info.television} di image TV`,
        );
    }

    const tvState = await waitFor(async () => {
        const s = await page.evaluate(() => {
            let override = null;
            try {
                override = localStorage.getItem('layar:tv-mode');
            } catch {
                override = 'diblokir';
            }

            return {
                tv: document.documentElement.classList.contains('tv-mode'),
                noPointer: matchMedia('(any-pointer: none)').matches,
                override,
                query: location.search,
            };
        });

        return { ok: s.tv, s };
    }, 10000);
    r.info('tvMode', tvState.s);
    r.must(
        'B5.tv-mode',
        tvState.ok,
        `html.tv-mode=${tvState.s && tvState.s.tv}, any-pointer:none=${tvState.s && tvState.s.noPointer}, ` +
            `penimpaan=${tvState.s && tvState.s.override}, query=${(tvState.s && tvState.s.query) || '-'}`,
    );

    // Gejala dari TV: teks cadangan muncul karena hasCursor=false.
    const hint = await waitFor(async () => {
        const s = await page.evaluate((txt) => {
            const text = document.body.innerText;

            return {
                cursor: text.includes(txt.headerHintCursor),
                fallback: text.includes(txt.headerHintFallback),
            };
        }, TEXT);

        return { ok: s.cursor, s };
    }, 10000);
    r.must(
        'B6.ui-has-cursor',
        hint.ok,
        hint.ok
            ? 'Menu tonton memakai teks jalur kursor (hasCursor=true)'
            : `Menu tonton tidak memakai teks jalur kursor (cadangan=${hint.s && hint.s.fallback}); gejala yang sama dengan laporan TV`,
    );

    const focus = await waitFor(async () => {
        const label = await activeLabel(page);

        return { ok: label.includes(TEXT.controlButton), label };
    }, 10000);
    r.check('B7.autofocus', focus.ok, `Fokus awal remote: ${focus.label}`);
    if (!focus.ok) {
        // Supaya bukti kursor tetap terkumpul; kegagalan fokus sudah tercatat.
        await page.getByRole('button', { name: TEXT.controlButton }).focus();
    }

    // ---- C. Kursor native di atas iframe lintas asal ---------------------

    const originalSrc = await page.evaluate(
        ([sel, url]) => {
            const frame = document.querySelector(sel);
            const previous = frame.getAttribute('src');
            frame.setAttribute('src', url);

            return previous;
        },
        [IFRAME_SELECTOR, cfg.fixtureUrl],
    );
    r.info('originalIframeSrc', originalSrc);

    const fixtureOrigin = new URL(cfg.fixtureUrl).origin;
    const fixture = await waitFor(
        async () => {
            const frame = page
                .frames()
                .find((f) => f.url().startsWith(fixtureOrigin));

            if (!frame) {
                return { ok: false };
            }

            const ready = await frame.evaluate(() =>
                Boolean(window.__e2e && window.__e2e.ready),
            );

            return { ok: ready, frame };
        },
        20000,
        500,
    );
    r.must(
        'C1.fixture-loaded',
        fixture.ok,
        fixture.ok
            ? `Fixture termuat di iframe pemutar (${fixtureOrigin})`
            : 'Fixture tidak termuat di iframe pemutar',
    );
    const frame = fixture.frame;

    await sleep(1500);
    const iframeState = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        let blocked = false;
        try {
            void el.contentWindow.document.body;
        } catch {
            blocked = true;
        }
        const rect = el.getBoundingClientRect();

        return {
            src: el.getAttribute('src'),
            crossOrigin: blocked,
            w: innerWidth,
            h: innerHeight,
            dpr: devicePixelRatio,
            iframe: {
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height,
            },
        };
    }, IFRAME_SELECTOR);
    r.check(
        'C1.cross-origin',
        iframeState.crossOrigin && iframeState.src === cfg.fixtureUrl,
        `Induk ${iframeState.crossOrigin ? 'tidak bisa' : 'BISA'} membaca isi iframe; src tetap fixture=${iframeState.src === cfg.fixtureUrl}`,
    );

    const vp = {
        w: iframeState.w,
        h: iframeState.h,
        dpr: iframeState.dpr,
        iframe: iframeState.iframe,
    };
    r.info('viewport', vp);
    const centerCss = { x: vp.w / 2, y: vp.h / 2 };
    const insideIframe =
        centerCss.x >= vp.iframe.x &&
        centerCss.x <= vp.iframe.x + vp.iframe.w &&
        centerCss.y >= vp.iframe.y &&
        centerCss.y <= vp.iframe.y + vp.iframe.h;
    r.check(
        'C1.iframe-covers-center',
        insideIframe,
        `Viewport ${vp.w}x${vp.h}@${vp.dpr}x, iframe (${round(vp.iframe.x)},${round(vp.iframe.y)}) ${round(vp.iframe.w)}x${round(vp.iframe.h)}`,
    );

    await page.evaluate(() => {
        const s = (window.__e2eParent = { keys: [], clicks: 0 });
        window.addEventListener('keydown', (e) => s.keys.push(e.key), true);
        document.addEventListener(
            'click',
            () => {
                s.clicks += 1;
            },
            true,
        );
    });

    const png = await shot('menu-sebelum-kendali');
    const offset = await webViewOffset(png, vp, driver);
    r.info('webViewOffset', offset);
    r.info('screen', { w: png.width, h: png.height });
    const center = cursorPx(vp, offset, 0, 0);
    const before = findWhiteBlob(png, center.x, center.y);
    r.check(
        'C2.no-cursor-before',
        isCursorAbsent(before, vp.dpr),
        `Sebelum kendali, tengah layar: ${describeBlob(before)}`,
    );

    // OK pertama: menu masih memegang remote, jadi tombol fokus ditekan.
    await driver.key('KEYCODE_DPAD_CENTER');
    const player = await waitFor(async () => {
        const s = await page.evaluate((txt) => {
            const hints = Array.from(
                document.querySelectorAll('p[role="status"]'),
            ).map((p) => p.textContent || '');

            return {
                cursorHint: hints.some((t) => t.includes(txt.playerHintCursor)),
                fallbackHint: hints.some((t) =>
                    t.includes(txt.playerHintFallback),
                ),
                inert: Boolean(document.querySelector('header[inert]')),
            };
        }, TEXT);

        return { ok: s.cursorHint && s.inert, s };
    }, 8000);
    r.must(
        'C3.player-mode',
        player.ok,
        player.ok
            ? 'Kendalikan Pemutar: menu menyingkir, petunjuk jalur kursor tampil'
            : `Mode pemutar tidak sesuai: ${JSON.stringify(player.s || player.error || null)}`,
    );

    const shown = await waitForCursor('kursor-menyala', center, vp.dpr);
    r.must(
        'C3.cursor-visible',
        shown.ok,
        `Kursor native di tengah: ${describeBlob(shown.blob || { count: 0, x: null })}, harapan (${round(center.x)},${round(center.y)})`,
    );

    const hover = await fixtureState(frame);
    r.soft(
        'C3.hover-reaches-iframe',
        hover.moves > 0,
        `pointermove di iframe saat kursor menyala: ${hover.moves}`,
    );

    await page.evaluate(() => {
        window.__e2eParent.keys.length = 0;
        window.__e2eParent.clicks = 0;
    });

    // OK kedua: kursor memegang remote, jadi OK menjadi ketukan.
    await driver.key('KEYCODE_DPAD_CENTER');
    const tap1 = await waitFor(async () => {
        const s = await fixtureState(frame);

        return { ok: s.clicks.length >= 1, s };
    }, 6000);
    r.must(
        'C4.tap-in-iframe',
        tap1.ok,
        tap1.ok
            ? `OK menjadi klik di iframe lintas asal (pointerdown=${tap1.s.pointerdowns}, touchstart=${tap1.s.touches})`
            : `Tidak ada klik di iframe: ${JSON.stringify(tap1.s || tap1.error || null)}`,
    );

    const c1 = tap1.s.clicks[0];
    const expected1 = {
        x: centerCss.x - vp.iframe.x,
        y: centerCss.y - vp.iframe.y,
    };
    r.info('tap1', c1);
    r.check(
        'C4.tap-trusted',
        c1.trusted === true,
        `isTrusted=${c1.trusted}, pointerType="${c1.pointerType}"`,
    );
    r.check(
        'C4.tap-position',
        dist(c1, expected1) <= TOL.css,
        `Klik di (${round(c1.x)},${round(c1.y)}), harapan (${round(expected1.x)},${round(expected1.y)}) px CSS`,
    );

    const parent1 = await parentState(page);
    r.check(
        'C4.key-consumed-native',
        parent1.keys.length === 0 && parent1.clicks === 0,
        `Halaman induk menerima ${parent1.keys.length} keydown [${parent1.keys.join(',')}] dan ${parent1.clicks} klik`,
    );

    // Geser: tiap tekan satu langkah dasar, karena input keyevent tidak berulang.
    await driver.key(
        ...Array(MOVE_RIGHT).fill('KEYCODE_DPAD_RIGHT'),
        ...Array(MOVE_DOWN).fill('KEYCODE_DPAD_DOWN'),
    );
    const moved = cursorPx(
        vp,
        offset,
        MOVE_RIGHT * CURSOR.baseStepDp,
        MOVE_DOWN * CURSOR.baseStepDp,
    );
    const movedShot = await waitForCursor('kursor-bergeser', moved, vp.dpr);
    r.check(
        'C5.cursor-moves',
        movedShot.ok,
        `Sesudah ${MOVE_RIGHT}x kanan ${MOVE_DOWN}x bawah: ${describeBlob(movedShot.blob || { count: 0, x: null })}, harapan (${round(moved.x)},${round(moved.y)})`,
    );

    const parent2 = await parentState(page);
    r.check(
        'C5.arrows-consumed-native',
        parent2.keys.length === 0,
        `Halaman induk menerima ${parent2.keys.length} keydown selama kursor menyala [${parent2.keys.join(',')}]`,
    );

    const expected2 = {
        x: expected1.x + MOVE_RIGHT * CURSOR.baseStepDp,
        y: expected1.y + MOVE_DOWN * CURSOR.baseStepDp,
    };
    const afterMove = await fixtureState(frame);
    r.soft(
        'C5.hover-follows',
        Boolean(afterMove.lastMove) &&
            dist(afterMove.lastMove, expected2) <= TOL.css,
        afterMove.lastMove
            ? `pointermove terakhir (${round(afterMove.lastMove.x)},${round(afterMove.lastMove.y)}) pointerType="${afterMove.lastMove.pointerType}", harapan (${round(expected2.x)},${round(expected2.y)})`
            : 'Tidak ada pointermove di iframe',
    );

    await driver.key('KEYCODE_DPAD_CENTER');
    const tap2 = await waitFor(async () => {
        const s = await fixtureState(frame);

        return { ok: s.clicks.length >= 2, s };
    }, 6000);
    const c2 = tap2.ok ? tap2.s.clicks[1] : null;
    r.info('tap2', c2);
    r.check(
        'C6.tap-follows-cursor',
        Boolean(c2) && dist(c2, expected2) <= TOL.css,
        c2
            ? `Klik kedua di (${round(c2.x)},${round(c2.y)}), harapan (${round(expected2.x)},${round(expected2.y)})`
            : 'Klik kedua tidak sampai ke iframe',
    );

    if (cfg.fixtureLog && fs.existsSync(cfg.fixtureLog)) {
        const logged = (
            fs
                .readFileSync(cfg.fixtureLog, 'utf8')
                .match(/GET \/beacon\.txt\?kind=click/g) || []
        ).length;
        r.soft(
            'C7.server-saw-taps',
            logged >= 2,
            `Server fixture mencatat ${logged} permintaan klik`,
        );
    }

    // ---- D. Kembali melepas kursor --------------------------------------

    await driver.key('KEYCODE_BACK');
    const menu = await waitFor(async () => {
        const s = await page.evaluate(() => ({
            inert: Boolean(document.querySelector('header[inert]')),
            path: location.pathname,
        }));

        return { ok: !s.inert, s };
    }, 8000);
    r.check(
        'D1.back-releases',
        menu.ok,
        menu.ok
            ? 'Kembali pertama: menu tampil lagi'
            : 'Kembali pertama tidak memunculkan menu',
    );
    r.check(
        'D1.stays-on-watch',
        Boolean(menu.s) && menu.s.path.startsWith('/watch'),
        `Sesudah Kembali pertama: ${menu.s ? menu.s.path : '?'}`,
    );

    const gone = await waitForScreen(
        'sesudah-kembali',
        (shotPng) => {
            const blob = findWhiteBlob(shotPng, moved.x, moved.y);

            return { ok: isCursorAbsent(blob, vp.dpr), blob };
        },
        5000,
    );
    r.check(
        'D1.cursor-hidden',
        gone.ok,
        `Sesudah Kembali, posisi kursor terakhir: ${describeBlob(gone.blob || { count: 0, x: null })}`,
    );

    const restored = await waitFor(async () => {
        const label = await activeLabel(page);

        return { ok: label.includes(TEXT.controlButton), label };
    }, 4000);
    r.check(
        'D1.focus-restored',
        restored.ok,
        `Fokus sesudah Kembali: ${restored.label}`,
    );

    await page.evaluate(() => {
        window.__e2eParent.keys.length = 0;
    });
    // Bawah, bukan kanan: untuk film tidak ada tombol di kanan Kendalikan
    // Pemutar, sedangkan baris server selalu ada di bawahnya.
    await driver.key('KEYCODE_DPAD_DOWN');
    const keysBack = await waitFor(async () => {
        const p = await parentState(page);

        return { ok: p.keys.includes('ArrowDown'), p };
    }, 4000);
    r.check(
        'D2.keys-back-to-page',
        keysBack.ok,
        keysBack.ok
            ? 'Panah kembali sampai ke halaman sesudah kursor dilepas'
            : `Panah tidak sampai ke halaman: ${JSON.stringify(keysBack.p || keysBack.error || null)}`,
    );
    const movedFocus = await activeLabel(page);
    r.soft(
        'D2.spatial-nav',
        !movedFocus.includes(TEXT.controlButton),
        `Fokus sesudah bawah: ${movedFocus}`,
    );

    if (cfg.probeRealPlayer && originalSrc) {
        await probeRealPlayer({ page, driver, r, shot, originalSrc });
    }

    await driver.key('KEYCODE_BACK');
    const left = await waitFor(
        async () => {
            const p = await page.evaluate(() => location.pathname);

            return { ok: !p.startsWith('/watch'), p };
        },
        15000,
        500,
    );
    r.soft(
        'D3.second-back-exits',
        left.ok,
        `Sesudah Kembali kedua: ${left.p || left.error || '?'}`,
    );
}

/**
 * Pengamatan opsional terhadap pemutar asli (butuh internet, tidak pernah
 * menggagalkan job): apakah ketukan kursor di tengah memutar video.
 */
async function probeRealPlayer({ page, driver, r, shot, originalSrc }) {
    await page.evaluate(
        ([sel, url]) => document.querySelector(sel).setAttribute('src', url),
        [IFRAME_SELECTOR, originalSrc],
    );
    await sleep(25000);
    await shot('pemutar-asli-termuat');

    await page.getByRole('button', { name: TEXT.controlButton }).focus();
    await driver.key('KEYCODE_DPAD_CENTER');
    await sleep(1500);
    await driver.key('KEYCODE_DPAD_CENTER');
    await sleep(10000);
    await shot('pemutar-asli-sesudah-ketuk');

    const frames = [];
    for (const f of page.frames()) {
        if (f === page.mainFrame()) {
            continue;
        }

        let host = '?';
        try {
            host = new URL(f.url()).host;
        } catch {
            // about:blank dan sejenisnya.
        }

        let videos;
        try {
            videos = await f.evaluate(() =>
                Array.from(document.querySelectorAll('video')).map((v) => ({
                    paused: v.paused,
                    t: Math.round(v.currentTime * 10) / 10,
                    readyState: v.readyState,
                })),
            );
        } catch {
            videos = 'tidak terbaca';
        }

        frames.push({ host, videos });
    }

    const playing = frames.some(
        (f) =>
            Array.isArray(f.videos) &&
            f.videos.some((v) => !v.paused && v.t > 0),
    );
    r.info('probeRealPlayer', frames);
    r.soft(
        'P1.real-player-plays',
        playing,
        `Pemutar asli: ${frames.length} frame [${frames.map((f) => f.host).join(',')}], video berjalan=${playing}`,
    );

    await driver.key('KEYCODE_BACK');
    await sleep(1500);
}

async function attachWebView(device, r, cfg) {
    try {
        return await device.webView({ pkg: cfg.pkg }, { timeout: 90000 });
    } catch (error) {
        // Cadangan: pencocokan pid -> paket di Playwright memakai `ps -A`,
        // yang formatnya berbeda di beberapa image.
        const pid = (await device.shell(`pidof ${cfg.pkg}`))
            .toString()
            .trim()
            .split(/\s+/)[0];

        if (pid) {
            r.info(
                'webViewAttach',
                `pkg gagal (${error.message}); mencoba socket pid ${pid}`,
            );

            return device.webView(
                { socketName: `webview_devtools_remote_${pid}` },
                { timeout: 30000 },
            );
        }

        throw error;
    }
}

async function main() {
    fs.mkdirSync(CFG.out, { recursive: true });
    const r = createReport(CFG);
    const consoleLines = [];
    let device = null;

    try {
        const { _android } = require('playwright-core');
        const { PNG } = require('pngjs');

        // Tanpa driver uiautomator Playwright: uji ini hanya butuh adb dan DevTools.
        const devices = await _android.devices({ omitDriverInstall: true });
        r.must(
            'B0.device',
            devices.length > 0,
            `Perangkat adb: ${devices.map((d) => d.serial()).join(',') || 'tidak ada'}`,
        );
        device = devices[0];
        r.info('device', { model: device.model(), serial: device.serial() });

        let webView;
        try {
            webView = await attachWebView(device, r, CFG);
        } catch (error) {
            r.must(
                'B0.webview-attach',
                false,
                `WebView ${CFG.pkg} tidak muncul di DevTools: ${error.message}`,
            );
        }

        const page = await webView.page();
        page.on('console', (msg) =>
            consoleLines.push(`[${msg.type()}] ${msg.text()}`),
        );
        page.on('pageerror', (error) =>
            consoleLines.push(`[pageerror] ${error.message}`),
        );
        r.info('userAgent', await page.evaluate(() => navigator.userAgent));

        await runFlow({
            page,
            driver: androidDriver(device),
            r,
            cfg: CFG,
            PNG,
        });
    } catch (error) {
        if (!(error instanceof Abort)) {
            r.check(
                'ABORT',
                false,
                `Kesalahan tak terduga: ${error && error.message ? error.message : error}`,
            );
        }

        if (device) {
            try {
                const buffer = await androidDriver(device).screencap();
                fs.mkdirSync(path.join(CFG.out, 'shots'), { recursive: true });
                fs.writeFileSync(
                    path.join(CFG.out, 'shots', '98-saat-gagal.png'),
                    buffer,
                );
            } catch {
                // Tangkapan layar terakhir bersifat tambahan.
            }
        }
    } finally {
        r.report.finishedAt = new Date().toISOString();
        fs.writeFileSync(
            path.join(CFG.out, 'results.json'),
            JSON.stringify(r.report, null, 2),
        );
        fs.writeFileSync(
            path.join(CFG.out, 'console.txt'),
            consoleLines.join('\n'),
        );

        if (device) {
            try {
                await device.close();
            } catch {
                // Koneksi adb ditutup bersama proses.
            }
        }
    }

    const failed = r.report.assertions.filter(
        (a) => !a.ok && a.level !== 'soft',
    );
    console.log(
        `\n${r.report.assertions.length - failed.length}/${r.report.assertions.length} lulus atau hanya peringatan`,
    );
    process.exit(failed.length ? 1 : 0);
}

module.exports = {
    CFG,
    CURSOR,
    TEXT,
    IFRAME_SELECTOR,
    Abort,
    createReport,
    runFlow,
    findWhiteBlob,
    blobLimits,
    isCursorAt,
    isCursorAbsent,
    cursorPx,
};

if (require.main === module) {
    main();
}
