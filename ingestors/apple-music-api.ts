import { AppleMusicAPI } from '../lib/apple-music';

const ingest = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  const api = AppleMusicAPI.getInstance();

  console.log(JSON.stringify(await api.getSong('1538003843')));

  const userMusicToken = api.getUserMusicToken();
  console.log(`Got token: ${userMusicToken}`);
}

export default ingest;
