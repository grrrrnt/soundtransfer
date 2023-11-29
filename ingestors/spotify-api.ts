import "../types";
import axios from "axios";
import fs, { promises as fsAsync } from "fs";
import { SpotifyAPI } from "../lib/spotify";
import { has, kebabCase } from "lodash";
import querystring from "querystring";
import { getLibrary, mergeWithLibrary } from "../lib/library";

const BATCH_SIZE = 50;

const ingest = async (args: string[]): Promise<void> => {
  console.log(`ingesting spotify API; args = ${args}`);
  const clientId = args[0];
  const clientSecret = args[1];

  // Initialize the Spotify API handler
  await SpotifyAPI.initWithAuthorizationCode(clientId, clientSecret);
  const api = SpotifyAPI.getInstance();

  // Populate the songs
  const library = await populateSongs(api);

  // Populate the playlists
  const playlists: Playlist[] = await populatePlaylists(api);
  library.playlists = playlists;

  // TODO: Get saved albums, followed artists

  // Populate the albums

  console.log(JSON.stringify(library, null, 2));
};

const populateSongs = async (api: SpotifyAPI): Promise<Library> => {
  // Initialize the library
  let library: Library = {
    playlists: [],
    songs: [],
    artists: [],
    albums: [],
    favourites: [],
  };

  // Call the Spotify API until all songs are populated
  let nextUrl;
  let apiCallCount = 0; // Used only to prevent hitting API rate limit
  do {
    const songs = await api.getUsersSavedTracks(nextUrl);
    songs.items.forEach((song: any) => {
      const s: Song = {
        __type: "Song",
        isrc: song.track.external_ids.isrc,
        title: song.track.name,
        artists: song.track.artists.map((artist: any) => artist.name),
        year: song.track.album.release_date.split("-")[0],
        duration: song.track.duration_ms,
      };
      library.songs.push(s);
    });
    nextUrl = songs.next;
    if (apiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
  } while (nextUrl !== null);

  return library;
};

const populatePlaylists = async (api: SpotifyAPI): Promise<Playlist[]> => {
  // Initialize the playlists
  let playlists: Playlist[] = [];

  // Call the Spotify API until all playlists are populated
  let playlistsNextUrl;
  let playlistsApiCallCount = 0; // Used only to prevent hitting API rate limit
  do {
    const userPlaylists = await api.getUserPlaylists(playlistsNextUrl);
    for (const playlist of userPlaylists.items) {
      // Get the songs in the playlist
      let songs: PlaylistItem[] = [];
      let playlistSongsNextUrl;
      let playlistSongsApiCallCount = 0; // Used only to prevent hitting API rate limit
      do {
        const playlistSongs = await api.getPlaylistSongs(
          playlist.id,
          playlistSongsNextUrl
        );
        playlistSongs.items.forEach((item: any) => {
          if (item.track === null) return;

          const p: PlaylistItem = {
            song: {
              __type: "Song",
              isrc: item.track.external_ids.isrc,
              title: item.track.name,
              artists: item.track.artists.map((artist: any) => artist.name),
              year: item.track.album.release_date.split("-")[0],
              duration: item.track.duration_ms,
            },
            addedDate: new Date(item.added_at),
          };
          songs.push(p);
        });
        playlistSongsNextUrl = playlistSongs.next;
        if (playlistSongsApiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
      } while (playlistSongsNextUrl !== null);

      const p: Playlist = {
        name: playlist.name,
        songs: songs,
        description: playlist.description,
        imageUrl: playlist.images[0].url,
        // lastModifiedDate: new Date(playlist.lastModifiedDate), -- not available via API cal
        owner: playlist.owner.display_name,
      };
      playlists.push(p);
    }
    playlistsNextUrl = userPlaylists.next;
    if (playlistsApiCallCount++ > 2) break; // Used only to prevent hitting API rate limit
  } while (playlistsNextUrl !== null);

  return playlists;
};

// const populateAlbums = async (api: SpotifyAPI): Promise<Album[]> => {};

export default ingest;
