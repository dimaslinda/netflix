export interface Movie {
    id: number;
    media_type?: 'movie' | 'tv';
    title?: string;
    original_name?: string;
    name?: string;
    overview: string;
    backdrop_path: string | null;
    poster_path: string | null;
    vote_average: number;
    genre_ids?: number[];
}

export interface TmdbResponse {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
}

export interface TmdbVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
}

export interface TmdbVideoBest {
    id: string | null;
    name: string | null;
    site: string | null;
    type: string | null;
    key: string | null;
    embed_url: string | null;
}

export interface TmdbVideosApiResponse {
    best: TmdbVideoBest | null;
    results: TmdbVideo[];
}

export interface TmdbGenre {
    id: number;
    name: string;
}

export interface TmdbSeasonSummary {
    id: number;
    season_number: number;
    episode_count: number;
    name?: string;
}

export interface TmdbEpisode {
    id: number;
    name: string;
    overview: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
}

export interface TmdbSeasonDetails {
    id: number;
    season_number: number;
    episodes: TmdbEpisode[];
}

export interface TmdbDetails {
    id: number;
    backdrop_path: string | null;
    poster_path: string | null;
    overview: string;
    title?: string;
    name?: string;
    original_name?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    genres?: TmdbGenre[];
    seasons?: TmdbSeasonSummary[];
}
