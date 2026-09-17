export interface ContinueWatchingItem {
    id: string;
    type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    season?: string;
    episode?: string;
    episodeTitle?: string;
    progress?: number;
    updatedAt: number;
}

const STORAGE_KEY = 'weflix_continue_watching';

function getXsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function getContinueWatchingList(): ContinueWatchingItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: ContinueWatchingItem[] = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
        return [];
    }
}

export function saveContinueWatching(
    item: Omit<ContinueWatchingItem, 'updatedAt'>,
): void {
    if (typeof window === 'undefined') return;
    try {
        const current = getContinueWatchingList();
        const existingIndex = current.findIndex(
            (c) => c.id === item.id && c.type === item.type,
        );

        const updatedItem: ContinueWatchingItem = {
            ...item,
            updatedAt: Date.now(),
        };

        if (existingIndex >= 0) {
            current[existingIndex] = updatedItem;
        } else {
            current.unshift(updatedItem);
        }

        // Limit to 20 most recent items
        const trimmed = current.slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        window.dispatchEvent(new Event('continue-watching-updated'));

        // Background sync to user database account if logged in
        fetch('/api/user/watch-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getXsrfToken(),
            },
            body: JSON.stringify({
                tmdb_id: String(item.id),
                media_type: item.type,
                title: item.title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                season: item.season ? Number(item.season) : 1,
                episode: item.episode ? Number(item.episode) : 1,
                progress_seconds: item.progress ? Math.round(item.progress) : 0,
            }),
        }).catch(() => {
            // Ignore if guest or unauthenticated
        });
    } catch {
        // LocalStorage might be disabled or full; silently handle
    }
}

export function removeContinueWatching(id: string, type: 'movie' | 'tv'): void {
    if (typeof window === 'undefined') return;
    try {
        const current = getContinueWatchingList();
        const filtered = current.filter(
            (item) => !(item.id === id && item.type === type),
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('continue-watching-updated'));

        // Background delete from user database account if logged in
        fetch('/api/user/watch-history', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getXsrfToken(),
            },
            body: JSON.stringify({
                tmdb_id: String(id),
                media_type: type,
            }),
        }).catch(() => {
            // Ignore error
        });
    } catch {
        // Handle error silently
    }
}

/**
 * Sync watch history from server database for authenticated user
 */
export async function syncUserWatchHistory(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        const res = await fetch('/api/user/watch-history', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        interface ServerHistoryRow {
            tmdb_id: string;
            media_type: 'movie' | 'tv';
            title: string;
            poster_path: string | null;
            backdrop_path: string | null;
            season?: number | null;
            episode?: number | null;
            progress_seconds?: number | null;
            last_watched_at?: string | null;
            updated_at?: string | null;
        }

        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped: ContinueWatchingItem[] = (
                json.data as ServerHistoryRow[]
            ).map((row) => ({
                id: String(row.tmdb_id),
                type: row.media_type,
                title: row.title,
                poster_path: row.poster_path,
                backdrop_path: row.backdrop_path,
                season: row.season ? String(row.season) : '1',
                episode: row.episode ? String(row.episode) : '1',
                progress: row.progress_seconds || 0,
                updatedAt: new Date(
                    row.last_watched_at || row.updated_at || Date.now(),
                ).getTime(),
            }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            window.dispatchEvent(new Event('continue-watching-updated'));
        }
    } catch {
        // Ignore network errors
    }
}
