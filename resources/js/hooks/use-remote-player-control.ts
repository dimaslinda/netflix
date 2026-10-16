import {
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { getNativeTvInfo, setNativeCursorMode } from '@/lib/tv/native-remote';

import { useBackHandler } from './use-back-handler';

export type RemotePlayerMode = 'menu' | 'player';

interface RemotePlayerControlOptions {
    /** Hanya aktif di mode TV. Di HP dan desktop pemutar disentuh langsung. */
    enabled: boolean;
    iframeRef: RefObject<HTMLIFrameElement | null>;
    /** Elemen yang menerima fokus kembali saat kendali dilepas. */
    menuTargetRef: RefObject<HTMLElement | null>;
}

/**
 * Kendali remote TV untuk pemutar di dalam iframe pihak ketiga.
 *
 * Halaman induk tidak bisa menekan tombol di dalam iframe lintas asal, dan
 * begitu iframe difokus semua tombol remote diterima iframe, bukan halaman.
 * Karena itu halaman tonton punya dua keadaan:
 *
 * - `menu`: remote menavigasi tombol halaman (kembali, server, episode).
 * - `player`: remote diserahkan ke pemutar. Di APK yang punya plugin
 *   TvRemote, panah menggerakkan kursor native dan OK menjadi ketukan
 *   sungguhan, jadi tombol Putar, CC, dan pengaturan pemutar bisa dijangkau.
 *   Tanpa plugin, iframe sekadar difokus dan pintasan keyboard pemutar yang
 *   bekerja, bila pemutarnya punya.
 *
 * Tombol Kembali selalu mengembalikan ke `menu`. Tombol itu diterima
 * Capacitor di tingkat native, jadi tetap sampai meskipun fokus ada di iframe.
 */
export function useRemotePlayerControl({
    enabled,
    iframeRef,
    menuTargetRef,
}: RemotePlayerControlOptions) {
    const [mode, setMode] = useState<RemotePlayerMode>('menu');
    const [hasCursor, setHasCursor] = useState(false);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let cancelled = false;

        void getNativeTvInfo().then((info) => {
            if (!cancelled) {
                setHasCursor(Boolean(info?.cursor));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    const takeControl = useCallback(async () => {
        const usingCursor = await setNativeCursorMode(true);

        if (!usingCursor) {
            iframeRef.current?.focus();
        }

        setMode('player');
    }, [iframeRef]);

    const releaseControl = useCallback(() => {
        void setNativeCursorMode(false);
        setMode('menu');
    }, []);

    // Fokus dipasang sesudah commit, bukan langsung di releaseControl: selama
    // menu masih ber-inert, focus() ditolak diam-diam dan remote tertinggal di
    // dalam iframe.
    const wasInPlayer = useRef(false);

    useEffect(() => {
        if (mode === 'player') {
            wasInPlayer.current = true;

            return;
        }

        if (wasInPlayer.current) {
            wasInPlayer.current = false;
            menuTargetRef.current?.focus({ preventScroll: true });
        }
    }, [mode, menuTargetRef]);

    useBackHandler(releaseControl, { enabled: enabled && mode === 'player' });

    // Kursor native tidak boleh tertinggal menyala setelah halaman ditutup.
    useEffect(
        () => () => {
            void setNativeCursorMode(false);
        },
        [],
    );

    return { mode, hasCursor, takeControl, releaseControl };
}
