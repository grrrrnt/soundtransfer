interface Artist {
  name: string;
}

interface AppleMusicArtists {
  id: string;
  type: 'artists';
  href: string;
  attributes: {
    artwork?: {
      width: number;
      height: number;
      url: string;
      bgColor: string;
      textColor1: string;
      textColor2: string;
      textColor3: string;
      textColor4: string;
    };
    editorialNotes?: Record<string, unknown>;
    genreNames: string[];
    name: string;
    url: string;
  };
  relationships: {
    albums: {
      href: string;
      next: string;
      data: {
        id: string;
        type: 'albums';
        href: string;
      }[];
    };
  };
  views?: object;
}

interface AppleMusicResource {
  id: string;
  type: AppleMusicResourceTypes;
  href?: string;
  attributes: object;
  relationships: object;
  meta?: object;
  views?: object;
}

interface SpotifyAlbum {
}

interface ArtistMap extends Map<MusicProvider, URL> {
}

// For data translation
type ISRC = string;
type UPC = string;
type MusicProvider = 'AppleMusic' | 'Spotify';
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
  public?: boolean;
  collaborative?: boolean;
}

interface PlaylistItem {
  song: Song;
  addedDate?: Date;
}

interface Song {
  __type: 'Song';
  isrc: ISRC;
  title?: string;
  version?: string;
  year?: number;
  duration?: number;
  artists: string[];
  album?: string;
}

interface Album {
  title: string;
  songs?: Song[];
  artists: string[];
  upc: UPC;
}

interface HistoryItem {
  timeStamp: Date;
  song: Song;
  durationPlayedMs: number;
  country?: string;
  mediaType?: string;
  endReason?: string;
  sourceType?: string;
  playCount?: number;
  skipCount?: number;
  ignoreForRecommendations?: boolean;
  description?: string;
  trackReference?: ISRC | undefined;
}

interface AppleMusicExportHistoryItem {
  Country: string;
  'Track Identifier': string;
  'Media type': string;
  'Date Played': string;
  Hours: string;
  'Play Duration Milliseconds': string;
  'End Reason Type': string;
  'Source Type': string;
  'Play Count': string;
  'Skip Count': string;
  'Ignore For Recommendations': string;
  'Track Reference': string;
  'Track Description': string;
}

type AppleMusicHistoryExport = AppleMusicExportHistoryItem[];

interface AppleMusicLibraryTracksItem {
  'Content Type': string;
  'Track Identifier': number;
  Title: string;
  'Sort Name': string;
  Artist: string;
  'Sort Artist': string;
  Composer: string;
  'Is Part of Compilation': boolean;
  Album: string;
  'Sort Album': string;
  'Album Artist': string;
  Genre: string;
  'Track Year': number;
  'Track Number On Album': number;
  'Track Count On Album': number;
  'Disc Number Of Album': number;
  'Disc Count Of Album': number;
  'Track Duration': number;
  'Track Play Count': number;
  'Date Added To Library': string;
  'Date Added To iCloud Music Library': string;
  'Last Modified Date': string;
  'Last Played Date': string;
  'Skip Count': number;
  'Is Purchased': boolean;
  'Audio File Extension': string;
  'Track Like Rating': string;
  'Is Checked': boolean;
  Copyright: string;
  'Release Date': string;
  'Purchased Track Identifier': number;
  'Apple Music Track Identifier': number;
}

type AppleMusicLibraryTracks = AppleMusicLibraryTracksItem[];

interface AppleMusicFavouritesItem {
  'Favorite Type': string;
  'Item Reference': string;
  'Item Description': string;
  'Last Modified': string;
  Preference: string;
}

