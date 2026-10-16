import { useEffect, useRef } from 'react';

import { pushBackHandler } from '@/lib/tv/back-stack';

interface BackHandlerOptions {
    enabled?: boolean;
    /** Lapisan yang bisa ditutup juga lewat Escape. Lihat back-stack.ts. */
    overlay?: boolean;
}

/**
 * Mendaftarkan penangan tombol Kembali selama `enabled`.
 *
 * Penangan disimpan di ref, jadi pendaftaran tidak diulang setiap render.
 * Mengulang pendaftaran akan memindahkan penangan ke puncak tumpukan dan
 * merusak urutan antara halaman dan lapisan di atasnya.
 */
export function useBackHandler(
    handler: () => void,
    { enabled = true, overlay = false }: BackHandlerOptions = {},
): void {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        return pushBackHandler(() => handlerRef.current(), { overlay });
    }, [enabled, overlay]);
}
