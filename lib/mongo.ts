import { Collection, Document, FindCursor, MongoClient, WithId } from "mongodb";

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = "musicStreamingAdapter";
const AppleMusicSongCollection = "appleMusicSongs";
const AppleMusicLibrarySongCollection = "appleMusicLibrarySongs";
const HistoryCollection = "userListeningHistory";
const PlaylistCollection = "userPlaylists";
const AlbumCollection = "userAlbums";
const ArtistCollection = "userArtists";
const SongCollection = "userSongs";

const getCollection = async (
  collectionName: string
): Promise<Collection<Document>> => {
  await client.connect();
  const db = client.db(dbName);
  return db.collection(collectionName);
};

export const connectDB = async () => {
  await client.connect();
  console.log(`Connected to MongoDB at ${url}`);
};

export const closeMongoDBConnection = async () => {
  await client.close();
};

// TODO collection.createIndex({'id': 1}, {sparse: true, unique: true});
// for faster queries. Would need another one for ISRC.

export const storeListeningHistory = async (history: HistoryItem[]) => {
  const collection = await getCollection(HistoryCollection);
  await collection.insertMany(history);
};

export const getListeningHistory = async () => {
  const collection = await getCollection(HistoryCollection);
  return collection.find() as FindCursor<WithId<HistoryItem>>;
};

export const storePlaylists = async (playlists: Playlist[]) => {
  const collection = await getCollection(PlaylistCollection);
  await collection.insertMany(playlists);
};

export const getPlaylists = async () => {
  const collection = await getCollection(PlaylistCollection);
  return collection.find() as FindCursor<WithId<Playlist>>;
};

export const storeAlbums = async (albums: Album[]) => {
  const collection = await getCollection(AlbumCollection);
  await collection.insertMany(albums);
};

export const getAlbums = async () => {
  const collection = await getCollection(AlbumCollection);
  return collection.find() as FindCursor<WithId<Album>>;
};

export const storeArtists = async (artists: Artist[]) => {
  const collection = await getCollection(ArtistCollection);
  await collection.insertMany(artists);
};

export const getArtists = async () => {
  const collection = await getCollection(ArtistCollection);
  return collection.find() as FindCursor<WithId<Artist>>;
};

export const storeSongs = async (songs: Song[]) => {
  const collection = await getCollection(SongCollection);
  await collection.insertMany(songs);
};

export const getSongs = async () => {
  const collection = await getCollection(SongCollection);
  return collection.find() as FindCursor<WithId<Song>>;
};

// For caching Apple Music songs to prevent hitting API rate limit

export const storeAppleMusicSongs = async (songs: AppleMusicCatalogSong[]) => {
  const collection = await getCollection(AppleMusicSongCollection);
  await collection.insertMany(songs);
};

export const storeAppleMusicLibrarySongs = async (
  songs: AppleMusicLibrarySongs[]
) => {
  const collection = await getCollection(AppleMusicLibrarySongCollection);
  await collection.insertMany(songs);
};

export const getAppleMusicSongFromIdentifier = async (identifier: string) => {
  const collection = await getCollection(AppleMusicSongCollection);

  return (await collection.findOne({
    id: identifier,
  })) as WithId<AppleMusicCatalogSong> | null;
};

export const getAppleMusicLibrarySongFromIdentifier = async (
  identifier: string
) => {
  const collection = await getCollection(AppleMusicLibrarySongCollection);

  return (await collection.findOne({
    id: identifier,
  })) as WithId<AppleMusicLibrarySongs> | null;
};

export const getAppleMusicSongFromIsrc = async (isrc: string) => {
  const collection = await getCollection(AppleMusicSongCollection);

  return (await collection.findOne({
    attributes: {
      isrc,
    },
  })) as WithId<AppleMusicCatalogSong> | null;
};
