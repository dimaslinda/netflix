#!/usr/bin/env bash
# Dijalankan oleh reactivecircus/android-emulator-runner sesudah emulator
# selesai menyala. Emulator dimatikan begitu skrip ini berakhir, jadi semua
# interaksi perangkat dan pengumpulan bukti terjadi di sini.
#
# Action itu menjalankan input `script` baris per baris, sehingga seluruh
# logika ditaruh di berkas ini dan dipanggil dengan satu baris.

set -uo pipefail

OUT="${E2E_OUT:-$PWD/e2e-out}"
APK="${E2E_APK:-android/app/build/outputs/apk/debug/app-debug.apk}"
PKG="${E2E_PACKAGE:-com.netflix.app}"

mkdir -p "$OUT/shots"
exec > >(tee -a "$OUT/run.log") 2>&1

echo "== perangkat"
adb devices -l
adb wait-for-device

# Package manager kadang belum siap walau sys.boot_completed sudah 1.
for _ in $(seq 1 60); do
  if adb shell pm path android >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

# Layar tidak boleh tidur atau masuk screensaver di tengah uji.
adb shell settings put secure screensaver_enabled 0 || true
adb shell settings put secure screensaver_activate_on_sleep 0 || true
adb shell settings put secure screensaver_activate_on_dock 0 || true
adb shell settings put system screen_off_timeout 2147483647 || true
adb shell svc power stayon true || true
adb shell input keyevent KEYCODE_WAKEUP || true

{
  echo "model=$(adb shell getprop ro.product.model | tr -d '\r')"
  echo "sdk=$(adb shell getprop ro.build.version.sdk | tr -d '\r')"
  echo "characteristics=$(adb shell getprop ro.build.characteristics | tr -d '\r')"
  echo "leanback=$(adb shell pm has-feature android.software.leanback 2>/dev/null | tr -d '\r')"
  adb shell wm size | tr -d '\r'
  adb shell wm density | tr -d '\r'
  adb shell dumpsys webviewupdate 2>/dev/null | grep -iE 'Current WebView package|versionName' | head -n 5 | tr -d '\r'
} > "$OUT/device.txt" 2>&1
cat "$OUT/device.txt"

adb logcat -c || true
adb logcat -v threadtime > "$OUT/logcat-full.txt" 2>&1 &
LOGCAT_PID=$!

finish() {
  kill "$LOGCAT_PID" 2>/dev/null || true
  wait "$LOGCAT_PID" 2>/dev/null || true
  grep -E ' (Capacitor[^:]*|chromium|cr_[A-Za-z]+|AndroidRuntime|WebViewFactory)\s*:' "$OUT/logcat-full.txt" \
    > "$OUT/logcat-filtered.txt" 2>/dev/null || true
  grep -E 'ActivityManager.*com\.netflix\.app|ActivityTaskManager.*com\.netflix\.app' "$OUT/logcat-full.txt" \
    >> "$OUT/logcat-filtered.txt" 2>/dev/null || true
}

echo "== pasang APK"
installed=0
for attempt in 1 2 3; do
  if adb install -r -t "$APK"; then
    installed=1
    break
  fi
  echo "adb install gagal (percobaan $attempt), coba lagi"
  sleep 10
done

if [ "$installed" != 1 ]; then
  echo "::error title=Pasang APK::adb install gagal 3 kali, lihat run.log di artifact"
  finish
  exit 1
fi

echo "== jalankan aplikasi"
adb shell am start -W -n "$PKG/.MainActivity"

echo "== uji kursor"
node ci/android-e2e/cursor.e2e.cjs
STATUS=$?

adb exec-out screencap -p > "$OUT/shots/99-akhir.png" 2>/dev/null || true
adb shell dumpsys activity activities 2>/dev/null | grep -E 'mResumedActivity|topResumedActivity' | head -n 3 \
  > "$OUT/activity.txt" || true

finish
exit "$STATUS"
