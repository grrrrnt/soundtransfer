import '../types';

import fs from 'fs';
import assert from 'assert';
import * as path from "path";
import * as csvParse from 'csv-parse';

const appleMusicActivityFolderName = 'Apple Music Activity';
const playHistoryFileName = 'Apple Music - Play History Daily Tracks.csv';

const getSong = (trackIdentifier: string): Song => {
  // TODO make API call to Apple Music API
  return {
    isrc: '1234',
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

    const parseableDate = `${datePlayed.substring(0, 4)}-${datePlayed.substring(4, 6)}-${datePlayed.substring(6)}`;

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

const ingest = async (args: string[]): Promise<void> => {
  const srcPath = args[0]; // path to decompressed data export
  const files = fs.readdirSync(srcPath).map(x => x);
  if (files.indexOf(appleMusicActivityFolderName) < 0) {
    console.error('Apple Music Activity folder not found in export');
    return;
  }

  const musicDataRoot = path.join(srcPath, appleMusicActivityFolderName);
  await Promise.all([
    parsePlayHistory(musicDataRoot),
  ]);
}

export default ingest;
