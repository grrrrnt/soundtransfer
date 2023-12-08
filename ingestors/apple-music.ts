import '../types';

import _ from 'lodash';
import fs, { promises as fsAsync } from 'fs';
import assert from 'assert';
import path from 'path';
import csvParse from 'csv-parse';
import { getLibrary, mergeWithLibrary } from '../lib/library';
import { AppleMusicAPI } from '../lib/apple-music';
import { filterFalsy } from '../lib/utils';
import { storeAlbums, storeArtists, storeListeningHistory, storePlaylists, storeSongs } from '../lib/mongo';
import { DeepWritable } from 'ts-essentials';

const appleMusicActivityFolderName = 'Apple Music Activity';
const playHistoryFileName = 'Apple Music - Play History Daily Tracks.csv';
const librarySongsFileName = 'Apple Music Library Tracks.json';
const favouritesFileName = 'Apple Music - Favorites.csv';
const playlistsFileName = 'Apple Music Library Playlists.json';
const libraryActivityFileName = 'Apple Music Library Activity.json';

const getSong = async (trackIdentifier: string | number): Promise<Song> => {
  const api = AppleMusicAPI.getInstance();
  const song = await api.getSong(trackIdentifier.toString());
  const releaseDate = new Date(song.attributes.releaseDate);

  return {
    __type: 'Song',
    isrc: song.attributes.isrc,
    title: song.attributes.name,
    artists: [song.attributes.artistName],
    year: releaseDate.getFullYear(),
    duration: song.attributes.durationInMillis,
  };
};

const parsePlayHistory = async (dataRoot: string) => {
  const playHistoryPath = path.join(dataRoot, playHistoryFileName);
  const parser = fs.createReadStream(playHistoryPath).pipe(csvParse.parse({columns: true}));
  const history: ListenHistory = [];

  let idx = 0;
  for await (const item of parser) {
    // FIXME remove this once we have caching of data returned by APIs
    if (idx == 20) {
      break;
    }

    idx += 1;
    assert(typeof item === 'object');
    const record = item as AppleMusicExportHistoryItem;

    const trackIdentifier = record['Track Identifier'];
    const datePlayed = record['Date Played'];
    const song = getSong(trackIdentifier);
    const parseableDate = `${datePlayed.substring(0, 4)}-${datePlayed.substring(4, 6)}-${datePlayed.substring(6)}T${record.Hours}:00:00`;

    if (song) {
      history.push({
        country: record['Country'],
        mediaType: record['Media type'],
        endReason: record['End Reason Type'],
        sourceType: record['Source Type'],
        playCount: Number(record['Play Count']),
        skipCount: Number(record['Skip Count']),
        timeStamp: new Date(parseableDate),
        description: record['Track Description'],
        trackReference: record['Track Reference'] === 'N/A' ? undefined : record['Track Reference'],
        durationPlayedMs: Number(record['Play Duration Milliseconds']),
        ignoreForRecommendations: record['Ignore For Recommendations'] === 'true',
        song: await song,
      });
    }
  }

  await storeListeningHistory(history);
};

const parseLibrarySongs = async (dataRoot: string, identifierMap: Map<number, number>) => {
  const filePath = path.join(dataRoot, librarySongsFileName)
  const buffer = await fsAsync.readFile(filePath);
  const data = JSON.parse(buffer.toString()) as AppleMusicLibraryTracks;
  const songs = await Promise.all(filterFalsy(data
    .map(item => item['Track Identifier'])
    .map(libraryIdentifier => identifierMap.get(libraryIdentifier)))
    .map(getSong));
  mergeWithLibrary({songs});
};

const parseFavourites = async (dataRoot: string) => {
  const filePath = path.join(dataRoot, favouritesFileName);
  const parser = fs.createReadStream(filePath).pipe(csvParse.parse({columns: true}));
  const favouriteSongs: Promise<Song>[] | Artist = [];
  const favouriteArtists: Artist[] = [];

  for await (const record of parser) {
    const item = record as AppleMusicFavouritesItem;
    switch (item['Favorite Type']) {
      case 'SONG':
        favouriteSongs.push(getSong(item['Item Reference']));
        break;
      case 'ARTIST':
        favouriteArtists.push({
          name: item['Item Description'],
        });
        break;
      default:
        throw new Error(`Unrecognized favouriteType ${item['Favorite Type']}`);
    }
  }

  mergeWithLibrary({favourites: [...favouriteArtists, ...await Promise.all(favouriteSongs)]});
};

