import { SpotifyAPI } from "../lib/spotify";
import { getPlaylists } from "../lib/mongo";
import { filterFalsy } from "../lib/utils";

const BATCH_SIZE = 100;

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

    // Create a new playlist
    const createdPlaylist = await api.createPlaylist(userId, {
      name: playlist.name,
      description: playlist.description,
      public: playlist.public ?? false, // FIXME: To update
      collaborative: playlist.collaborative ?? false, // FIXME: To update
    });

    // TODO: Upload playlist image: PUT /playlists/{playlist_id}/images

    // Get the songs in the playlist
    const songs = filterFalsy(
      await Promise.all(
        playlist.songs.map((item) => api.getSongByIsrc(item.song.isrc))
      )
    );
    const songUris = songs.map((song) => song.uri);

    // Add the songs to the playlist by batches
    for (let i = 0; i < songUris.length; i += BATCH_SIZE) {
      const songUrisbatch = songUris.slice(i, i + BATCH_SIZE);
      await api.addSongsToPlaylist(createdPlaylist.id, songUrisbatch);
    }
  }

  console.log("Playlist export completed.");
};

export default export_;
