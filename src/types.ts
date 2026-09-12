export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export interface SeasonDefinition {
  key: Season;
  labelPt: string;
  monthPt: string;
  quarterPt: string;
  monthsRange: string;
  iconName: string;
  order: number;
}

export type DisplayFormat = 'grid-standard' | 'grid-compact' | 'list-detailed';

export type AnimeType =
  | 'Todos os Tipos'
  | 'Continuação'
  | 'Estréia'
  | 'Especial - TV'
  | 'Filme'
  | 'OVA'
  | 'ONA';

export interface AnimeVideo {
  id: string;
  title: string;
  type: 'OP' | 'ED' | 'Trailer' | string;
  displayTypeLabel?: string; // e.g. "Trailer", "OP", "ED", "Abertura 1", "Abertura 2", "Abertura 1v2", "Encerramento 1", "Encerramento 2"
  songTitle?: string;
  artistName?: string;
  youtubeId?: string;
  videoUrl?: string; // Direct .webm / .mp4 video stream from AnimeThemes
  audioUrl?: string;
  thumbnail?: string;
  source?: 'youtube' | 'animethemes';
  // AnimeThemes metadata
  version?: number;
  hasMultipleVersions?: boolean;
  episodes?: string; // e.g. "1-2", "4-", "8"
  spoiler?: boolean;
  nsfw?: boolean;
  uncen?: boolean;
  overlap?: 'Over' | 'Transition' | 'None' | string;
  resolution?: number; // e.g. 720, 1080
  videoSourceType?: string; // e.g. "WEB", "BD", "DVD"
}

export interface ExternalLink {
  site: string;
  url: string;
  type?: 'anidb' | 'mal' | 'crunchyroll' | 'anilist' | 'netflix' | 'disney' | 'max' | 'prime' | 'official' | 'other' | string;
}

export interface AnimeItem {
  id: number;
  malId?: number;
  anilistId?: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
    portuguese?: string;
    userPreferred: string;
  };
  synopsisPt: string;
  synopsisEn?: string;
  coverImages: string[];
  coverColor?: string;
  bannerImage?: string;
  format: string; // TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA
  typeLabel: AnimeType;
  episodes: number | string; // e.g. 12, 24, "???"
  status: string;
  nextAiringEpisode?: {
    episode: number;
    airingAt?: number;
    timeUntilAiring?: number;
  };
  season: Season;
  seasonYear: number;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
    formatted?: string;
  };
  genres: string[];
  studio: {
    name: string;
    notableWorks?: string;
  };
  director?: string;
  directorNote?: string;
  score?: number;
  popularity?: number;
  externalLinks: ExternalLink[];
  videos: AnimeVideo[];
}

export interface SeasonFilterState {
  type: AnimeType;
  genre: string;
  search: string;
  sortBy: 'default' | 'popularity' | 'score' | 'title' | 'date';
  format: DisplayFormat;
}