interface AppleMusicCatalogSong extends AppleMusicResource {
  type: 'songs';
  attributes: {
    albumName: string;
    genreName: string[];
    artwork: {
      width: number;
      height: number;
      url: string;
      bgColor: string;
      textColor1: string;
      textColor2: string;
      textColor3: string;
      textColor4: string;
    };
    isrc: string;
    releaseDate: string;
    composerName: string;
    url: string;
    playParams: {
      id: string;
      kind: string;
    };
    discNumber: number;
    hasCredits: boolean;
    hasLyrics: boolean;
    durationInMillis: number;
    isAppleDigitalMaster: boolean;
    name: string;
    previews: {
      url: string;
    }[];
    artistName: string;
  };
  relationships: {
    artists: {
      href: string;
      data: {
        id: string;
        type: string;
        href: string;
      }[];
    };
    albums: {
      href: string;
      data: {
        id: string;
        type: string;
        href: string;
      }[];
    };
  };
}

interface AppleMusicGetCatalogSongResponse {
  data: AppleMusicCatalogSong[];
}

interface AppleMusicGetCatalogSongsByISRCResponse {
  data: AppleMusicCatalogSong[];
}

interface AppleMusicPlaylistExportItem {
  'Container Type': string;
  'Container Identifier': number;
  Title?: string;
  'Playlist Item Identifiers': number[];
  Description: string;
  'Public Playlist Identifier': string;
  'Playlist is Shared': boolean;
  'Playlist Previously Shared': boolean;
  'Added Date': string;
  'Available on Apple Music Profile'?: boolean;
  'Name or Description Modified Date': string;
  'Playlist Items Modified Date': string;
}

interface AppleMusicLibraryActivityItem {
  'Transaction Type': string;
  'Transaction Identifier': string;
  'Transaction Date': string;
  UserAgent: string;
  Country: string;
  Language: string;

  [key: string]: any;
}

type AppleMusicLibraryActivity = AppleMusicLibraryActivityItem[];

type AppleMusicPlaylistExport = AppleMusicPlaylistExportItem[];

type AppleMusicFavourites = AppleMusicFavouritesItem[];

// FIXME
interface AppleMusicPlaylists extends AppleMusicResource {
  type: 'playlists';
}

interface AppleMusicLibraryPlaylists extends AppleMusicResource {
  attributes: {
    name: string;
    lastModifiedDate: string;
    canEdit: boolean;
    isPublic: boolean;
    description: {
      standard: string;
    };
    hasCatalog: boolean;
    playParams: {
      id: string;
      kind: string;
      isLibrary: boolean;
      globalId: string;
    };
    dateAdded: string;
    artwork: {
      width: number | null;
      height: number | null;
      /**
       * This is not a usable URL. Some URLs end in /{w}x{h}cc.jpg which need to replaced with
       * the required width and height values to get a usable image.
       */
      url: string;
    };
  };
  relationships: {
    tracks: {
      href?: string;
      next?: string;
      data: AppleMusicLibrarySongs[];
    };
    catalog: {
      href?: string;
      next?: string;
      data: AppleMusicPlaylists[];
    };
  };
}

interface AppleMusicLibraryPlaylistsResponse {
  data: AppleMusicLibraryPlaylists[];
  next?: string;
  meta?: {
    total: number;
  };
}

// For visualization

// interface SpotifySong extends Song {
//   album: SpotifyAlbum;
//   href: URL;
//   id: string;
//   popularity: number;
//   previewUrl: URL;
//   explicit: boolean;
//   durationMs: number;
//   spotifyArtists: SpotifyArtist[];
// }

interface AppleMusicArtistsResponse {
  data: AppleMusicArtists[];
}

interface AppleMusicLibraryPlaylistCreationRequest {
  attributes: {
    name: string;
    description?: string;
  };
  relationships?: {
    tracks: {
      data: {
        id: string;
        type:
          | 'library-music-videos'
          | 'library-songs'
          | 'music-videos'
          | 'songs';
      }[];
    };
    /** The library playlist folder which contains the created playlist. */
    parent: {
      data: {
        id: string;
        type: 'library-playlist-folders';
      }[];
    };
  };
}

interface AppleMusicLibraryPlaylistFoldersResponse {
  data: AppleMusicLibraryPlaylistFolders[];
}

