import { merge } from 'lodash';
import { DeepReadonly } from 'ts-essentials';

const library: Library = {
  playlists: [],
  artists: [],
  albums: [],
  songs: [],
  favourites: [],
};

export const getLibrary = (): DeepReadonly<Library> => {
  return library;
}

export const mergeWithLibrary = (newData: Partial<Library>): DeepReadonly<Library> => {
  return merge(library, newData);
}
