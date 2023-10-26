import '../types';

import fs, { promises as fsAsync } from 'fs';
import assert from 'assert';
import * as path from 'path';
import * as csvParse from 'csv-parse';
import { getLibrary, mergeWithLibrary } from '../lib/library';

const appleMusicActivityFolderName = 'Apple Music Activity';
const playHistoryFileName = 'Apple Music - Play History Daily Tracks.csv';
const librarySongsFileName = 'Apple Music Library Tracks.json';
const favouritesFileName = 'Apple Music - Favorites.csv';

const getSong = (trackIdentifier: string | number): Song => {
  // TODO make API call to Apple Music API
  if (typeof trackIdentifier === 'number') {
    trackIdentifier = trackIdentifier.toString(10);
  }

  return {
    __type: 'Song',
    isrc: `fake ISRC for apple music identifier ${trackIdentifier}`,
    artists: [],
  };
}

const parsePlayHistory = async (dataRoot: string) => {
  const playHistoryPath = path.join(dataRoot, playHistoryFileName);
  const parser = fs.createReadStream(playHistoryPath).pipe(csvParse.parse());
  const history: ListenHistory = [];

  for await (const record of parser) {
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

    const parseableDate = `${datePlayed.substring(0, 4)}-${datePlayed.substring(4, 6)}-${datePlayed.substring(6)}T${hours}:00:00`;

    history.push({
      country,
      mediaType,
      endReason,
      sourceType,
      song: getSong(trackIdentifier),
      playCount: Number(playCount),
      skipCount: Number(skipCount),
      timeStamp: new Date(parseableDate),
      description: trackDescription,
      trackReference: trackReference === 'N/A' ? undefined : getSong(trackReference).isrc,
      durationPlayedMs: Number(durationPlayedMs),
      ignoreForRecommendations: ignoreForRecommendations === 'true',
    });
  }

  console.log(history[5], history[10]);
  // TODO put history into some DB
}

const parseLibrarySongs = async (dataRoot: string) => {
  const filePath = path.join(dataRoot, librarySongsFileName)
  const buffer = await fsAsync.readFile(filePath);
  const data = JSON.parse(buffer.toString()) as AppleMusicLibraryTracks;
  const songs = data.map(item => item['Track Identifier']).map(getSong);
  mergeWithLibrary({ songs });
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

  mergeWithLibrary({ favourites });
}

const ingest = async (args: string[]): Promise<void> => {
  const srcPath = args[0]; // path to decompressed data export
  const files = fs.readdirSync(srcPath).map(x => x);
  if (files.indexOf(appleMusicActivityFolderName) < 0) {
    console.error('Apple Music Activity folder not found in export');
    return;
  }

  const musicDataRoot = path.join(srcPath, appleMusicActivityFolderName);
  await Promise.all([
    parseLibrarySongs,
    parsePlayHistory,
    parseFavourites,
  ].map(x => x(musicDataRoot)));

  console.log('Library:', getLibrary());
}

export default ingest;
