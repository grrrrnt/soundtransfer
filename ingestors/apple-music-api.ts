import { AppleMusicAPI } from '../lib/apple-music';
import { storeAlbums, storeArtists, storeListeningHistory, storePlaylists, storeSongs } from '../lib/mongo';

const fetchPlaylists = async (api: AppleMusicAPI): Promise<Playlist[]> => {
  const ret: Playlist[] = [];
  const playlists = await api.getUserPlaylists();

  for (const playlist of playlists) {
    const playlistWithTracks = await api.getLibraryPlaylist(playlist.id);
    const playlistTracks = playlistWithTracks.relationships.tracks!.data;
    const playlistSongs: Song[] = [];

    for (const track of playlistTracks) {
      const librarySong = await api.getLibrarySong(track.id);
      const catalogId = librarySong.relationships.catalog!.data[0].id;
      const catalogSong = await api.getSong(catalogId);
      playlistSongs.push({
        __type: 'Song',
        isrc: catalogSong.attributes.isrc,
        title: catalogSong.attributes.name,
        artists: [catalogSong.attributes.artistName],
        duration: catalogSong.attributes.durationInMillis,
        year: new Date(catalogSong.attributes.releaseDate).getFullYear(),
      });
      catalogSong.attributes.isrc;
    }

    ret.push({
      name: playlist.attributes.name,
      description: playlist.attributes.description?.standard ?? undefined,
      lastModifiedDate: new Date(playlist.attributes.lastModifiedDate),
      songs: playlistSongs.map(song => ({song: song})),
      imageUrl: playlist.attributes.artwork?.url,
      public: playlist.attributes.isPublic,
    });
  }

  return ret;
}

const fetchAlbums = async (api: AppleMusicAPI): Promise<Album[]> => {
  const albums = await api.getUserAlbums();

  return albums.map(album => ({
    artists: [album.attributes.artistName],
    title: album.attributes.name,
    upc: album.relationships.catalog.data[0].attributes.upc,
  }));
}

const fetchSongs = async (api: AppleMusicAPI): Promise<Song[]> => {
  const songs = await api.getAllLibrarySongs();

  return songs.map(song => ({
    __type: 'Song',
    isrc: song.relationships.catalog?.data[0].attributes.isrc!,
    title: song.attributes.name,
    album: song.attributes.albumName,
    artists: [song.attributes.artistName],
    duration: song.attributes.durationInMillis,
    year: song.attributes.releaseDate ? new Date(song.attributes.releaseDate).getFullYear() : undefined,
  }));
}

const fetchArtists = async (api: AppleMusicAPI): Promise<Artist[]> => {
  const artists = await api.getAllLibraryArtists();

  return artists.map(artist => ({
    name: artist.attributes.name,
  }));
}

export const ingestPlaylists = async (api: AppleMusicAPI) => {
  await storePlaylists(await fetchPlaylists(api));
};

export const ingestAlbums = async (api: AppleMusicAPI) => {
  await storeAlbums(await fetchAlbums(api));
}

export const ingestListeningHistory = async (api: AppleMusicAPI) => {
  const recentTracks = await api.getRecentlyPlayedTracks();
  await storeListeningHistory(recentTracks.map(track => ({
    song: {
      title: track.attributes.name,
      year: new Date(track.attributes.releaseDate).getFullYear(),
      artists: [track.attributes.artistName],
      duration: track.attributes.durationInMillis,
      isrc: track.attributes.isrc,
      album: track.attributes.albumName,
      __type: 'Song',
    },
    durationPlayedMs: track.attributes.durationInMillis,
    timeStamp: new Date(0),
  })));
}

export const ingestSongs = async (api: AppleMusicAPI) => {
  await storeSongs(await fetchSongs(api));
};

export const ingestArtists = async (api: AppleMusicAPI) => {
  await storeArtists(await fetchArtists(api));
}
