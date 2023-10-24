export namespace types {
  export interface SpotifyArtist {} // how do you deal with favourite artists?
  export interface AppleMusicArtist {}
  export interface SpotifyAlbum {}
  export interface ArtistMap extends Map<MusicProvider, URL> {}
  // 'artist_id': { 'AppleMusic': 'some_id', 'Spotify': 'some_id' }

  // For data translation
  export type ISRC = string;
  export type MusicProvider = "AppleMusic" | "Spotify";
  export type ListenHistory = HistoryItem[];

  export interface Library {
    playlists: Playlist[];
    songs: Song[];
    artists: string[]; // FIXME
    albums: Album[];
  }

  export interface Playlist {
    name: string;
    songs: PlaylistItem[];
    description?: string;
    imageUrl?: string;
    lastModifiedDate?: Date;
    owner?: string;
  }

  export interface PlaylistItem {
    song: Song;
    addedDate: Date;
  }

  export interface Song {
    isrc: ISRC;
    title?: string;
    version?: string;
    year?: number;
    duration?: number;
    artists: string[];
  }

  export interface Album {
    title: string;
    songs: Song[];
    artists: string[];
  }

  export interface HistoryItem {
    timeStamp: Date;
    country: string;
    song: Song;
    durationPlayedMs: number;
    mediaType?: string;
    endReason?: string;
    sourceType?: string;
    playCount?: number;
    skipCount?: number;
    ignoreForRecommendations?: boolean;
    description?: string;
    trackReference: ISRC;
  }

  // For visualization

  export interface SpotifySong extends Song {
    album: SpotifyAlbum;
    href: URL;
    id: string;
    popularity: number;
    previewUrl: URL;
    explicit: boolean;
    durationMs: number;
    spotifyArtists: SpotifyArtist[];
  }
}
