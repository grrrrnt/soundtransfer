import "../types";
import axios from "axios";
import fs, { promises as fsAsync } from "fs";
import { SpotifyAPI } from "../lib/spotify";
import { kebabCase } from "lodash";
import querystring from "querystring";
import { getLibrary, mergeWithLibrary } from "../lib/library";

const BATCH_SIZE = 50;

/*
  Within the directory, the following JSON files are relevant:
    1. YourLibrary.json
    2. StreamingHistory{0..n}.json
    3. Playlist1.json                 // Unsure if what the "1" is about
*/
const ingest = async (args: string[]): Promise<void> => {
  console.log(`ingesting spotify data export; args = ${args}`);
  const path: string = args[0];
  const clientId = args[1];
  const clientSecret = args[2];

  // Initialize the Spotify API handler
  await SpotifyAPI.initWithClientCredentials(clientId, clientSecret);
  const api = SpotifyAPI.getInstance();

  // Get the JSON files
  const libraryJSON = JSON.parse(
    fs.readFileSync(`${path}/YourLibrary.json`, "utf8")
  );

  // Find all the streaming history files
  const streamingHistoryFiles = fs.readdirSync(path).filter((file) => {
    return file.startsWith("StreamingHistory");
  });

  // Merge the streaming history files
  let streamingHistoryJSON: any[] = [];
  for (const file of streamingHistoryFiles) {
    const json = JSON.parse(fs.readFileSync(`${path}/${file}`, "utf8"));
    streamingHistoryJSON = streamingHistoryJSON.concat(json);
  }

  // Read the playlists
  const playlistsJSON = JSON.parse(
    fs.readFileSync(`${path}/Playlist1.json`, "utf8")
  );

  // Authorize the Spotify API
  await api.authorizeSpotify();

  // Populate the songs
  const library = await populateSongs(libraryJSON, api);

  // Populate the playlists
  const playlists: Playlist[] = await populatePlaylists(playlistsJSON, api);
  library.playlists = playlists;

  // Populate the listen history
  const listenHistory: ListenHistory = await populateListenHistory(
    streamingHistoryJSON,
    api
  );

  // TODO: Do what with the library and listen history?
  // console.log(JSON.stringify(library, null, 2));
  console.log("Listening history size: ", listenHistory.length);
  console.log(JSON.stringify(listenHistory, null, 2));
};

const populateSongs = async (
  libraryJSON: any,
  api: SpotifyAPI
): Promise<Library> => {
  // Initialize the library
  let library: Library = {
    playlists: [],
    songs: [],
    artists: [],
    albums: [],
    favourites: [],
  };

  const chunks = [];
  for (let i = 0; i < libraryJSON.tracks.length; i += BATCH_SIZE) {
    const chunk = libraryJSON.tracks.slice(i, i + BATCH_SIZE);
    chunks.push(chunk);
  }

  for (const chunk of chunks) {
    const spotifyURIs = chunk.map((item: any) => item.uri);
    const songs = await api.getSongsFromSpotifyURIs(spotifyURIs);
    songs.tracks.forEach((song: any) => {
      const s: Song = {
        __type: "Song",
        isrc: song.external_ids.isrc,
        title: song.name,
        artists: song.artists.map((artist: any) => artist.name),
        year: song.album.release_date.split("-")[0],
        duration: song.duration_ms,
      };
      library.songs.push(s);
    });
  }

  return library;
};

const populateListenHistory = async (
  streamingHistoryJSON: any,
  api: SpotifyAPI
): Promise<ListenHistory> => {
  // Initialize the listen history
  let listenHistory: ListenHistory = [];

  // Populate the listen history
  for (const item of streamingHistoryJSON) {
    const searchResults = await api.searchForSong(
      item.trackName,
      item.artistName
    );

    // Take the first result with exact match
    for (const result of searchResults.tracks.items) {
      if (
        kebabCase(result.name) === kebabCase(item.trackName) &&
        result.artists
          .map((artist: any) => kebabCase(artist.name))
          .includes(kebabCase(item.artistName))
      ) {
        const historyItem: HistoryItem = {
          timeStamp: new Date(item.endTime),
          country: "US",
          durationPlayedMs: item.msPlayed,
          song: {
            __type: "Song",
            isrc: result.external_ids.isrc,
            title: item.trackName,
            artists: result.artists.map((artist: any) => artist.name),
            year: result.album.release_date.split("-")[0],
            duration: result.duration_ms,
          },
        };

        listenHistory.push(historyItem);
        break;
      }
    }
  }

  return listenHistory;
};

const populatePlaylists = async (
  playlistsJSON: any,
  api: SpotifyAPI
): Promise<Playlist[]> => {
  // Initialize the playlists
  let playlists: Playlist[] = [];

  for (const playlist of playlistsJSON.playlists) {
    let playlistItems: PlaylistItem[] = [];

    // Get song data using Spotify API
    const chunks = [];
    for (let i = 0; i < playlist.items.length; i += BATCH_SIZE) {
      const chunk = playlist.items.slice(i, i + BATCH_SIZE);
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      const spotifyURIs = chunk.map((item: any) => item.track.trackUri);
      const songs = await api.getSongsFromSpotifyURIs(spotifyURIs);
      songs.tracks.forEach((track: any) => {
        // Get the song data
        const song: Song = {
          __type: "Song",
          isrc: track.external_ids.isrc,
          title: track.name,
          artists: track.artists.map((artist: any) => artist.name),
          year: track.album.release_date.split("-")[0],
          duration: track.duration_ms,
        };

        // Get the added date
        let addedDate: string = "";
        for (const item of chunk) {
          if (item.track.trackUri === track.uri) {
            addedDate = item.addedDate;
            break;
          }
        }

        // Add the song to the playlist
        const playlistItem: PlaylistItem = {
          song: song,
          addedDate: new Date(addedDate),
        };
        playlistItems.push(playlistItem);
      });
    }

    const p: Playlist = {
      name: playlist.name,
      songs: playlistItems,
      description: playlist.description,
      lastModifiedDate: new Date(playlist.lastModifiedDate),
    };
    playlists.push(p);
  }

  return playlists;
};

export default ingest;
