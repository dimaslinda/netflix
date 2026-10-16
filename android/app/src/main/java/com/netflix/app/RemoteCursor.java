package com.netflix.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Kursor layar yang digerakkan tombol arah remote TV.
 *
 * Pemutar film berjalan di iframe milik pihak ketiga. Halaman web tidak bisa
 * menekan tombol di dalam iframe lintas asal, dan tombol Putar, CC, maupun
 * pengaturan pemutar dirancang untuk sentuhan atau tetikus. Selama mode kursor
 * aktif, panah menggeser kursor dan OK dikirim ke WebView sebagai ketukan jari
 * sungguhan di posisi kursor, jadi kontrol apa pun di dalam iframe bisa
 * dijangkau tanpa bergantung pada pemutar tertentu.
 *
 * Mode ini dinyalakan dan dimatikan dari halaman web lewat TvRemotePlugin.
 * Tombol Back selalu mematikannya lalu diteruskan ke Capacitor, supaya remote
 * tidak pernah terjebak di mode kursor.
 */
final class RemoteCursor {

    /** Dipanggil setiap kali mode kursor menyala atau mati. */
    interface EnabledListener {
        void onEnabledChanged(boolean enabled);
    }

    /** Langkah gerak untuk satu tekanan panah. */
    private static final float BASE_STEP_DP = 14f;

    /** Langkah terbesar saat panah ditahan. */
    private static final float MAX_STEP_DP = 72f;

    /** Pertambahan langkah per pengulangan tombol saat ditahan. */
    private static final float STEP_GROWTH_PER_REPEAT = 0.35f;

    /**
     * Ketukan dilepas otomatis setelah selama ini, di bawah batas tekan-lama
     * Android. OK yang ditahan sedikit lebih lama tetap menjadi klik, bukan
     * membuka menu konteks atau memilih teks di dalam pemutar.
     */
    private static final long TAP_MAX_MS = 350;

    private final WebView webView;
    private final CursorView cursorView;
    private final float density;

    private EnabledListener enabledListener;
    private boolean enabled = false;
    private float x;
    private float y;
    private long touchDownTime = -1;

    private final Runnable finishHeldTap = () -> {
        if (touchDownTime >= 0) {
            dispatchTouch(MotionEvent.ACTION_UP);
        }
    };

    RemoteCursor(Activity activity, WebView webView) {
        this.webView = webView;
        this.density = activity.getResources().getDisplayMetrics().density;
        this.cursorView = new CursorView(activity, density);
        this.cursorView.setVisibility(View.GONE);

        activity.addContentView(
            cursorView,
            new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
    }

    void setEnabledListener(EnabledListener listener) {
        this.enabledListener = listener;
    }

    boolean isEnabled() {
        return enabled;
    }

    /** Wajib dipanggil dari thread UI. */
    void setEnabled(boolean next) {
        if (next == enabled) {
            return;
        }

        enabled = next;

        if (next) {
            x = webView.getWidth() / 2f;
            y = webView.getHeight() / 2f;
            cursorView.setVisibility(View.VISIBLE);
            redraw();
            dispatchHover();
        } else {
            webView.removeCallbacks(finishHeldTap);
            cancelPendingTouch();
            cursorView.setVisibility(View.GONE);
        }

        if (enabledListener != null) {
            enabledListener.onEnabledChanged(next);
        }
    }

    /**
     * Mengembalikan true bila tombol sudah ditangani di sini dan tidak boleh
     * diteruskan ke WebView.
     */
    boolean handleKeyEvent(KeyEvent event) {
        if (!enabled) {
            return false;
        }

        int action = event.getAction();

        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_DPAD_UP:
            case KeyEvent.KEYCODE_DPAD_DOWN:
            case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                if (action == KeyEvent.ACTION_DOWN) {
                    move(event.getKeyCode(), event.getRepeatCount());
                }
                return true;
            // Semua tombol "pilih" menurut panduan Android TV. Remote Fire TV
            // dan gamepad mengirim BUTTON_A, sebagian remote mengirim ENTER.
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER:
            case KeyEvent.KEYCODE_BUTTON_A:
            case KeyEvent.KEYCODE_BUTTON_SELECT:
                if (action == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0 && touchDownTime < 0) {
                    dispatchTouch(MotionEvent.ACTION_DOWN);
                    webView.postDelayed(finishHeldTap, TAP_MAX_MS);
                } else if (action == KeyEvent.ACTION_UP) {
                    webView.removeCallbacks(finishHeldTap);
                    if (touchDownTime >= 0) {
                        dispatchTouch(MotionEvent.ACTION_UP);
                    }
                }
                return true;
            case KeyEvent.KEYCODE_BACK:
                if (action == KeyEvent.ACTION_DOWN) {
                    setEnabled(false);
                }
                // Tetap diteruskan: halaman web membuka menunya kembali.
                return false;
            default:
                return false;
        }
    }

