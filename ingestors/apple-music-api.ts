import { AppleMusicAPI } from '../lib/apple-music';
import { storeAlbums, storeArtists, storePlaylists, storeSongs } from '../lib/mongo';

const fetchPlaylists = async (): Promise<Playlist[]> => {
  const api = AppleMusicAPI.getInstance();
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
      description: playlist.attributes.description.standard,
      lastModifiedDate: new Date(playlist.attributes.lastModifiedDate),
      songs: playlistSongs.map(song => ({song: song})),
      imageUrl: playlist.attributes.artwork?.url,
      public: playlist.attributes.isPublic,
    });
  }

  return ret;
}

const fetchAlbums = async (): Promise<Album[]> => {
  const api = AppleMusicAPI.getInstance();
  const albums = await api.getUserAlbums();

  return albums.map(album => ({
    artists: [album.attributes.artistName],
    title: album.attributes.name,
    upc: album.relationships.catalog.data[0].attributes.upc,
  }));
}

const fetchSongs = async (): Promise<Song[]> => {
  const api = AppleMusicAPI.getInstance();
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

const fetchArtists = async (): Promise<Artist[]> => {
  const api = AppleMusicAPI.getInstance();
  const artists = await api.getAllLibraryArtists();

  return artists.map(artist => ({
    name: artist.attributes.name,
  }));
}

export const ingestPlaylists = async () => {
  await storePlaylists(await fetchPlaylists());
};

export const ingestAlbums = async () => {
  await storeAlbums(await fetchAlbums());
}

export const ingestListeningHistory = async () => {
  // TODO
}

export const ingestSongs = async () => {
  await storeSongs(await fetchSongs());
};

export const ingestArtists = async () => {
  await storeArtists(await fetchArtists());
}

const ingest = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  console.log('Authorization complete...');
  await Promise.all( [
    ingestSongs(),
    ingestArtists(),
    ingestAlbums(),
    ingestListeningHistory(),
    ingestPlaylists(),
  ]);
  console.log('Data Ingestion from Apple Music API complete');
}

export default ingest;
