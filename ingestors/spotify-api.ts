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
  let hasMoreSongs = true;
  while (hasMoreSongs) {
    const songs = await api.getUsersSavedTracks();
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
    hasMoreSongs = songs.next !== null;
  }

  return library;
};

export default ingest;
