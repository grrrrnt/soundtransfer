import { SpotifyAPI } from "../lib/spotify";
import { getPlaylists } from "../lib/mongo";
import { filterFalsy } from "../lib/utils";

const export_ = async (args: string[]): Promise<void> => {
  console.log(`Exporting data to Spotify; args = ${args}`);
  const clientId = args[0];
  const clientSecret = args[1];

  await SpotifyAPI.initWithAuthorizationCode(clientId, clientSecret);
  const api = SpotifyAPI.getInstance();
  const playlists = await getPlaylists();

  const userProfile = await api.getUserProfile();
  const userId = userProfile.id;

  for await (const playlist of playlists) {
    console.log(`Exporting playlist ${playlist.name}...`);

    const createdPlaylist = await api.createPlaylist(userId, {
      name: playlist.name,
      description: playlist.description,
      public: playlist.public ?? true, // FIXME: To update
      collaborative: playlist.collaborative ?? false, // FIXME: To update
    });

    // const songs = filterFalsy(
    //   await Promise.all(
    //     playlist.songs.map((item) => api.getSongByIsrc(item.song.isrc))
    //   )
    // );

    // await api.createPlaylist({
    //   attributes: {
    //     name: playlist.name,
    //     description: playlist.description,
    //   },
    //   relationships: {
    //     parent: {
    //       data: (
    //         await api.getRootLibraryPlaylistsFolder()
    //       ).map((folder) => ({
    //         id: folder.id,
    //         type: "library-playlist-folders",
    //       })),
    //     },
    //     tracks: {
    //       data: songs.map((song) => ({ id: song.id, type: "songs" })),
    //     },
    //   },
    // });
  }

  console.log("Playlist export completed.");
};

export default export_;
