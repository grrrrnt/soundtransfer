import _ from "lodash";
import fs from "fs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { listen, port } from "../web/express";

const querystring = require("node:querystring");

export class SpotifyAPIError extends Error {
  public readonly error;

  constructor(error: { status: number; body: string }) {
    super();
    this.error = error;
  }
}

export class SpotifyAPI {
  private static instance: SpotifyAPI | undefined = undefined;
  private static __unsafe_accessToken: string;
  private static tokenRequestPromiseResolveQueue: ((token: string) => void)[] =
    [];
  private readonly storefront = "US";
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string = "";

  private constructor(
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

  public static getInstance(): SpotifyAPI {
    if (!this.instance) {
      throw new Error("SpotifyAPI not initialized");
    }

    console.log("Dev token: " + this.instance.getAccessToken());

    return this.instance;
  }

  public static __unsafe_setAccessToken(token: string) {
    this.__unsafe_accessToken = token;
    while (this.tokenRequestPromiseResolveQueue.length) {
      this.tokenRequestPromiseResolveQueue.pop()!(token);
    }
  }

  public static async __unsafe_getAccessToken(): Promise<string> {
    if (this.__unsafe_accessToken == undefined) {
      return new Promise((resolve) => {
        this.tokenRequestPromiseResolveQueue.push(resolve);
      });
    }

    return this.__unsafe_accessToken;
  }

  public static initWithAuthorizationCode = _.once(
    async (clientId?: string, clientSecret?: string) => {
      if (this.instance) {
        throw new Error("SpotifyAPI already initialized");
      }

      await listen();
      console.log(
        `Please visit http://localhost:${port}/spotify-authorization.html?clientId=${process.env.SPOTIFY_CLIENT_ID} to authorize Spotify.`
      );
      console.log("Waiting for authorization...");

      const accessToken = await SpotifyAPI.__unsafe_getAccessToken();
      console.log(`Using Spotify access token: ${accessToken}`);

      this.instance = new SpotifyAPI({
        clientId: clientId || process.env.SPOTIFY_CLIENT_ID || "",
        clientSecret: clientSecret || process.env.SPOTIFY_CLIENT_SECRET || "",
        accessToken: accessToken,
      });
    }
  );

  public static initWithClientCredentials = _.once(
    async (clientId?: string, clientSecret?: string) => {
      if (this.instance) {
        throw new Error("SpotifyAPI already initialized");
      }

      this.instance = new SpotifyAPI({
        clientId: clientId || process.env.SPOTIFY_CLIENT_ID || "",
        clientSecret: clientSecret || process.env.SPOTIFY_CLIENT_SECRET || "",
        accessToken: "fake-access-token",
      });
    }
  );

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
}
