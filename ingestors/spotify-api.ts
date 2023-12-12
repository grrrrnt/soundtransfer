import "../types";
import axios from "axios";
import fs, { promises as fsAsync } from "fs";
import { SpotifyAPI } from "../lib/spotify";
import { has, kebabCase } from "lodash";
import querystring from "querystring";
import { getLibrary, mergeWithLibrary } from "../lib/library";
import {
  storePlaylists,
  storeSongs,
  storeAlbums,
  storeArtists,
} from "../lib/mongo";

const BATCH_SIZE = 50;

export const ingestSongs = async (api: SpotifyAPI) => {
  await storeSongs(await fetchSongs(api));
};

export const ingestPlaylists = async (api: SpotifyAPI) => {
  await storePlaylists(await fetchPlaylists(api));
};

export const ingestAlbums = async (api: SpotifyAPI) => {
  await storeAlbums(await fetchAlbums(api));
};

export const ingestArtists = async (api: SpotifyAPI) => {
  await storeArtists(await fetchArtists(api));
};

const fetchSongs = async (api: SpotifyAPI): Promise<Song[]> => {
  let songs: Song[] = [];

  // Call the Spotify API until all songs are populated
  let nextUrl;
  let apiCallCount = 0; // Used only to prevent hitting API rate limit
  do {
    const songsFromAPI = await api.getUsersSavedTracks(nextUrl);
    songsFromAPI.items.forEach((song: any) => {
      const s: Song = {
        __type: "Song",
        isrc: song.track.external_ids.isrc,
        title: song.track.name,
        artists: song.track.artists.map((artist: any) => artist.name),
        year: song.track.album.release_date.split("-")[0],
        duration: song.track.duration_ms,
        album: song.track.album.name,
      };
      songs.push(s);
    });
    nextUrl = songsFromAPI.next;
    if (apiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
  } while (nextUrl !== null);

  return songs;
};

const fetchPlaylists = async (api: SpotifyAPI): Promise<Playlist[]> => {
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
              album: item.track.album.name,
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
        public: playlist.public,
        collaborative: playlist.collaborative,
        owner: playlist.owner.display_name,
      };
      playlists.push(p);
    }
    playlistsNextUrl = userPlaylists.next;
    if (playlistsApiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
  } while (playlistsNextUrl !== null);

  return playlists;
};

const fetchAlbums = async (api: SpotifyAPI): Promise<Album[]> => {
  // Initialize the albums
  let albums: Album[] = [];

  // Call the Spotify API until all albums are populated
  let albumsNextUrl;
  let albumsApiCallCount = 0; // Used only to prevent hitting API rate limit
  do {
    const userAlbums = await api.getUserAlbums(albumsNextUrl);
    for (const album of userAlbums.items) {
      const a: Album = {
        upc: album.album.external_ids.upc,
        title: album.album.name,
        artists: album.album.artists.map((artist: any) => artist.name),
      };
      albums.push(a);
    }
    albumsNextUrl = userAlbums.next;
    if (albumsApiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
  } while (albumsNextUrl !== null);

  return albums;
};

const fetchArtists = async (api: SpotifyAPI): Promise<Artist[]> => {
  // Initialize the artists
  let artists: Artist[] = [];

  // Call the Spotify API until all artists are populated
  let artistsNextUrl;
  let artistsApiCallCount = 0; // Used only to prevent hitting API rate limit
  do {
    const userFollowedArtists = await api.getUserFollowedArtists(
      artistsNextUrl
    );
    for (const artist of userFollowedArtists.artists.items) {
      const a: Artist = {
        name: artist.name,
      };
      artists.push(a);
    }
    artistsNextUrl = userFollowedArtists.artists.next;
    if (artistsApiCallCount++ > 1) break; // Used only to prevent hitting API rate limit
  } while (artistsNextUrl !== null);

  return artists;
};
