import { AppleMusicAPI } from '../lib/apple-music';

const ingest = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  const api = AppleMusicAPI.getInstance();

  console.log(JSON.stringify(await api.getSong('1538003843'), null, 2));
  console.log(JSON.stringify(await api.getSongByIsrc('USEE11300353'), null, 2));

  await api.getUserPlaylists();
  await api.getPlaylistTracks('p.b16GBmWfo4LkaVp');
  console.log(await api.getMultipleSongs(['1538003843']));
}

export default ingest;
