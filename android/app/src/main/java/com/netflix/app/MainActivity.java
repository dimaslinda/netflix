package com.netflix.app;

import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    @CapacitorPlugin(name = "AdBlocker")
    public static class AdBlockerPlugin extends Plugin {
        @Override
        public Boolean shouldOverrideLoad(Uri url) {
            if (url == null) return null;
            String host = url.getHost();
            if (host == null) return null;

            host = host.toLowerCase();

            // Domain resmi yang diizinkan untuk aplikasi dan pemutar video
            boolean isAllowed =
                host.contains("vercel.app") ||
                host.contains("netflix") ||
                host.contains("localhost") ||
                host.contains("10.0.2.2") ||
                host.contains("192.168.") ||
                host.contains("vidlink.pro") ||
                host.contains("vidnest.fun") ||
                host.contains("vidsrc") ||
                host.contains("2embed") ||
                host.contains("tmdb.org") ||
                host.contains("themoviedb.org") ||
                host.contains("cloudflare.com") ||
                host.contains("googleapis.com");

            if (isAllowed) {
                // Izinkan navigasi normal
                return null;
            }

            // Blokir semua domain iklan pop-up / redirect (mencegah pembukaan Chrome/browser eksternal)
            return Boolean.TRUE;
        }
    }

    private RemoteCursor remoteCursor;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdBlockerPlugin.class);
        registerPlugin(TvRemotePlugin.class);
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);

            remoteCursor = new RemoteCursor(this, this.bridge.getWebView());
            installCursorBackGuard();
        }
    }

    /**
     * Jaring pengaman tombol Back. Mulai Android 16 (targetSdk 36) KEYCODE_BACK
     * tidak lagi sampai ke dispatchKeyEvent, jadi RemoteCursor tidak bisa
     * mematikan kursornya sendiri. Callback ini didaftarkan sesudah milik
     * plugin App, sehingga berjalan lebih dulu: mematikan kursor, lalu
     * meneruskan Back ke plugin App agar halaman web membuka menunya kembali.
     * Hanya aktif selama kursor menyala.
     */
    private void installCursorBackGuard() {
        final OnBackPressedCallback cursorBack = new OnBackPressedCallback(false) {
            @Override
            public void handleOnBackPressed() {
                remoteCursor.setEnabled(false);
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        };

        getOnBackPressedDispatcher().addCallback(this, cursorBack);
        remoteCursor.setEnabledListener(cursorBack::setEnabled);
    }

    RemoteCursor getRemoteCursor() {
        return remoteCursor;
    }

    /**
     * Tombol remote dicegat di sini sebelum sampai ke WebView, hanya selama
     * mode kursor aktif. Di luar mode itu semua tombol diteruskan apa adanya.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (remoteCursor != null && remoteCursor.handleKeyEvent(event)) {
            return true;
        }

        return super.dispatchKeyEvent(event);
    }
}

