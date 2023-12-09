import { AppleMusicAPI } from '../lib/apple-music';
import { getAlbums, getArtists, getPlaylists, getSongs } from '../lib/mongo';
import { filterFalsy } from '../lib/utils';

const exportSongs = async (api: AppleMusicAPI) => {
  const songIds: string[] = [];

  for await (const song of await getSongs()) {
    const appleMusicSong = await api.getSongByIsrc(song.isrc);
    appleMusicSong && songIds.push(appleMusicSong?.id);
  }

  await api.addResourceToLibrary({
    songs: songIds,
  });
}

const exportPlaylists = async (api: AppleMusicAPI) => {
  const playlists = await getPlaylists();

  for await (const playlist of playlists) {
    const songs = filterFalsy(
      await Promise.all(
        playlist.songs.map(item => api.getSongByIsrc(item.song.isrc))));

    await api.createPlaylist({
      attributes: {
        name: playlist.name,
        description: playlist.description,
      },
      relationships: {
        parent: {
          data: (await api.getRootLibraryPlaylistsFolder()).map(folder => ({id: folder.id, type: 'library-playlist-folders'})),
        },
        tracks: {
          data: songs.map(song => ({id: song.id, type: 'songs'})),
        },
      },
    });
  }

  console.log('Playlist export completed.');
}

const exportAlbums = async (api: AppleMusicAPI) => {
  const userAlbums = await getAlbums();
  const albumIdsToAdd: string[] = [];

  for await (const userAlbum of userAlbums) {
    const appleMusicAlbum = await api.getAlbumByUPC(userAlbum.upc);
    if (!appleMusicAlbum) {
      console.error(`Album with title ${userAlbum.title} not available in Apple Music`);
      continue;
    }

    albumIdsToAdd.push(appleMusicAlbum.id);
  }

  await api.addResourceToLibrary({
    albums: albumIdsToAdd,
  });

  console.log('Album export completed');
}

const exportArtists = async (api: AppleMusicAPI) => {
  const userArtists = await getArtists();
  const artistIds: string[] = [];

  for await (const artist of userArtists) {
    const searchResults = await api.searchForCatalogResources(artist.name, ['artists']);
    if (!searchResults || !searchResults.results.artists) {
      console.error(`Artist with name ${artist.name} is not available in Apple Music`);
      continue;
    }

    artistIds.push(searchResults.results.artists?.data[0].id); // take first match
  }

  await api.addResourceToLibrary({
    artists: artistIds,
  });

  console.log('Artist export completed');
}
