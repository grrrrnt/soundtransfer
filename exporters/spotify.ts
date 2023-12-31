import { SpotifyAPI } from "../lib/spotify";
import { getSongs, getAlbums, getArtists, getPlaylists } from "../lib/mongo";
import { filterFalsy } from "../lib/utils";

const BATCH_SIZE_20 = 20;
const BATCH_SIZE_50 = 50;
const BATCH_SIZE_100 = 100;

export const exportPlaylists = async (api: SpotifyAPI) => {
  const userProfile = await api.getUserProfile();
  const userId = userProfile.id;

  const playlists = await getPlaylists();
  for await (const playlist of playlists) {
    console.log(`Exporting playlist ${playlist.name}...`);

    // Create a new playlist
    const createdPlaylist = await api.createPlaylist(userId, {
      name: playlist.name,
      description: playlist.description,
      public: playlist.public ?? false,
      collaborative: playlist.collaborative ?? false,
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

export const exportSongs = async (api: SpotifyAPI) => {
  const songs = await getSongs();
  let songIds: string[] = [];
  for await (const song of songs) {
    // Get the song data
    const spotifySong = await api.getSongByIsrc(song.isrc);
    if (spotifySong) {
      songIds.push(spotifySong.id);
    }
  }

  // Add the songs to the library by batches
  for (let i = 0; i < songIds.length; i += BATCH_SIZE_50) {
    const songUrisBatch = songIds.slice(i, i + BATCH_SIZE_50);
    await api.addSongsToLibrary(songUrisBatch);
  }

  console.log("Song export completed.");
};

export const exportAlbums = async (api: SpotifyAPI) => {
  const albums = await getAlbums();
  let albumIds: string[] = [];
  for await (const album of albums) {
    // Get the album data
    const spotifyAlbum = await api.getAlbumByUPC(album.upc);
    if (spotifyAlbum) {
      albumIds.push(spotifyAlbum.id);
    }
  }

  // Add the album to the library
  for (let i = 0; i < albumIds.length; i += BATCH_SIZE_20) {
    const albumUrisBatch = albumIds.slice(i, i + BATCH_SIZE_20);
    await api.addAlbumsToLibrary(albumUrisBatch);
  }
};

export const exportArtists = async (api: SpotifyAPI) => {
  const artists = await getArtists();
  let artistIds: string[] = [];
  for await (const artist of artists) {
    // Get the artist data
    const spotifyArtist = await api.getArtistByName(artist.name);
    if (spotifyArtist) {
      artistIds.push(spotifyArtist.id);
    }
  }

  // Follow the artists
  for (let i = 0; i < artistIds.length; i += BATCH_SIZE_50) {
    const artistUrisBatch = artistIds.slice(i, i + BATCH_SIZE_50);
    await api.followArtists(artistUrisBatch);
  }
};
