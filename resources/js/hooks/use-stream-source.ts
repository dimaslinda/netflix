import { useCallback, useEffect, useState } from 'react';

import type { ApiEnvelope, StreamSource } from '@/types/playback';

interface ResolvedState {
    /** Kunci permintaan yang menghasilkan isi di bawah ini. */
    key: string | null;
    source: StreamSource | null;
    error: string | null;
}

interface UseStreamSourceResult {
    source: StreamSource | null;
    isResolving: boolean;
    error: string | null;
    retry: () => void;
}

const EMPTY_STATE: ResolvedState = { key: null, source: null, error: null };

/**
 * Meminta URL tontonan ke backend untuk satu pasangan provider dan reference.
 *
 * Hasil disimpan bersama kunci permintaannya. Dengan begitu respons yang datang
 * terlambat tidak pernah menimpa permintaan yang lebih baru, dan status memuat
 * bisa diturunkan dari perbandingan kunci tanpa menyetel state di dalam efek.
 */
export function useStreamSource(
    provider: string | null,
    reference: string | null,
): UseStreamSourceResult {
    const [attempt, setAttempt] = useState(0);
    const [resolved, setResolved] = useState<ResolvedState>(EMPTY_STATE);

    const key =
        provider && reference ? `${provider}|${reference}|${attempt}` : null;

    const retry = useCallback(() => setAttempt((value) => value + 1), []);

    useEffect(() => {
        if (key === null || !provider || !reference) {
            return;
        }

        const controller = new AbortController();
        const params = new URLSearchParams({ provider, reference });

        fetch(`/api/playback/resolve?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const body =
                    (await response.json()) as ApiEnvelope<StreamSource>;

                if (!response.ok || !body.success || !body.data) {
                    throw new Error(
                        body.message ?? 'Sumber tidak bisa diputar.',
                    );
                }

                setResolved({ key, source: body.data, error: null });
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setResolved({
                    key,
                    source: null,
                    error:
                        cause instanceof Error
                            ? cause.message
                            : 'Terjadi kesalahan saat memuat sumber.',
                });
            });

        return () => controller.abort();
    }, [key, provider, reference]);

    const isCurrent = resolved.key === key;

    return {
        source: isCurrent ? resolved.source : null,
        error: isCurrent ? resolved.error : null,
        isResolving: key !== null && !isCurrent,
        retry,
    };
}
