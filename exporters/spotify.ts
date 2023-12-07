import { SpotifyAPI } from "../lib/spotify";
import { getSongs, getAlbums, getArtists, getPlaylists } from "../lib/mongo";
import { filterFalsy } from "../lib/utils";

const BATCH_SIZE_20 = 20;
const BATCH_SIZE_50 = 50;
const BATCH_SIZE_100 = 100;

const export_ = async (args: string[]): Promise<void> => {
  console.log(`Exporting data to Spotify; args = ${args}`);
  const clientId = args[0];
  const clientSecret = args[1];

  await SpotifyAPI.initWithAuthorizationCode(clientId, clientSecret);
  const api = SpotifyAPI.getInstance();

  const userProfile = await api.getUserProfile();
  const userId = userProfile.id;

  await exportPlaylists(userId, api);
  await exportSongs(userId, api);
  await exportAlbums(userId, api);
  await exportArtists(userId, api);
};

const exportPlaylists = async (userId: any, api: SpotifyAPI) => {
  const playlists = await getPlaylists();
  for await (const playlist of playlists) {
    console.log(`Exporting playlist ${playlist.name}...`);

    // Create a new playlist
    const createdPlaylist = await api.createPlaylist(userId, {
      name: playlist.name,
      description: playlist.description,
      public: playlist.public ?? false, // FIXME: To update
      collaborative: playlist.collaborative ?? false, // FIXME: To update
    });

    // Get the songs in the playlist
    const songs = filterFalsy(
      await Promise.all(
        playlist.songs.map((item) => api.getSongByIsrc(item.song.isrc))
      )
    );
    const songUris = songs.map((song) => song.uri);

    // Add the songs to the playlist by batches
    for (let i = 0; i < songUris.length; i += BATCH_SIZE_100) {
      const songUrisbatch = songUris.slice(i, i + BATCH_SIZE_100);
      await api.addSongsToPlaylist(createdPlaylist.id, songUrisbatch);
    }
  }

  console.log("Playlist export completed.");
};

const exportSongs = async (userId: any, api: SpotifyAPI) => {
  const songs = await getSongs();
  let songIds: string[] = [];
  for await (const song of songs) {
    // Get the song data
    const spotifySong = await api.getSongByIsrc(song.isrc);
    songIds.push(spotifySong.id);
  }

  // Add the songs to the library by batches
  for (let i = 0; i < songIds.length; i += BATCH_SIZE_50) {
    const songUrisBatch = songIds.slice(i, i + BATCH_SIZE_50);
    await api.addSongsToLibrary(songUrisBatch);
  }

  console.log("Song export completed.");
};

const exportAlbums = async (userId: any, api: SpotifyAPI) => {
  const albums = await getAlbums();
  let albumIds: string[] = [];
  for await (const album of albums) {
    // Get the album data
    const spotifyAlbum = await api.getAlbumByUPC(album.upc);
    albumIds.push(spotifyAlbum.id);
  }

  // Add the album to the library
  for (let i = 0; i < albumIds.length; i += BATCH_SIZE_20) {
    const albumUrisBatch = albumIds.slice(i, i + BATCH_SIZE_20);
    await api.addAlbumsToLibrary(albumUrisBatch);
  }
};

const exportArtists = async (userId: any, api: SpotifyAPI) => {
  const artists = await getArtists();
  let artistIds: string[] = [];
  for await (const artist of artists) {
    // Get the artist data
    const spotifyArtist = await api.getArtistByName(artist.name);
    artistIds.push(spotifyArtist.id);
  }

  // Follow the artists
  for (let i = 0; i < artistIds.length; i += BATCH_SIZE_50) {
    const artistUrisBatch = artistIds.slice(i, i + BATCH_SIZE_50);
    await api.followArtists(artistUrisBatch);
  }
};

export default export_;
