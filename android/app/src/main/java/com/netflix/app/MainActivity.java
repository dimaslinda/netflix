package com.netflix.app;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdBlockerPlugin.class);
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        }
    }
}

