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
    release_date?: string;
    first_air_date?: string;
    adult?: boolean;
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

export interface TmdbProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
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
    runtime?: number;
    air_date?: string;
}

export interface TmdbSeasonDetails {
    id: number;
    season_number: number;
    episodes: TmdbEpisode[];
    name?: string;
    overview?: string;
    poster_path?: string | null;
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
    number_of_seasons?: number;
    number_of_episodes?: number;
    status?: string;
    tagline?: string;
    production_companies?: TmdbProductionCompany[];
    adult?: boolean;
}
