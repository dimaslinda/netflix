<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $e): void {
            error_log('=== LARAVEL EXCEPTION: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        });

        $exceptions->render(function (\Throwable $e, $request) {
            // Biarkan Laravel & Inertia menangani error validasi, otentikasi, dan HTTP status secara alami
            if (
                $e instanceof \Illuminate\Validation\ValidationException ||
                $e instanceof \Illuminate\Auth\AuthenticationException ||
                $e instanceof \Illuminate\Auth\Access\AuthorizationException ||
                $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
            ) {
                return null;
            }

            return response(
                '<div style="background:#111;color:#fff;padding:32px;font-family:sans-serif;min-height:100vh;">' .
                '<h1 style="color:#e50914;">500 | Laravel Exception Detail</h1>' .
                '<p style="font-size:18px;color:#ff6b6b;"><strong>Pesan:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>' .
                '<p><strong>Lokasi:</strong> ' . htmlspecialchars($e->getFile()) . ':' . $e->getLine() . '</p>' .
                '<pre style="background:#222;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;color:#ccc;">' . htmlspecialchars($e->getTraceAsString()) . '</pre>' .
                '</div>',
                500
            );
        });
    })->create();

$storagePath = env('LARAVEL_STORAGE_PATH', env('APP_STORAGE', getenv('LARAVEL_STORAGE_PATH') ?: (getenv('APP_STORAGE') ?: (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']) ? '/tmp/storage' : null))));
if ($storagePath) {
    $app->useStoragePath($storagePath);
}

return $app;