const parsePlaylists = async (dataRoot: string, identifierMap: Map<number, number>) => {
  const filePath = path.join(dataRoot, playlistsFileName);
  const data = JSON.parse(await fsAsync.readFile(filePath, {encoding: 'utf-8'})) as AppleMusicPlaylistExport;
  const playlists: Playlist[] = [];

  let index = -1;
  for (const item of data) {
    index += 1
    if (item['Container Type'] !== 'Playlist') {
      continue;
    }

    const pl = {
      name: item.Title ?? `Playlist #${index + 1}`,
      description: item.Description,
      lastModifiedDate: new Date(item['Playlist Items Modified Date']),
      songs: (await Promise.all(filterFalsy(item['Playlist Item Identifiers']
        .map(id => identifierMap.get(id)))
        .map(getSong)))
        .map(song => ({
          song: song,
        })),
    };

    playlists.push(pl);
  }

  mergeWithLibrary({
    playlists,
  });
};

const parsePlaylistItemIdentifiers = async (dataRoot: string): Promise<Map<number, number>> => {
  // maps a playlist item identifier to its corresponding Apple Music Track Identifier
  const identifierMap = new Map<number, number>();
  const filePath = path.join(dataRoot, libraryActivityFileName);
  const data = JSON.parse(await fsAsync.readFile(filePath, {encoding: 'utf8'})) as AppleMusicLibraryActivity;

  for (const item of data) {
    if (item['Transaction Type'] !== 'addItems' || !item.hasOwnProperty('Tracks')) {
      continue;
    }

    for (const track of item.Tracks) {
      if (track.hasOwnProperty('Track Identifier') && track.hasOwnProperty('Apple Music Track Identifier')) {
        const playlistItemIdentifier = track['Track Identifier'];
        const musicTrackIdentifier = track['Apple Music Track Identifier'];

        assert((typeof playlistItemIdentifier === 'number') && (typeof musicTrackIdentifier === 'number'));
        identifierMap.set(playlistItemIdentifier, musicTrackIdentifier);
      }
    }
  }

  return identifierMap;
};

export const ingestPlaylists = async () => {
  const playlists = getLibrary().playlists;
  await storePlaylists(playlists as DeepWritable<typeof playlists>);
};

export const ingestSongs = async () => {
  const songs = getLibrary().songs;
  await storeSongs(songs as DeepWritable<typeof songs>);
};

export const ingestAlbums = async () => {
  const albums = getLibrary().albums;
  await storeAlbums(albums as DeepWritable<typeof albums>);
};

export const ingestArtists = async () => {
  const artists = getLibrary().artists;
  await storeArtists(artists as DeepWritable<typeof artists>);
};

export const parseAndStoreInLibrary = async (srcPath: string, privKeyPath: string) => {
  await AppleMusicAPI.init(privKeyPath);

  const files = fs.readdirSync(srcPath).map(x => x);
  if (files.indexOf(appleMusicActivityFolderName) < 0) {
    console.error('Apple Music Activity folder not found in export');
    return;
  }

  const musicDataRoot = path.join(srcPath, appleMusicActivityFolderName);
  const identifierMap = await parsePlaylistItemIdentifiers(musicDataRoot);

  await Promise.all([
    ...[
      _.curryRight(parseLibrarySongs)(identifierMap),
      _.curryRight(parsePlaylists)(identifierMap),
      parsePlayHistory,
      parseFavourites,
    ].map(x => x(musicDataRoot)),
  ]);
};

const ingest = async (args: string[]): Promise<void> => {
  await parseAndStoreInLibrary(args[0], args[1]);

  await Promise.all([
    ingestAlbums(),
    ingestArtists(),
    ingestSongs(),
    ingestPlaylists(),
  ]);

  console.log('Ingestion complete');
};

export default ingest;
