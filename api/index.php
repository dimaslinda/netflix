<?php

declare(strict_types=1);

/**
 * Vercel Serverless Function Entrypoint untuk Laravel
 *
 * Mengarahkan eksekusi request serverless ke public/index.php dengan
 * memetakan direktori cache, session, dan view yang membutuhkan akses
 * tulis ke direktori /tmp (satu-satunya partisi writable di Vercel).
 */

$tmpDirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/bootstrap/cache',
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Konfigurasi path writable ke /tmp
putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
putenv('APP_CONFIG_CACHE=/tmp/bootstrap/cache/config.php');
putenv('APP_SERVICES_CACHE=/tmp/bootstrap/cache/services.php');
putenv('APP_PACKAGES_CACHE=/tmp/bootstrap/cache/packages.php');
putenv('APP_ROUTES_CACHE=/tmp/bootstrap/cache/routes.php');
putenv('APP_EVENTS_CACHE=/tmp/bootstrap/cache/events.php');

// Teruskan ke entrypoint utama Laravel
require __DIR__ . '/../public/index.php';
