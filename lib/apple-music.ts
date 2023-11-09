import fs from 'fs';
import jwt from 'jsonwebtoken';
import { listen, port } from '../web/express';

class AppleMusicAPIError extends Error {
  public readonly error;

  constructor(error: {
    status: number;
    statusText: string;
    body: string;
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
  private static instance: AppleMusicAPI | undefined = undefined;
  // noinspection SpellCheckingInspection
  private static readonly jwtOptions: jwt.SignOptions = {
    algorithm: 'ES256',
    keyid: 'CHBP53WURA',
    issuer: 'X44A27MMDB', // Team ID from Apple developer account
    expiresIn: '1h',
  }
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

  public static async __unsafe_getUserMusicToken(): Promise<string> {
    if (this.__unsafe_userMusicToken == undefined) {
      return new Promise((resolve) => {
        this.tokenRequestPromiseResolveQueue.push(resolve);
      });
    }

    return this.__unsafe_userMusicToken;
  }

  public static getInstance(): AppleMusicAPI {
    if (!this.instance) {
      throw new Error('AppleMusicAPI not initialized');
    }

    return this.instance;
  }

  public static async init(privateKeyFilePath: string) {
    if (this.instance) {
      throw new Error('AppleMusicAPI already initialized');
    }

    const unsafeInstance = new AppleMusicAPI({
      privateKeyFilePath,
      userMusicToken: 'fake-token',
    });

    await listen();
    console.log(`Please visit http://localhost:${port}/apple-music-authorization.html?devToken=${encodeURIComponent(unsafeInstance.getDevToken())}`);
    console.log('Waiting for authorization...');

    this.instance = new AppleMusicAPI({
      privateKeyFilePath,
      userMusicToken: await AppleMusicAPI.__unsafe_getUserMusicToken(),
    });
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
  public async getSong(trackIdentifier: string): Promise<AppleMusicGetCatalogSongResponse> {
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
      });
    }

    return await data.json() as AppleMusicGetCatalogSongResponse;
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
      });
    }

    return await data.json() as AppleMusicGetCatalogSongsByISRCResponse;
  }
}