    private void move(int keyCode, int repeatCount) {
        float step = Math.min(BASE_STEP_DP * (1f + repeatCount * STEP_GROWTH_PER_REPEAT), MAX_STEP_DP) * density;

        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_UP:
                y -= step;
                break;
            case KeyEvent.KEYCODE_DPAD_DOWN:
                y += step;
                break;
            case KeyEvent.KEYCODE_DPAD_LEFT:
                x -= step;
                break;
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                x += step;
                break;
            default:
                return;
        }

        x = clamp(x, 0, Math.max(0, webView.getWidth() - 1));
        y = clamp(y, 0, Math.max(0, webView.getHeight() - 1));

        redraw();
        dispatchHover();
    }

    /**
     * Membuat MotionEvent satu penunjuk dengan tipe alat yang jelas. Versi
     * singkat MotionEvent.obtain(..., x, y, meta) memberi tipe UNKNOWN, yang
     * oleh Chromium diteruskan sebagai pointerType kosong; sebagian pemutar
     * mengabaikan ketukan seperti itu.
     */
    private MotionEvent obtainEvent(long downTime, long eventTime, int action, int toolType, int source) {
        MotionEvent.PointerProperties[] properties = { new MotionEvent.PointerProperties() };
        properties[0].id = 0;
        properties[0].toolType = toolType;

        MotionEvent.PointerCoords[] coords = { new MotionEvent.PointerCoords() };
        coords[0].x = x;
        coords[0].y = y;
        coords[0].pressure = 1f;
        coords[0].size = 1f;

        return MotionEvent.obtain(downTime, eventTime, action, 1, properties, coords, 0, 0, 1f, 1f, 0, 0, source, 0);
    }

    /**
     * Gerak tetikus maya. Banyak pemutar hanya menampilkan bilah kontrolnya
     * saat tetikus bergerak di atas video.
     */
    private void dispatchHover() {
        long now = SystemClock.uptimeMillis();
        MotionEvent event = obtainEvent(now, now, MotionEvent.ACTION_HOVER_MOVE, MotionEvent.TOOL_TYPE_MOUSE, InputDevice.SOURCE_MOUSE);
        webView.dispatchGenericMotionEvent(event);
        event.recycle();
    }

    private void dispatchTouch(int action) {
        long now = SystemClock.uptimeMillis();

        if (action == MotionEvent.ACTION_DOWN) {
            touchDownTime = now;
        } else if (touchDownTime < 0) {
            // Lepas tanpa tekan (misalnya mode baru dinyalakan saat OK ditahan).
            return;
        }

        MotionEvent event = obtainEvent(touchDownTime, now, action, MotionEvent.TOOL_TYPE_FINGER, InputDevice.SOURCE_TOUCHSCREEN);
        webView.dispatchTouchEvent(event);
        event.recycle();

        if (action == MotionEvent.ACTION_UP) {
            touchDownTime = -1;
        }
    }

    private void cancelPendingTouch() {
        if (touchDownTime < 0) {
            return;
        }

        long now = SystemClock.uptimeMillis();
        MotionEvent event = obtainEvent(touchDownTime, now, MotionEvent.ACTION_CANCEL, MotionEvent.TOOL_TYPE_FINGER, InputDevice.SOURCE_TOUCHSCREEN);
        webView.dispatchTouchEvent(event);
        event.recycle();
        touchDownTime = -1;
    }

    /** Posisi kursor disimpan dalam koordinat WebView, digambar dalam koordinat lapisannya. */
    private void redraw() {
        int[] webLocation = new int[2];
        int[] cursorLocation = new int[2];
        webView.getLocationInWindow(webLocation);
        cursorView.getLocationInWindow(cursorLocation);

        cursorView.moveTo(x + webLocation[0] - cursorLocation[0], y + webLocation[1] - cursorLocation[1]);
    }

    private static float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Lingkaran putih bercincin gelap, terbaca di atas adegan terang maupun
     * gelap. Tidak bisa diklik dan tidak bisa difokus, jadi tidak pernah
     * menghalangi sentuhan atau fokus WebView di bawahnya.
     */
    private static final class CursorView extends View {

        private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float radius;
        private float cx;
        private float cy;

        CursorView(Context context, float density) {
            super(context);
            setClickable(false);
            setFocusable(false);
            setWillNotDraw(false);

            radius = 11f * density;

            fill.setColor(Color.WHITE);
            fill.setStyle(Paint.Style.FILL);

            ring.setColor(Color.argb(200, 0, 0, 0));
            ring.setStyle(Paint.Style.STROKE);
            ring.setStrokeWidth(3f * density);
        }

        void moveTo(float x, float y) {
            cx = x;
            cy = y;
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.drawCircle(cx, cy, radius, fill);
            canvas.drawCircle(cx, cy, radius, ring);
        }
    }
}
