import { AppleMusicAPI } from '../lib/apple-music';

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
    });
  }

  return ret;
}

const ingest = async (args: string[]): Promise<void> => {
  await AppleMusicAPI.init(args[0]);
  const api = AppleMusicAPI.getInstance();

  // TODO put all of this into Library or Mongo
  console.log(JSON.stringify(await api.getSong('1538003843'), null, 2));
  console.log(JSON.stringify(await api.getSongByIsrc('USEE11300353'), null, 2));

  console.log(JSON.stringify(await api.getUserPlaylists(), null, 2));
  console.log(JSON.stringify(await api.getPlaylistTracks('p.b16GBmWfo4LkaVp'), null, 2));
  console.log(await api.getMultipleSongs(['1538003843']));

  console.log(JSON.stringify(await fetchPlaylists(), null, 2));
}

export default ingest;
