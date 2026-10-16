'use strict';

/**
 * Menerbitkan hasil uji emulator sebagai anotasi GitHub Actions.
 *
 * Log job butuh login, anotasi tidak: untuk repo publik anotasi terbaca lewat
 *   GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs   -> check_run_url
 *   GET {check_run_url}/annotations
 * GitHub hanya menyimpan 10 anotasi per tingkat (notice/warning/error) per
 * langkah, jadi skrip ini dipanggil dua kali dari dua langkah berbeda:
 *
 *   node ci/android-e2e/report.cjs assertions <dir>   ringkasan + asersi
 *   node ci/android-e2e/report.cjs logs <dir>         potongan logcat dan log server
 */

const fs = require('fs');
const path = require('path');

const [mode = 'assertions', dir = 'e2e-out'] = process.argv.slice(2);
const LIMIT = 10;
const MAX_LEN = 300;
const budget = { notice: LIMIT, warning: LIMIT, error: LIMIT };

function escapeData(value) {
    return String(value)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}

function escapeProperty(value) {
    return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function emit(level, title, message) {
    if (budget[level] <= 0) {
        return false;
    }

    budget[level] -= 1;
    const text = String(message).replace(/\s+/g, ' ').trim();
    const clipped =
        text.length > MAX_LEN ? `${text.slice(0, MAX_LEN - 1)}…` : text;
    console.log(
        `::${level} title=${escapeProperty(title)}::${escapeData(clipped)}`,
    );

    return true;
}

function read(file) {
    try {
        return fs.readFileSync(path.join(dir, file), 'utf8');
    } catch {
        return null;
    }
}

function loadResults() {
    const raw = read('results.json');

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function lastLines(text, pattern, count) {
    if (!text) {
        return [];
    }

    return text
        .split(/\r?\n/)
        .filter((line) => pattern.test(line))
        .slice(-count);
}

// Bukti terpenting lebih dulu, supaya tetap muat dalam batas 10 notice.
const PRIORITY = [
    'B4.getInfo-cursor',
    'B6.ui-has-cursor',
    'C3.cursor-visible',
    'C4.tap-in-iframe',
    'C4.tap-position',
    'C5.cursor-moves',
    'C6.tap-follows-cursor',
    'D1.back-releases',
    'D2.keys-back-to-page',
    'B2.bridge',
    'B3.plugin-header',
];

function reportAssertions() {
    const results = loadResults();

    if (!results) {
        emit(
            'error',
            'TV e2e: tanpa hasil',
            'results.json tidak ada. Emulator gagal menyala, APK gagal dipasang, atau skrip uji tidak berjalan.',
        );
        lastLines(
            read('run.log'),
            /error|fail|exception|INSTALL_|timed out|not found/i,
            8,
        ).forEach((line) => emit('error', 'run.log', line));

        return;
    }

    const all = results.assertions || [];
    const hardFails = all.filter((a) => !a.ok && a.level !== 'soft');
    const softFails = all.filter((a) => !a.ok && a.level === 'soft');
    const passed = all.filter((a) => a.ok);
    const ua = (results.info && results.info.userAgent) || '';
    const webview = (ua.match(/Chrome\/([\d.]+)/) || [])[1] || '?';
    const device =
        (results.info && results.info.device && results.info.device.model) ||
        '?';
    const vp = results.info && results.info.viewport;
    const summary =
        `${passed.length}/${all.length} lulus, ${hardFails.length} gagal, ${softFails.length} peringatan. ` +
        `Perangkat ${device}, WebView ${webview}` +
        (vp ? `, viewport ${vp.w}x${vp.h}@${vp.dpr}x` : '') +
        '.';

    if (hardFails.length) {
        emit('error', 'TV e2e GAGAL', summary);
    } else {
        emit('notice', 'TV e2e LULUS', summary);
    }

    hardFails.forEach((a) => emit('error', a.id, a.msg));

    const rank = (a) => {
        const index = PRIORITY.indexOf(a.id);

        return index === -1 ? PRIORITY.length : index;
    };
    passed
        .slice()
        .sort((a, b) => rank(a) - rank(b))
        .forEach((a) => emit('notice', a.id, a.msg));

    softFails.forEach((a) => emit('warning', a.id, a.msg));
}

function reportLogs() {
    const results = loadResults();
    const failed =
        !results ||
        (results.assertions || []).some((a) => !a.ok && a.level !== 'soft');
    const logcat = read('logcat-filtered.txt') || read('logcat-full.txt') || '';
    const fatal = lastLines(logcat, /FATAL EXCEPTION|AndroidRuntime/, 50);
    const errors = lastLines(
        logcat,
        /\s[EF]\s+(Capacitor[^:]*|chromium|cr_\w+|AndroidRuntime|WebViewFactory)\s*:|Uncaught|TypeError|ReferenceError/,
        200,
    );
    const consoleErrors = lastLines(
        read('console.txt'),
        /^\[(error|pageerror)\]/,
        50,
    );
    const laravelErrors = lastLines(
        read('laravel.log'),
        /\.(ERROR|CRITICAL):/,
        50,
    );

    emit(
        'notice',
        'Log perangkat',
        `logcat: ${fatal.length} baris AndroidRuntime, ${errors.length} baris error Capacitor/chromium; ` +
            `console WebView: ${consoleErrors.length} error; laravel.log: ${laravelErrors.length} error`,
    );

    if (!failed) {
        return;
    }

    [...new Set([...fatal.slice(-3), ...errors.slice(-5)])]
        .slice(-8)
        .forEach((line) => emit('error', 'logcat', line.trim()));
    consoleErrors
        .slice(-5)
        .forEach((line) => emit('warning', 'console WebView', line));
    laravelErrors
        .slice(-3)
        .forEach((line) =>
            emit('warning', 'laravel.log', line.slice(0, MAX_LEN)),
        );
}

if (mode === 'logs') {
    reportLogs();
} else {
    reportAssertions();
}
