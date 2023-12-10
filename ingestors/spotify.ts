import "../types";
import axios from "axios";
import fs, { promises as fsAsync } from "fs";
import { SpotifyAPI } from "../lib/spotify";
import { kebabCase } from "lodash";
import querystring from "querystring";
import { getLibrary, mergeWithLibrary } from "../lib/library";
import {
  storeListeningHistory,
  storePlaylists,
  storeSongs,
  storeAlbums,
  storeArtists,
} from "../lib/mongo";

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
  await SpotifyAPI.initWithAuthorizationCode(clientId, clientSecret);
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

  // Initialize the library
  let library: Library = {
    playlists: [],
    songs: [],
    artists: [],
    albums: [],
    favourites: [],
  };

  // Populate the songs
  const songs: Song[] = await populateSongs(libraryJSON, api);
  library.songs = songs;

  // Populate the albums
  const albums: Album[] = await populateAlbums(libraryJSON, api);
  library.albums = albums;

  // Populate the artists
  const artists: Artist[] = await populateArtists(libraryJSON, api);
  library.artists = artists;

  // Populate the playlists
  const playlists: Playlist[] = await populatePlaylists(playlistsJSON, api);
  library.playlists = playlists;

  // Populate the listening history
  const listenHistory: ListenHistory = await populateListenHistory(
    streamingHistoryJSON,
    api
  );

  console.log("Ingested Spotify data export:");
  console.log("  - Songs: ", library.songs.length);
  console.log("  - Artists: ", library.artists.length);
  console.log("  - Albums: ", library.albums.length);
  console.log("  - Playlists: ", library.playlists.length);
  console.log("  - Listen history: ", listenHistory.length);

  console.log("Storing library and listening history into MongoDB database...");

  await storeSongs(library.songs);
  await storeArtists(library.artists);
  await storeAlbums(library.albums);
  await storePlaylists(library.playlists);
  await storeListeningHistory(listenHistory);

  console.log("Completed storing into MongoDB database.");
};

const populateSongs = async (
  libraryJSON: any,
  api: SpotifyAPI
): Promise<Song[]> => {
  // Initialize the songs
  let songs: Song[] = [];

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
        album: song.album.name,
      };
      songs.push(s);
    });
  }

  return songs;
};

const populateAlbums = async (
  libraryJSON: any,
  api: SpotifyAPI
): Promise<Album[]> => {
  // Initialize the albums
  let albums: Album[] = [];

  for (const album of libraryJSON.albums) {
    // Get the album data using Spotify API
    const albumData = await api.getAlbumFromSpotifyURI(album.uri);

    // Get the album data
    const a: Album = {
      title: albumData.name,
      artists: albumData.artists.map((artist: any) => artist.name),
      upc: albumData.external_ids.upc,
    };
    albums.push(a);
  }

  return albums;
};

const populateArtists = async (
  libraryJSON: any,
  api: SpotifyAPI
): Promise<Artist[]> => {
  // Initialize the artists
  let artists: Artist[] = [];

  for (const artist of libraryJSON.artists) {
    const a: Artist = {
      name: artist.name,
    };
    artists.push(a);
  }

  return artists;
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
            album: result.album.name,
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
          album: track.album.name,
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