interface AppleMusicLibraryPlaylistFolders extends AppleMusicResource {
  type: 'library-playlist-folders';
  attributes: {
    /** Date added in ISO 8601 */
    dateAdded?: string;
    /** The (potentially) censored name of the content. */
    name: string;
  };
  relationships: {
    children: {
      href: string;
      next: string;
      data: (AppleMusicLibraryPlaylistFolders | AppleMusicLibraryPlaylists)[];
    };
    parent: {
      href: string;
      next: string;
      data: AppleMusicLibraryPlaylistFolders[];
    };
  };
}

interface AppleMusicLibrarySongs extends AppleMusicResource {
  type: 'library-songs';
  attributes: {
    albumName: string;
    artistName: string;
    artwork: object;
    contentRating?: 'clean' | 'explicit';
    discNumber: number;
    durationInMillis: number;
    genreNames: string[];
    hasLyrics: boolean;
    name: string;
    playParams: object;
    /** The release date of the song, when known, in YYYY-MM-DD or YYYY format. Pre-release songs may have an expected release date in the future. */
    releaseDate?: string;
    trackNumber?: number;
  };
  relationships: {
    albums?: object;
    artists?: object;
    catalog?: {
      href?: string;
      next?: string;
      data: AppleMusicCatalogSong[];
    };
  };
}

interface AppleMusicLibrarySongsResponse {
  data: AppleMusicLibrarySongs[];
  meta?: {
    total: number;
  };
  next?: string;
}

interface SpotifyLibraryPlaylistCreationRequest {
  name: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
}

interface AppleMusicAlbums extends AppleMusicResource {
  type: 'albums';
  attributes: {
    artistName: string;
    artistUrl: string;
    artwork: object;
    audioVariants: string[];
    contentRating: 'clean' | 'explicit';
    copyright: string;
    editorialNotes: object;
    genreNames: string[];
    isCompilation: boolean;
    isComplete: boolean;
    isMasteredForItunes: boolean;
    isSingle: boolean;
    playParams: object;
    recordLabel: string;
    releaseDate: string;
    upc: string;
    url: string;
  };
}

interface AppleMusicLibraryAlbums extends AppleMusicResource {
  type: 'library-albums';
  attributes: {
    artistName: string;
    artwork: object;
    contentRating: string;
    dateAdded: string;
    name: string;
    playParams: {
      id: string;
      kind: 'album';
      isLibrary: boolean;
    };
    releaseDate: string;
    trackCount: number;
    genreCount: string[];
  };
  relationships: {
    artists: object;
    catalog: {
      href: string;
      next: string;
      data: [AppleMusicAlbums];
    };
    tracks: object;
  };
}

interface AppleMusicLibraryAlbumsResponse {
  data: AppleMusicLibraryAlbums[];
  meta: {
    total: number;
  };
  next?: string;
}

type AppleMusicResourceTypes =
  'stations' |
  'station-genres' |
  'songs' |
  'record-labels' |
  'ratings' |
  'playlists' |
  'music-videos' |
  'genres' |
  'curators' |
  'artists' |
  'apple-curators' |
  'albums' |
  'activities' |
  'library-playlist-folders' |
  'library-songs' |
  'library-albums' |
  'library-artists';

interface AppleMusicAlbumsResponse {
  data: AppleMusicAlbums[];
}

interface AppleMusicSearchResponse {
  results: Partial<{
    activities: object;
    albums: object;
    'apple-curators': object;
    artists: {
      data: AppleMusicArtists[];
      href?: string;
      next?: string;
    };
    curators: object;
    'music-videos': object;
    songs: object;
    stations: object;
    top: object;
  }>;
}

interface AppleMusicLibraryArtists extends AppleMusicResource {
  type: 'library-artists';
  attributes: {
    name: string;
  };
  relationships: {
    albums: {
      href?: string;
      next?: string;
      data: AppleMusicAlbums[];
    };
    catalog: {
      href?: string;
      next?: string;
      data: [AppleMusicArtists];
    };
  };
}

interface AppleMusicLibraryArtistsResponse {
  data: AppleMusicLibraryArtists[];
  meta: {
    total: number;
  };
  next?: string;
}
