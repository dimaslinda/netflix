package com.netflix.app;

import android.app.UiModeManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Jembatan remote TV untuk halaman web. Pasangannya di sisi web:
 * resources/js/lib/tv/native-remote.ts.
 */
@CapacitorPlugin(name = "TvRemote")
public class TvRemotePlugin extends Plugin {

    @PluginMethod
    public void getInfo(PluginCall call) {
        JSObject result = new JSObject();
        result.put("television", isTelevision());
        result.put(
            "cursor",
            getActivity() instanceof MainActivity && ((MainActivity) getActivity()).getRemoteCursor() != null
        );

        // Versi APK terpasang, supaya halaman bisa menunjukkan build mana yang
        // sedang berjalan di TV.
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            result.put("versionName", info.versionName);
            result.put("versionCode", installedVersionCode(info));
        } catch (PackageManager.NameNotFoundException ignored) {
            // Paket sendiri selalu ada; cabang ini hanya untuk memenuhi API.
        }

        call.resolve(result);
    }

    @SuppressWarnings("deprecation")
    private static long installedVersionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
    }

    @PluginMethod
    public void setCursorMode(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));

        // Metode plugin berjalan di thread latar, sedangkan kursor menyentuh
        // View dan WebView yang hanya boleh diubah dari thread UI.
        getActivity().runOnUiThread(() -> {
            if (!(getActivity() instanceof MainActivity)) {
                call.reject("Kursor remote tidak tersedia");
                return;
            }

            RemoteCursor cursor = ((MainActivity) getActivity()).getRemoteCursor();

            if (cursor == null) {
                call.reject("Kursor remote belum siap");
                return;
            }

            cursor.setEnabled(enabled);
            call.resolve();
        });
    }

    private boolean isTelevision() {
        UiModeManager uiModeManager = (UiModeManager) getContext().getSystemService(Context.UI_MODE_SERVICE);

        if (uiModeManager != null && uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            return true;
        }

        return getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LEANBACK);
    }
}
