package com.netflix.app;

import android.app.UiModeManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
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
        result.put("cursor", getActivity() instanceof MainActivity);
        call.resolve(result);
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
