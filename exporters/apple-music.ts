import { AppleMusicAPI } from '../lib/apple-music';
import { getPlaylists } from '../lib/mongo';
import { filterFalsy } from '../lib/utils';

const export_ = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
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
};

export default export_;
