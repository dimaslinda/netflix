import { useSyncExternalStore } from 'react';

import { isTvMode, subscribeTvMode } from '@/lib/tv/tv-mode';

/** True selama aplikasi dipakai lewat remote TV. Selalu false saat SSR. */
export function useTvMode(): boolean {
    return useSyncExternalStore(subscribeTvMode, isTvMode, () => false);
}
