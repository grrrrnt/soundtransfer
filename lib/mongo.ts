import { Collection, Document, FindCursor, MongoClient, WithId } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'musicStreamingAdapter';
const AppleMusicSongCollection = 'appleMusicSongs';
const HistoryCollection = 'userListeningHistory';
const PlaylistCollection = 'userPlaylists';

const getCollection = async (collectionName: string): Promise<Collection<Document>> => {
  await client.connect();
  const db = client.db(dbName);
  return db.collection(collectionName);
}

export const connectDB = async () => {
  await client.connect();
  console.log(`Connected to MongoDB at ${url}`);
}

// TODO collection.createIndex({'id': 1}, {sparse: true, unique: true});
// for faster queries. Would need another one for ISRC.

export const storeAppleMusicSongs = async (songs: AppleMusicCatalogSong[]) => {
  const collection = await getCollection(AppleMusicSongCollection);
  await collection.insertMany(songs);
}

export const getAppleMusicSongFromIdentifier = async (identifier: string) => {
  const collection = await getCollection(AppleMusicSongCollection);

  return await collection.findOne({
    id: identifier,
  }) as WithId<AppleMusicCatalogSong> | null;
}

export const getAppleMusicSongFromIsrc = async (isrc: string) => {
  const collection = await getCollection(AppleMusicSongCollection);

  return await collection.findOne({
    attributes: {
      isrc,
    },
  }) as WithId<AppleMusicCatalogSong> | null;
}

export const storeListeningHistory = async (history: HistoryItem[]) => {
  const collection = await getCollection(HistoryCollection);
  await collection.insertMany(history);
}

export const storePlaylists = async (playlists: Playlist[]) => {
  const collection = await getCollection(PlaylistCollection);
  await collection.insertMany(playlists);
}

export const getPlaylists = async () => {
  const collection = await getCollection(PlaylistCollection);
  return collection.find() as FindCursor<WithId<Playlist>>;
}
