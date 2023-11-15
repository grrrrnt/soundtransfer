import _ from 'lodash';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { port } from '../web/express';
import assert from 'assert';

export class AppleMusicAPIError extends Error {
  public readonly error;

  constructor(error: {
    status: number;
    statusText: string;
    body: string;
    headers: Headers;
    extraDetails?: object;
  }) {
    super();
    this.error = error;
  }
}

export class AppleMusicAPI {
  // We need these unsafe functions and tokens because we don't want the
  // instance to be accessible before it is set up because and I'm too lazy to
  // create a new class. Init should be wrapped in a mutex but JavaScript!
  // This is all just spaghetti code, but it works and the interfaces to use
  // the API are super clean.

  public static init = _.once(async (privateKeyFilePath: string) => {
    if (this.instance) {
      throw new Error('AppleMusicAPI already initialized');
    }

    const unsafeInstance = new AppleMusicAPI({
      privateKeyFilePath,
      userMusicToken: 'fake-token',
    });

    console.log(`Please visit http://localhost:${port}/apple-music-authorization.html?devToken=${encodeURIComponent(unsafeInstance.getDevToken())}`);
    console.log('Waiting for authorization...');

    this.instance = new AppleMusicAPI({
      privateKeyFilePath,
      userMusicToken: await AppleMusicAPI.__unsafe_getUserMusicToken(),
    });
  });

  private static instance: AppleMusicAPI | undefined = undefined;
  // noinspection SpellCheckingInspection
  private static readonly jwtOptions: jwt.SignOptions = {
    algorithm: 'ES256',
    keyid: 'CHBP53WURA',
    issuer: 'X44A27MMDB', // Team ID from Apple developer account
    expiresIn: '1h',
  };
  private static __unsafe_userMusicToken: string;
  private static tokenRequestPromiseResolveQueue: ((token: string) => void)[] = [];
  private readonly devToken: string;
  private readonly privateKey: Buffer;
  private readonly storefront = 'US';
  private readonly userMusicToken: string;

  private constructor(args: Readonly<{
    userMusicToken: string;
    privateKeyFilePath: string;
  }>) {
    this.privateKey = fs.readFileSync(args.privateKeyFilePath);
    this.userMusicToken = args.userMusicToken;
    this.devToken = jwt.sign({}, this.privateKey, AppleMusicAPI.jwtOptions);
  }

  public static __unsafe_setUserMusicToken(token: string) {
    this.__unsafe_userMusicToken = token;
    while (this.tokenRequestPromiseResolveQueue.length) {
      this.tokenRequestPromiseResolveQueue.pop()!(token);
    }
  }

  public static getInstance(): AppleMusicAPI {
    if (!this.instance) {
      throw new Error('AppleMusicAPI not initialized');
    }

    return this.instance;
  }

  private static async __unsafe_getUserMusicToken(): Promise<string> {
    if (this.__unsafe_userMusicToken == undefined) {
      return new Promise((resolve) => {
        this.tokenRequestPromiseResolveQueue.push(resolve);
      });
    }

    return this.__unsafe_userMusicToken;
  }

  public getUserMusicToken(): string {
    return this.userMusicToken;
  }

  public getDevToken(): string {
    return this.devToken;
  }

  /**
   * Fetch a song by using its identifier.
   *
   * Wrapper for https://developer.apple.com/documentation/applemusicapi/get_a_catalog_song
   * @param trackIdentifier Apple Music internal identifier.
   */
  public async getSong(trackIdentifier: string): Promise<AppleMusicSong> {
    const data = await fetch(`https://api.music.apple.com/v1/catalog/${this.storefront}/songs/${encodeURIComponent(trackIdentifier)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getDevToken()}`,
      },
    });

    if (!data.ok) {
      throw new AppleMusicAPIError({
        status: data.status,
        statusText: data.statusText,
        body: await data.text(),
        headers: data.headers,
        extraDetails: {
          trackIdentifier,
        },
      });
    }

    const responseBody = await data.json() as AppleMusicGetCatalogSongResponse;
    assert(responseBody.data.length === 1);
    return responseBody.data[0];
  }

  public async getSongByIsrc(isrc: string): Promise<AppleMusicGetCatalogSongsByISRCResponse> {
    const url = new URL(`https://api.music.apple.com/v1/catalog/${this.storefront}/songs`);
    url.searchParams.set('filter[isrc]', isrc);

    const data = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.devToken}`,
      },
    });

    if (!data.ok) {
      throw new AppleMusicAPIError({
        status: data.status,
        statusText: data.statusText,
        body: await data.text(),
        headers: data.headers,
      });
    }

    return await data.json() as AppleMusicGetCatalogSongsByISRCResponse;
  }

  public async getPlaylistTracks(playlistId: string) {
    const url = new URL(`https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`);
    url.searchParams.set('extend', 'isrc');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
        'Music-User-Token': this.getUserMusicToken(),
      },
    });

    if (!response.ok) {
      throw new AppleMusicAPIError({
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers,
      });
    }

    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));
  }

  public async getUserPlaylists() {
    let nextURL: URL | undefined = new URL('https://api.music.apple.com/v1/me/library/playlists');
    const playlists: AppleMusicLibraryPlaylists[] = [];
    let totalPlaylistCount: number | undefined = undefined;

    do {
      const response = await fetch(nextURL, {
        headers: {
          Authorization: `Bearer ${this.getDevToken()}`,
          'Music-User-Token': this.getUserMusicToken(),
        },
      });

      if (!response.ok) {
        throw new AppleMusicAPIError({
          status: response.status,
          statusText: response.statusText,
          body: await response.text(),
          headers: response.headers,
        });
      }

      const body = await response.json() as AppleMusicLibraryPlaylistsResponse;
      playlists.push(...body.data);
      totalPlaylistCount = body.meta?.total;

      if (!body.next) {
        break;
      }

      nextURL = new URL(body.next, 'https://api.music.apple.com');
    } while (true);

    assert(playlists.length === (totalPlaylistCount ?? 0));
    console.log(JSON.stringify(playlists, null, 2));

    // TODO const playlistsWithSongs =
  }
}
