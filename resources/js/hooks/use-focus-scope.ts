import { type RefObject, useEffect } from 'react';

import { focusInitial, pushFocusScope } from '@/lib/tv/spatial-navigation';

/**
 * Fokus untuk lapisan seperti modal, laci, dan menu tarik-turun.
 *
 * Selama `active`: navigasi remote dibatasi ke dalam elemen, fokus dipindah ke
 * elemen bertanda data-tv-autofocus (atau elemen pertama), dan saat lapisan
 * ditutup fokus dikembalikan ke elemen yang membukanya. Tanpa pengembalian
 * itu, fokus jatuh ke <body> dan pemirsa TV kehilangan posisinya di halaman.
 */
export function useFocusScope(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
): void {
    useEffect(() => {
        const element = ref.current;

        if (!active || !element) {
            return;
        }

        const opener =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const release = pushFocusScope(element);

        // Satu frame agar transisi masuk sudah memberi kotak berukuran.
        const frame = window.requestAnimationFrame(() => {
            if (!element.contains(document.activeElement)) {
                focusInitial(element);
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);
            release();

            if (opener?.isConnected) {
                opener.focus({ preventScroll: true });
            }
        };
    }, [ref, active]);
}
