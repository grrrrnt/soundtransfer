import { AppleMusicAPI } from '../lib/apple-music';

const export_ = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  const api = AppleMusicAPI.getInstance();

  console.log(JSON.stringify(await api.createPlaylist({
    attributes: {
      name: 'Test Playlist using API',
      description: 'Some description',
    },
    relationships: {
      parent: {
        data: [],
      },
      tracks: {
        data: [
          {
            id: '1702966466',
            type: 'songs',
          },
        ],
      },
    },
  }), null, 2));
};

export default export_;
