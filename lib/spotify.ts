import axios from 'axios';
import querystring from 'querystring';

export class SpotifyAPIError extends Error {
  public readonly error;

  constructor(error: { status: number; body: string }) {
    super();
    this.error = error;
  }
}

export class SpotifyAPI {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string;

  public constructor(
    args: Readonly<{
      clientId: string;
      clientSecret: string;
      accessToken: string;
    }>
  ) {
    this.clientId = args.clientId;
    this.clientSecret = args.clientSecret;
    this.accessToken = args.accessToken;
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  authorizeSpotify = async (): Promise<void> => {
    const authToken = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
      "utf-8"
    ).toString("base64");
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    this.accessToken = response.data.access_token;
    console.log(`Using Spotify access token: ${this.accessToken}`);
  };

  getSongFromSpotifyURI = async (spotifyURI: string): Promise<any> => {
    // Example: spotify:track:1GIPP103zfsythULEpsmdw
    // Get the URI
    const split = spotifyURI.split(":");
    if (split.length !== 3) {
      console.log(`Error in spotifyURI format: ${spotifyURI}`);
      return "";
    }
    const uri = split[2];

    // Get the song data using Spotify API
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${uri}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getSongsFromSpotifyURIs = async (spotifyURIs: string[]): Promise<any> => {
    // Limit: 50 songs

    // Get the URIs
    const uris = spotifyURIs.map((spotifyURI) => {
      const split = spotifyURI.split(":");
      if (split.length !== 3) {
        console.log(`Error in spotifyURI format: ${spotifyURI}`);
        return "";
      }
      return split[2];
    });

    // Get the song data using Spotify API
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks?ids=${uris.join(",")}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getAlbumFromSpotifyURI = async (spotifyURI: string): Promise<any> => {
    // Example: spotify:album:1GIPP103zfsythULEpsmdw
    // Get the URI
    const split = spotifyURI.split(":");
    if (split.length !== 3) {
      console.log(`Error in spotifyURI format: ${spotifyURI}`);
      return "";
    }
    const uri = split[2];

    // Get the album data using Spotify API
    const response = await axios.get(
      `https://api.spotify.com/v1/albums/${uri}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      console.log(response.data);
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getSongByIsrc = async (isrc: string): Promise<any> => {
    // Limit: 50 songs

    // Get the song data using Spotify API
    const queryFields = querystring.stringify({
      q: `isrc:${isrc}`,
      type: "track",
      limit: 5,
      market: "US",
    });

    const response = await axios.get(
      `https://api.spotify.com/v1/search?${queryFields}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    const tracks = response.data.tracks.items;
    for (const track of tracks) {
      if (track.external_ids.isrc === isrc) {
        return track;
      }
    }

    return tracks[0];
  };

  searchForSong = async (
    trackName: string,
    artistName: string
  ): Promise<any> => {
    // Limit: 50 songs

    // Get the song data using Spotify API
    const queryFields = querystring.stringify({
      q: `track:${trackName} artist:${artistName}`,
      type: "track",
      limit: 5,
      market: "US",
    });

    const response = await axios.get(
      `https://api.spotify.com/v1/search?${queryFields}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getUsersSavedTracks = async (url: string): Promise<any> => {
    // Limit: 50 songs

    // Set URL if not provided
    if (url == null) {
      url = `https://api.spotify.com/v1/me/tracks?limit=50`;
    }

    // Get the song data using Spotify API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getUserPlaylists = async (url: string): Promise<any> => {
    // Limit: 50 playlists

    // Set URL if not provided
    if (url == null) {
      url = `https://api.spotify.com/v1/me/playlists?limit=50`;
    }

    // Get the playlist data using Spotify API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getPlaylistSongs = async (playlistId: string, url: string): Promise<any> => {
    // Limit: 50 songs

    // Set URL if not provided
    if (url == null) {
      url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    }

    // Get the song data using Spotify API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getUserAlbums = async (url: string): Promise<any> => {
    // Limit: 50 albums

    // Set URL if not provided
    if (url == null) {
      url = `https://api.spotify.com/v1/me/albums?limit=50`;
    }

    // Get the album data using Spotify API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getUserFollowedArtists = async (url: string): Promise<any> => {
    // Limit: 50 artists

    // Set URL if not provided
    if (url == null) {
      url = `https://api.spotify.com/v1/me/following?type=artist&limit=50`;
    }

    // Get the artist data using Spotify API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  getUserProfile = async (): Promise<any> => {
    // Get the profile data using Spotify API
    const response = await axios.get(`https://api.spotify.com/v1/me`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
    return response.data;
  };

  createPlaylist = async (
    userId: string,
    playlist: SpotifyLibraryPlaylistCreationRequest
  ): Promise<any> => {
    const response = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      playlist,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 201) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  addSongsToPlaylist = async (
    playlistId: string,
    songUris: string[]
  ): Promise<any> => {
    // Limit: 100 songs

    // Add the songs to the playlist
    const response = await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: songUris,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 201) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    return response.data;
  };

  addSongsToLibrary = async (songUris: string[]): Promise<any> => {
    // Limit: 50 songs

    // Add the songs to the library
    const response = await axios.put(
      `https://api.spotify.com/v1/me/tracks`,
      {
        ids: songUris,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
  };

  addAlbumsToLibrary = async (albumUris: string[]): Promise<any> => {
    // Limit: 20 albums

    // Add the albums to the library
    const response = await axios.put(
      `https://api.spotify.com/v1/me/albums`,
      {
        ids: albumUris,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
  };

  followArtists = async (artistUris: string[]): Promise<any> => {
    // Limit: 50 artists

    // Follow the artists
    const response = await axios.put(
      `https://api.spotify.com/v1/me/following?type=artist`,
      {
        ids: artistUris,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 204) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
  };

  getAlbumByUPC = async (upc: string): Promise<any> => {
    // Get the album data using Spotify API
    const queryFields = querystring.stringify({
      q: `upc:${upc}`,
      type: "album",
      limit: 1,
      market: "US",
    });

    const response = await axios.get(
      `https://api.spotify.com/v1/search?${queryFields}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
    return response.data.albums.items[0];
  };

  getArtistByName = async (artistName: string): Promise<any> => {
    // Get the artist data using Spotify API
    const queryFields = querystring.stringify({
      q: `artist:${artistName}`,
      type: "artist",
      limit: 1,
      market: "US",
    });

    const response = await axios.get(
      `https://api.spotify.com/v1/search?${queryFields}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }
    return response.data.artists.items[0];
  };
}
