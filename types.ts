interface SpotifyArtist {} // how do you deal with favourite artists?
interface AppleMusicArtist {}
interface SpotifyAlbum {}
interface ArtistMap extends Map<MusicProvider, URL> {}

// For data translation
type ISRC = string;
type MusicProvider = "AppleMusic" | "Spotify";
type ListenHistory = HistoryItem[];

interface Library {
  playlists: Playlist[];
  songs: Song[];
  artists: string[]; // FIXME
  albums: Album[];
}

interface Playlist {
  name: string;
  songs: PlaylistItem[];
  description?: string;
  imageUrl?: string;
  lastModifiedDate?: Date;
  owner?: string;
}

interface PlaylistItem {
  song: Song;
  addedDate: Date;
}

interface Song {
  isrc: ISRC;
  title?: string;
  version?: string;
  year?: number;
  duration?: number;
  artists: string[];
}

interface Album {
  title: string;
  songs: Song[];
  artists: string[];
}

interface HistoryItem {
  timeStamp: Date;
  country: string;
  song: Song;
  durationPlayedMs: number;
  mediaType?: string;
  endReason?: string;
  sourceType?: string;
  playCount?: number;
  skipCount?: number;
  ignoreForRecommendations?:boolean;
  description?: string;
  trackReference: ISRC | undefined;
}

// For visualization

interface SpotifySong extends Song {
  album: SpotifyAlbum;
  href: URL;
  id: string;
  popularity: number;
  previewUrl: URL;
  explicit: boolean;
  durationMs: number;
  spotifyArtists: SpotifyArtist[];
}
