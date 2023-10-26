interface Artist {}
interface SpotifyArtist extends Artist {} // how do you deal with favourite artists?
interface AppleMusicArtist extends Artist {}
interface SpotifyAlbum {}
interface ArtistMap extends Map<MusicProvider, URL> {}

// For data translation
type ISRC = string;
type MusicProvider = "AppleMusic" | "Spotify";
type ListenHistory = HistoryItem[];

interface Library {
  playlists: Playlist[];
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  favourites: (Song | Album | Artist)[];
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
  __type: 'Song',
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

interface AppleMusicLibraryTracksItem {
  'Content Type': string;
  'Track Identifier': number;
  'Title': string;
  'Sort Name' : string;
  'Artist' : string;
  'Sort Artist' : string;
  'Composer' : string;
  'Is Part of Compilation' : boolean;
  'Album' : string;
  'Sort Album' : string;
  'Album Artist' : string;
  'Genre' : string;
  'Track Year' : number;
  'Track Number On Album' : number;
  'Track Count On Album' : number;
  'Disc Number Of Album' : number;
  'Disc Count Of Album' : number;
  'Track Duration' : number;
  'Track Play Count' : number;
  'Date Added To Library' : string;
  'Date Added To iCloud Music Library' : string;
  'Last Modified Date' : string;
  'Last Played Date' : string;
  'Skip Count' : number;
  'Is Purchased' : boolean;
  'Audio File Extension' : string;
  'Track Like Rating' : string;
  'Is Checked' : boolean;
  'Copyright' : string;
  'Release Date' : string;
  'Purchased Track Identifier' : number;
  'Apple Music Track Identifier' : number;
}

type AppleMusicLibraryTracks = AppleMusicLibraryTracksItem[];

interface AppleMusicFavouritesItem {
  'Favorite Type': string;
  'Item Reference': string;
  'Item Description': string;
  'Last Modified': string;
  'Preference': string;
}

type AppleMusicFavourites = AppleMusicFavouritesItem[];

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
