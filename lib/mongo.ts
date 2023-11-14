import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'musicStreamingAdapter';
const AppleMusicSongCollection = 'appleMusicSongs';

const getAppleMusicSongFromIdentifier = async (identifier: string) => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(AppleMusicSongCollection);

  return await collection.findOne({
    id: identifier,
  });
}
