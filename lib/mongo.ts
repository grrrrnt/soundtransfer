import { MongoClient, WithId } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'musicStreamingAdapter';
const AppleMusicSongCollection = 'appleMusicSongs';
const HistoryCollection = 'userListeningHistory';

export const connectDB = async () => {
  await client.connect();
  console.log(`Connected to MongoDB at ${url}`);
}

// TODO collection.createIndex({'id': 1}, {sparse: true, unique: true});
// for faster queries. Would need another one for ISRC.

export const storeAppleMusicSongs = async (songs: AppleMusicCatalogSong[]) => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(AppleMusicSongCollection);
  await collection.insertMany(songs);
}

export const getAppleMusicSongFromIdentifier = async (identifier: string) => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(AppleMusicSongCollection);

  return await collection.findOne({
    id: identifier,
  }) as WithId<AppleMusicCatalogSong> | null;
}

export const storeListeningHistory = async (history: HistoryItem[]) => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(HistoryCollection);

  await collection.insertMany(history);
}
