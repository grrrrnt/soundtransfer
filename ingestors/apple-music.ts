import '../types';

import fs, { promises as fsAsync } from 'fs';
import assert from 'assert';
import * as path from 'path';
import * as csvParse from 'csv-parse';
import { getLibrary, mergeWithLibrary } from '../lib/library';
import { AppleMusicAPI } from '../lib/apple-music';
import { filterFalsy } from '../lib/utils';

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
}

const parsePlayHistory = async (dataRoot: string) => {
  const playHistoryPath = path.join(dataRoot, playHistoryFileName);
  const parser = fs.createReadStream(playHistoryPath).pipe(csvParse.parse());
  const history: ListenHistory = [];

  let idx = 0;
  for await (const record of parser) {
    // FIXME remove this once we have caching of data returned by APIs
    if (idx == 5) {
      break;
    }

    assert(Array.isArray(record));
    const [
      country,
      trackIdentifier,
      mediaType,
      datePlayed,
      hours,
      durationPlayedMs,
      endReason,
      sourceType,
      playCount,
      skipCount,
      ignoreForRecommendations,
      trackReference,
      trackDescription,
    ] = record as string[];

    const song = await getSong(trackIdentifier);
    const parseableDate = `${datePlayed.substring(0, 4)}-${datePlayed.substring(4, 6)}-${datePlayed.substring(6)}T${hours}:00:00`;

    if (song) {
      history.push({
        country,
        mediaType,
        endReason,
        sourceType,
        song: song,
        playCount: Number(playCount),
        skipCount: Number(skipCount),
        timeStamp: new Date(parseableDate),
        description: trackDescription,
        trackReference: trackReference === 'N/A' ? undefined : trackReference,
        durationPlayedMs: Number(durationPlayedMs),
        ignoreForRecommendations: ignoreForRecommendations === 'true',
      });
    }
  }

  console.log(history[5], history[10]);
  // TODO put history into some DB
}

const parseLibrarySongs = async (dataRoot: string) => {
  const filePath = path.join(dataRoot, librarySongsFileName)
  const buffer = await fsAsync.readFile(filePath);
  const data = JSON.parse(buffer.toString()) as AppleMusicLibraryTracks;
  const songs = await Promise.all(data.map(item => item['Track Identifier']).map(getSong));
  mergeWithLibrary({songs});
}

const parseFavourites = async (dataRoot: string) => {
  const filePath = path.join(dataRoot, favouritesFileName);
  const parser = fs.createReadStream(filePath).pipe(csvParse.parse({columns: true}));
  const favourites = [];

  for await (const record of parser) {
    const item = record as AppleMusicFavouritesItem;
    switch (item['Favorite Type']) {
      case 'SONG':
        favourites.push(getSong(item['Item Reference']));
        break;
      default:
        throw new Error(`Unrecognized favouriteType ${item['Favorite Type']}`);
    }
  }

  mergeWithLibrary({favourites});
}

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
}

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
}

const ingest = async (args: string[]): Promise<void> => {
  const srcPath = args[0]; // path to decompressed data export
  const privKeyPath = args[1];

  await AppleMusicAPI.init(privKeyPath);

  const files = fs.readdirSync(srcPath).map(x => x);
  if (files.indexOf(appleMusicActivityFolderName) < 0) {
    console.error('Apple Music Activity folder not found in export');
    return;
  }

  const musicDataRoot = path.join(srcPath, appleMusicActivityFolderName);
  const identifierMap = await parsePlaylistItemIdentifiers(musicDataRoot);

  await Promise.all([
    parsePlaylists(musicDataRoot, identifierMap),
    ...[
      parseLibrarySongs,
      parsePlayHistory,
      parseFavourites,
    ].map(x => x(musicDataRoot)),
  ]);

  console.log('Library:', JSON.stringify(getLibrary(), null, 2));
}

export default ingest;
