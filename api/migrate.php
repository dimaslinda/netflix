<?php

declare(strict_types=1);

/**
 * One-time migration endpoint for Vercel serverless.
 * 
 * Jalankan sekali via: https://netflix-eight-blush.vercel.app/api/migrate.php?key=<MIGRATE_SECRET>
 * Hapus file ini setelah migration berhasil.
 */

// Gunakan secret sederhana untuk keamanan
$secret = 'layarflix-migrate-2026';
if (($_GET['key'] ?? '') !== $secret) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Setup tmp dirs (sama seperti index.php)
$tmpDirs = [
    '/tmp/storage',
    '/tmp/storage/app',
    '/tmp/storage/framework',
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/bootstrap/cache',
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}

putenv('VERCEL=1');
$_ENV['VERCEL'] = '1';
$_SERVER['VERCEL'] = '1';
putenv('APP_STORAGE=/tmp/storage');
$_ENV['APP_STORAGE'] = '/tmp/storage';
$_SERVER['APP_STORAGE'] = '/tmp/storage';
putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
putenv('APP_CONFIG_CACHE=/tmp/bootstrap/cache/config.php');
putenv('APP_SERVICES_CACHE=/tmp/bootstrap/cache/services.php');
putenv('APP_PACKAGES_CACHE=/tmp/bootstrap/cache/packages.php');
putenv('APP_ROUTES_CACHE=/tmp/bootstrap/cache/routes.php');
putenv('APP_EVENTS_CACHE=/tmp/bootstrap/cache/events.php');
putenv('CACHE_STORE=array');
$_ENV['CACHE_STORE'] = 'array';
$_SERVER['CACHE_STORE'] = 'array';
putenv('SESSION_DRIVER=cookie');
$_ENV['SESSION_DRIVER'] = 'cookie';
$_SERVER['SESSION_DRIVER'] = 'cookie';

// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: application/json');

try {
    $db = \Illuminate\Support\Facades\DB::connection('pgsql');
    
    $output = [];
    
    // 1. Cek dan buat tabel cache
    $hasCacheTable = $db->getSchemaBuilder()->hasTable('cache');
    if (!$hasCacheTable) {
        $db->getSchemaBuilder()->create('cache', function ($table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });
        $output[] = '✅ Created table: cache';
    } else {
        $output[] = '⏭️ Table already exists: cache';
    }
    
    // 2. Cek dan buat tabel cache_locks
    $hasCacheLocksTable = $db->getSchemaBuilder()->hasTable('cache_locks');
    if (!$hasCacheLocksTable) {
        $db->getSchemaBuilder()->create('cache_locks', function ($table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
        $output[] = '✅ Created table: cache_locks';
    } else {
        $output[] = '⏭️ Table already exists: cache_locks';
    }
    
    // 3. Cek dan buat tabel sessions
    $hasSessionsTable = $db->getSchemaBuilder()->hasTable('sessions');
    if (!$hasSessionsTable) {
        $db->getSchemaBuilder()->create('sessions', function ($table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
        $output[] = '✅ Created table: sessions';
    } else {
        $output[] = '⏭️ Table already exists: sessions';
    }
    
    // 4. List semua tabel
    $tables = $db->select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    $tableNames = array_map(fn($t) => $t->tablename, $tables);
    
    echo json_encode([
        'status' => 'success',
        'results' => $output,
        'all_tables' => $tableNames,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile() . ':' . $e->getLine(),
        'trace' => explode("\n", $e->getTraceAsString()),
    ], JSON_PRETTY_PRINT);
}
