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

const libraryFileName = "YourLibrary.json";
const playlistsFileName = "Playlist1.json";
const streamingHistoryFilePrefix = "StreamingHistory";

export const ingestSongs = async (api: SpotifyAPI, dataRoot: string) => {
  await storeSongs(await fetchSongs(api, dataRoot));
};

export const ingestAlbums = async (api: SpotifyAPI, dataRoot: string) => {
  await storeAlbums(await fetchAlbums(api, dataRoot));
};

export const ingestArtists = async (api: SpotifyAPI, dataRoot: string) => {
  await storeArtists(await fetchArtists(api, dataRoot));
};

export const ingestPlaylists = async (api: SpotifyAPI, dataRoot: string) => {
  await storePlaylists(await fetchPlaylists(api, dataRoot));
};

export const ingestListeningHistory = async (
  api: SpotifyAPI,
  dataRoot: string
) => {
  await storeListeningHistory(await fetchListeningHistory(api, dataRoot));
};

const fetchSongs = async (
  api: SpotifyAPI,
  dataRoot: string
): Promise<Song[]> => {
  const libraryJSON = JSON.parse(
    fs.readFileSync(`${dataRoot}/${libraryFileName}`, "utf8")
  );

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

const fetchAlbums = async (
  api: SpotifyAPI,
  dataRoot: string
): Promise<Album[]> => {
  const libraryJSON = JSON.parse(
    fs.readFileSync(`${dataRoot}/${libraryFileName}`, "utf8")
  );

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

const fetchArtists = async (
  api: SpotifyAPI,
  dataRoot: string
): Promise<Artist[]> => {
  const libraryJSON = JSON.parse(
    fs.readFileSync(`${dataRoot}/${libraryFileName}`, "utf8")
  );

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

const fetchListeningHistory = async (
  api: SpotifyAPI,
  dataRoot: string
): Promise<ListenHistory> => {
  // Find all the streaming history files
  const streamingHistoryFiles = fs.readdirSync(dataRoot).filter((file) => {
    return file.startsWith(streamingHistoryFilePrefix);
  });

  // Merge the streaming history files
  let streamingHistoryJSON: any[] = [];
  for (const file of streamingHistoryFiles) {
    const json = JSON.parse(fs.readFileSync(`${dataRoot}/${file}`, "utf8"));
    streamingHistoryJSON = streamingHistoryJSON.concat(json);
  }

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

const fetchPlaylists = async (
  api: SpotifyAPI,
  dataRoot: string
): Promise<Playlist[]> => {
  const playlistsJSON = JSON.parse(
    fs.readFileSync(`${dataRoot}/${playlistsFileName}`, "utf8")
  );

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
