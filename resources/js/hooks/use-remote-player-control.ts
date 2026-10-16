import {
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    getNativeTvStatus,
    type NativeTvStatus,
    setNativeCursorMode,
} from '@/lib/tv/native-remote';

import { useBackHandler } from './use-back-handler';

export type RemotePlayerMode = 'menu' | 'player';

interface RemotePlayerControlOptions {
    /** Hanya aktif di mode TV. Di HP dan desktop pemutar disentuh langsung. */
    enabled: boolean;
    /** Elemen yang menerima fokus kembali saat kendali dilepas. */
    menuTargetRef: RefObject<HTMLElement | null>;
}

/**
 * Kendali remote TV untuk pemutar di dalam iframe pihak ketiga.
 *
 * Halaman induk tidak bisa menekan tombol di dalam iframe lintas asal, dan
 * pemutar pihak ketiga tidak menanggapi tombol arah remote. Satu-satunya
 * jalan yang andal adalah kursor native dari plugin TvRemote: panah
 * menggerakkan kursor dan OK menjadi ketukan sungguhan, jadi tombol Putar, CC,
 * dan pengaturan pemutar bisa dijangkau. Halaman tonton punya dua keadaan:
 *
 * - `menu`: remote menavigasi tombol halaman (kembali, server, episode).
 * - `player`: remote menggerakkan kursor di atas pemutar.
 *
 * Tanpa plugin (APK lama, peramban) mode `player` tidak dibuka sama sekali.
 * Versi lama halaman ini memfokuskan iframe sebagai cadangan, dan hasilnya
 * remote mati sampai Kembali ditekan. Sekarang `status` menjelaskan kepada
 * pemirsa apa yang harus dilakukan.
 *
 * Tombol Kembali selalu mengembalikan ke `menu`. Tombol itu diterima
 * Capacitor di tingkat native, jadi tetap sampai meskipun kursor aktif.
 */
export function useRemotePlayerControl({
    enabled,
    menuTargetRef,
}: RemotePlayerControlOptions) {
    const [mode, setMode] = useState<RemotePlayerMode>('menu');
    const [status, setStatus] = useState<NativeTvStatus | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let cancelled = false;

        void getNativeTvStatus().then((next) => {
            if (!cancelled) {
                setStatus(next);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    const takeControl = useCallback(async () => {
        if (await setNativeCursorMode(true)) {
            setMode('player');

            return;
        }

        setStatus({
            kind: 'error',
            message: 'Kursor remote tidak menjawab.',
        });
    }, []);

    const releaseControl = useCallback(() => {
        void setNativeCursorMode(false);
        setMode('menu');
    }, []);

    // Fokus dipasang sesudah commit, bukan langsung di releaseControl: selama
    // menu masih ber-inert, focus() ditolak diam-diam.
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

    return { mode, status, takeControl, releaseControl };
}
