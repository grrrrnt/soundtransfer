import { AppleMusicAPI } from '../lib/apple-music';
import { getAlbums, getPlaylists, getSongs } from '../lib/mongo';
import { filterFalsy } from '../lib/utils';

const exportSongs = async () => {
  const api = AppleMusicAPI.getInstance();
  const userAlbums = await getAlbums();
  const songIds: string[] = [];

  for await (const song of await getSongs()) {
    const appleMusicSong = await api.getSongByIsrc(song.isrc);
    appleMusicSong && songIds.push(appleMusicSong?.id);
  }

  await api.addResourceToLibrary({
    songs: songIds,
  });
}

const exportPlaylists = async () => {
  const api = AppleMusicAPI.getInstance();
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

const exportAlbums = async () => {
  const api = AppleMusicAPI.getInstance();
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

const export_ = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  await exportPlaylists();
  await exportAlbums();
  await exportSongs();
};

export default export_;
