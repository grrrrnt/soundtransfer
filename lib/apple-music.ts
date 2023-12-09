import _ from 'lodash';
import * as mongo from './mongo';
import { storeAppleMusicLibrarySongs, storeAppleMusicSongs } from './mongo';
import assert from 'assert';
import { filterFalsy } from './utils';

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
  private static readonly multipleCatalogSongRequestMaxFetchLimit = 300;
  private readonly devToken: string;
  private readonly storefront = 'US';
  private readonly userMusicToken: string;

  public constructor(args: Readonly<{
    userMusicToken: string;
    devToken: string;
  }>) {
    this.userMusicToken = args.userMusicToken;
    this.devToken = args.devToken;
  }

  private static async throwErrorIfResponseNotOkay(res: Response, extraDetails?: object) {
    if (!res.ok) {
      throw new AppleMusicAPIError({
        status: res.status,
        statusText: res.statusText,
        body: await res.text(),
        headers: res.headers,
        extraDetails,
      });
    }
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
  public async getSong(trackIdentifier: string): Promise<AppleMusicCatalogSong> {
    const dbSong = await mongo.getAppleMusicSongFromIdentifier(trackIdentifier);
    if (dbSong !== null) {
      return dbSong;
    }

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
    await mongo.storeAppleMusicSongs(responseBody.data);
    return responseBody.data[0];
  }

  public async getSongByIsrc(isrc: string): Promise<AppleMusicCatalogSong | undefined> {
    const dbSong = await mongo.getAppleMusicSongFromIsrc(isrc);
    if (dbSong !== null) {
      return dbSong;
    }

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

    const body = await data.json() as AppleMusicGetCatalogSongsByISRCResponse;
    const song = body.data.pop();
    await storeAppleMusicSongs(filterFalsy([song]));
    return song;
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

  public async getMultipleSongs(trackIdentifiers: string[]) {
    const baseUrl = new URL(`https://api.music.apple.com/v1/catalog/${this.storefront}/songs`);
    const ret: AppleMusicCatalogSong[] = [];

    for (const batch of _.chunk(trackIdentifiers, AppleMusicAPI.multipleCatalogSongRequestMaxFetchLimit)) {
      const requestUrl = new URL(baseUrl);
      requestUrl.searchParams.set('ids', batch.join(','));

      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${this.getDevToken()}`,
        },
      });

      await AppleMusicAPI.throwErrorIfResponseNotOkay(response);
      const body = await response.json() as AppleMusicGetCatalogSongResponse;
      ret.push(...body.data);
    }

    await mongo.storeAppleMusicSongs(ret);
    return ret;
  }

  public async getUserPlaylists(): Promise<AppleMusicLibraryPlaylists[]> {
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
    return playlists;
  }

  /**
   * Gets information about the Catalog Artist identified
   * @param artistIdentifier catalog artist identifier
   */
  public async getArtist(artistIdentifier: string): Promise<AppleMusicArtists> {
    const url = new URL(`https://api.music.apple.com/v1/catalog/${this.storefront}/artists/${encodeURIComponent(artistIdentifier)}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
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

    const data = (await response.json()) as AppleMusicArtistsResponse;
    assert(data.data.length === 1);
    return data.data[0];
  }

  public async getLibrarySong(librarySongIdentifier: string): Promise<AppleMusicLibrarySongs> {
    const dbSong = await mongo.getAppleMusicLibrarySongFromIdentifier(librarySongIdentifier);
    if (dbSong !== null) {
      return dbSong;
    }

    const url = new URL(`https://api.music.apple.com/v1/me/library/songs/${encodeURIComponent(librarySongIdentifier)}`);
    url.searchParams.set('include', 'catalog');

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

    const body = await response.json() as AppleMusicLibrarySongsResponse;
    await storeAppleMusicLibrarySongs(filterFalsy(body.data));
    return body.data.pop()!;
  }

  public async getLibraryPlaylist(libraryPlaylistIdentifier: string) {
    const url = new URL(`https://api.music.apple.com/v1/me/library/playlists/${encodeURIComponent(libraryPlaylistIdentifier)}`);
    url.searchParams.set('include', 'tracks');

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

    const body = await response.json() as AppleMusicLibraryPlaylistsResponse;
    return body.data.pop()!;
  }

  public async createPlaylist(playlistCreationRequest: AppleMusicLibraryPlaylistCreationRequest): Promise<AppleMusicLibraryPlaylists> {
    const url = new URL(`https://api.music.apple.com/v1/me/library/playlists`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
        'Music-User-Token': this.getUserMusicToken(),
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(playlistCreationRequest),
    });

    if (!response.ok || response.status !== 201) {
      throw new AppleMusicAPIError({
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers,
      });
    }

    const data = await response.json() as AppleMusicLibraryPlaylistsResponse;
    assert(data.data.length === 1);
    return data.data.pop()!;
  }

  public async getRootLibraryPlaylistsFolder(): Promise<AppleMusicLibraryPlaylistFolders[]> {
    const url = new URL(`https://api.music.apple.com/v1/me/library/playlist-folders`);
    url.searchParams.set('filter[identity]', 'playlistsroot');

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

    const body = await response.json() as AppleMusicLibraryPlaylistFoldersResponse;
    return body.data;
  }

  async getUserAlbums(): Promise<AppleMusicLibraryAlbums[]> {
    let nextURL: URL | undefined = new URL('https://api.music.apple.com/v1/me/library/albums');
    const albums: AppleMusicLibraryAlbums[] = [];
    let totalAlbumCount: number | undefined = undefined;

    do {
      nextURL.searchParams.set('include', 'catalog');
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

      const body = await response.json() as AppleMusicLibraryAlbumsResponse;
      albums.push(...body.data);
      totalAlbumCount = body.meta?.total;

      if (!body.next) {
        break;
      }

      nextURL = new URL(body.next, 'https://api.music.apple.com');
    } while (true);

    assert(albums.length === (totalAlbumCount ?? 0));
    return albums;
  }

  async addResourceToLibrary(resources: Partial<Record<AppleMusicResourceTypes, string[]>>): Promise<void> {
    const url = new URL('https://api.music.apple.com/v1/me/library');

    for (const key of Object.keys(resources) as (keyof typeof resources)[]) {
      url.searchParams.set(`ids[${key}]`, (resources[key] ?? []).join(','))
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
        'Music-User-Token': this.getUserMusicToken(),
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    if (!response.ok || response.status !== 202) {
      throw new AppleMusicAPIError({
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers,
      });
    }
  }

  async getAlbumByUPC(upc: UPC): Promise<AppleMusicAlbums | undefined> {
    const url = new URL(`https://api.music.apple.com/v1/catalog/${this.storefront}/albums`);
    url.searchParams.set('filter[upc]', upc);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
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

    const body = await response.json() as AppleMusicAlbumsResponse;
    return body.data.pop();
  }

  async getAllLibrarySongs(): Promise<AppleMusicLibrarySongs[]> {
    let nextURL: URL | undefined = new URL('https://api.music.apple.com/v1/me/library/songs');
    const songs: AppleMusicLibrarySongs[] = [];
    let totalSongCount: number | undefined = undefined;

    do {
      nextURL.searchParams.set('include', 'catalog');
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

      const body = await response.json() as AppleMusicLibrarySongsResponse;
      songs.push(...body.data);
      totalSongCount = body.meta?.total;

      if (!body.next) {
        break;
      }

      nextURL = new URL(body.next, 'https://api.music.apple.com');
    } while (true);

    assert(songs.length === (totalSongCount ?? 0));
    return songs;
  }

  async getAllLibraryArtists(): Promise<AppleMusicLibraryArtists[]> {
    let nextURL: URL | undefined = new URL('https://api.music.apple.com/v1/me/library/artists');
    const artists: AppleMusicLibraryArtists[] = [];
    let totalArtistCount: number | undefined = undefined;

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

      const body = await response.json() as AppleMusicLibraryArtistsResponse;
      artists.push(...body.data);
      totalArtistCount = body.meta?.total;

      if (!body.next) {
        break;
      }

      nextURL = new URL(body.next, 'https://api.music.apple.com');
    } while (true);

    assert(artists.length === (totalArtistCount ?? 0));
    return artists;
  }


  async searchForCatalogResources(term: string, resourceTypes: AppleMusicResourceTypes[]): Promise<AppleMusicSearchResponse> {
    let url: URL | undefined = new URL('https://api.music.apple.com/v1/catalog/us/search');
    url.searchParams.set('types', resourceTypes.join(','));
    url.searchParams.set('term', term);
    url.searchParams.set('limit', '10');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getDevToken()}`,
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

    return await response.json() as AppleMusicSearchResponse;
  }
}

