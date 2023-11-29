import { AppleMusicAPI } from '../lib/apple-music';
import { getPlaylists } from '../lib/mongo';

const export_ = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  const api = AppleMusicAPI.getInstance();
  const playlists = await getPlaylists();

  for await (const playlist of playlists) {
    console.log('Here');
    const songs: {
      id: string,
      type: 'songs'
    }[] = [];

    for (const item of playlist.songs) {
      const foundSong = await api.getSongByIsrc(item.song.isrc);
      if (!foundSong) {
        continue;
      }

      songs.push({
        id: foundSong.id,
        type: 'songs',
      });
    }

    await api.createPlaylist({
      attributes: {
        name: playlist.name,
        description: playlist.description,
      },
      relationships: {
        parent: {
          data: [],
        },
        tracks: {
          data: songs,
        },
      },
    });
  }

  console.log('Playlist export completed.');
};

export default export_;
