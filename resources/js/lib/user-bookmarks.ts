import type { Movie } from '@/types/tmdb';

const STORAGE_KEY = 'netflix_mylist';

function getXsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function readLocalMyList(): Movie[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function writeLocalMyList(movies: Movie[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
        window.dispatchEvent(new Event('user-bookmarks-updated'));
    } catch {
        // Ignore localStorage error
    }
}

export async function fetchUserBookmarks(): Promise<Movie[] | null> {
    if (typeof window === 'undefined') return null;
    try {
        const res = await fetch('/api/user/bookmarks', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        interface ServerBookmarkRow {
            tmdb_id: string;
            media_type?: 'movie' | 'tv';
            title: string;
            poster_path?: string | null;
            backdrop_path?: string | null;
            vote_average?: number | null;
            overview?: string | null;
            release_date?: string | null;
        }

        if (!res.ok) return null;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            const mapped: Movie[] = (
                json.data as ServerBookmarkRow[]
            ).map((row) => ({
                id: Number(row.tmdb_id),
                media_type: row.media_type,
                title: row.title,
                name: row.title,
                poster_path: row.poster_path ?? null,
                backdrop_path: row.backdrop_path ?? null,
                vote_average: Number(row.vote_average) || 0,
                overview: row.overview || '',
                release_date: row.release_date ?? undefined,
            }));

            // Cache locally for instant UI render
            writeLocalMyList(mapped);
            return mapped;
        }
    } catch {
        // Fallback to local
    }
    return null;
}

export async function toggleServerBookmark(movie: Movie): Promise<boolean | null> {
    if (typeof window === 'undefined') return null;
    try {
        const res = await fetch('/api/user/bookmarks/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getXsrfToken(),
            },
            body: JSON.stringify({
                tmdb_id: String(movie.id),
                media_type: movie.media_type ?? 'movie',
                title: movie.title ?? movie.name ?? 'Untitled',
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                vote_average: movie.vote_average,
                overview: movie.overview,
                release_date: movie.release_date ?? movie.first_air_date,
            }),
        });

        if (!res.ok) return null;
        const json = await res.json();
        if (json.success) {
            return json.bookmarked;
        }
    } catch {
        // Return null if request fails (e.g. unauthenticated)
    }
    return null;
}
