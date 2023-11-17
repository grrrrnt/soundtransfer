import { MongoClient, WithId } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'musicStreamingAdapter';
const AppleMusicSongCollection = 'appleMusicSongs';

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
