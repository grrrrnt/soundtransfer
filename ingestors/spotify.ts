import "../types";
import axios from "axios";

const fs = require("fs");
const querystring = require("node:querystring");

/*
  Within the directory, the following JSON files are relevant:
    1. YourLibrary.json
    2. StreamingHistory{0..n}.json
    3. Playlist1.json                 // Unsure if what the "1" is about
*/
const ingest = (args: string[]): void => {
  console.log(`ingesting spotify; args = ${args}`);
  const clientId: string = args[0];
  const clientSecret: string = args[1];
  const path: string = args[2];

  // Get the JSON files
  const libraryJSON = JSON.parse(fs.readFileSync(`${path}/YourLibrary.json`));
  const streamingHistoryJSON = JSON.parse(
    fs.readFileSync(`${path}/StreamingHistory0.json`)
  );
  const playlistsJSON = JSON.parse(fs.readFileSync(`${path}/Playlist1.json`));

  // FIXME: handle multiple streaming history files
  // FIXME: handle multiple playlists files

  // Get Spotify access token using clienId and clientSecret
  authorizeSpotify(clientId, clientSecret).then((accessToken) => {
    console.log(`Using Spotify access token: ${accessToken}`);

    // Populate the library
    populateLibrary(libraryJSON, accessToken).then((library) => {
      // Populate the listen history
      const listenHistory: ListenHistory =
        populateListenHistory(streamingHistoryJSON);

      // Populate the playlists
      const playlists: Playlist[] = populatePlaylists(playlistsJSON);
      library.playlists = playlists;

      // TODO: Do what with the library and listen history?
      console.log(library);
    });
  });
};

/*
  YourLibrary.json
    JSON object
    Contains information about saved songs, albums, artists and podcasts
    Example:
      {
        "tracks": [
          {
            "artist": "Muse",
            "album": "Simulation Theory",
            "track": "Pressure",
            "uri": "spotify:track:3eSyMBd7ERw68NVB3jlRmW"
          },
          {
            "artist": "Guns N' Roses",
            "album": "Greatest Hits",
            "track": "November Rain",
            "uri": "spotify:track:5nzoFlxao6QA8rLaglen0s"
          }
        ],
        "albums": [
          {
            "artist": "Charlie Puth",
            "album": "Voicenotes",
            "uri": "spotify:album:0mZIUXje90JtHxPNzWsJNR"
          },
          {
            "artist": "Bjéar",
            "album": "Bjéar",
            "uri": "spotify:album:7DdDDDBj3h1nANoEFplEyr"
          }
        ],
        "shows": [
          {
            "name": "Economist Podcasts",
            "publisher": "The Economist",
            "uri": "spotify:show:2ZFDmgDS2Z6xccP51s1zFQ"
          },
          {
            "name": "Science Vs",
            "publisher": "Spotify Studios",
            "uri": "spotify:show:5lY4b5PGOvMuOYOjOVEcb9"
          }
        ],
        "episodes": [],
        "bannedTracks": [],
        "artists": [
          {
            "name": "Catfish and the Bottlemen",
            "uri": "spotify:artist:2xaAOVImG2O6lURwqperlD"
          },
          {
            "name": "Charlie Burg",
            "uri": "spotify:artist:0ubGY2CcC0tvR0eE6hJaT8"
          }
        ],
        "bannedArtists": [],
        "other": []
      }
*/
const populateLibrary = async (
  libraryJSON: any,
  accessToken: string
): Promise<Library> => {
  // Initialize the library
  let library: Library = {
    playlists: [],
    songs: [],
    artists: [],
    albums: [],
  };

  // TODO: Populate songs in batch: https://developer.spotify.com/documentation/web-api/reference/get-several-tracks

  // Populate the songs
  const songsPromises = libraryJSON.tracks.map(async (track: any) => {
    const songData = await getSongDataFromSpotifyURI(track.uri, accessToken);
    const song: Song = {
      isrc: songData.isrc,
      title: track.track,
      artists: [track.artist],
      year: songData.year,
      duration: songData.duration,
    };
    return song;
  });

  library.songs = await Promise.all(songsPromises);
  return library;
};

/*
  StreamingHistory{0..n}.json
    JSON array
    Contains information about listening history
    Example:
      [
        {
          "endTime" : "2022-09-28 18:36",
          "artistName" : "Casey Abrams",
          "trackName" : "Why Don't You Do Right?",
          "msPlayed" : 180020
        },
        {
          "endTime" : "2022-09-28 18:39",
          "artistName" : "demon gummies",
          "trackName" : "just a little more",
          "msPlayed" : 150400
        }
      ]
*/
const populateListenHistory = (
  streamingHistoryJSON: any
): ListenHistory => {
  // Initialize the listen history
  let listenHistory: ListenHistory = [];

  // Populate the listen history
  streamingHistoryJSON.forEach((item: any) => {
    const historyItem: HistoryItem = {
      timeStamp: new Date(item.endTime),
      country: "TODO",
      song: {
        isrc: "TODO",
        title: item.trackName,
        artists: [item.artistName],
      },
      durationPlayedMs: item.msPlayed,
      trackReference: "TODO",
      // TODO: Other fields
    };
    listenHistory.push(historyItem);
  });

  return listenHistory;
};

/*
  Playlist1.json
    JSON object
    Contains information about playlists
    Example:
      {
        "playlists": [
          {
            "name": "🍇 the grape escape 🍇",
            "lastModifiedDate": "2023-09-25",
            "items": [
              {
                "track": {
                  "trackName": "The Great Escape",
                  "artistName": "Patrick Watson",
                  "albumName": "Close to Paradise",
                  "trackUri": "spotify:track:1GIPP103zfsythULEpsmdw"
                },
                "episode": null,
                "localTrack": null,
                "addedDate": "2023-07-04"
              },
              {
                "track": {
                  "trackName": "Long Way Down",
                  "artistName": "Tom Odell",
                  "albumName": "Long Way Down (Deluxe)",
                  "trackUri": "spotify:track:1uVk6S6Fpkrmji0iTpgKEC"
                },
                "episode": null,
                "localTrack": null,
                "addedDate": "2023-07-04"
              }
            ],
            "description": "i used to know but i&#x27;m not sure now",
            "numberOfFollowers": 1
          },
          {
            "name": "maine branch",
            "lastModifiedDate": "2023-05-12",
            "items": [
              {
                "track": {
                  "trackName": "น้ำแดงน้ำส้ม",
                  "artistName": "JV.JARVIS",
                  "albumName": "น้ำแดงน้ำส้ม",
                  "trackUri": "spotify:track:1xxJiB2B3rMw8g85PPtcN7"
                },
                "episode": null,
                "localTrack": null,
                "addedDate": "2023-05-06"
              }
            ],
            "description": null,
            "numberOfFollowers": 2
          }
        ]
      }
*/
const populatePlaylists = (playlistsJSON: any): Playlist[] => {
  // Initialize the playlists
  let playlists: Playlist[] = [];

  // Populate the playlists
  playlistsJSON.playlists.forEach((playlist: any) => {
    const playlistItem: PlaylistItem = {
      song: {
        isrc: "TODO",
        title: "TODO",
        artists: ["TODO"],
      },
      addedDate: new Date(playlist.addedDate),
    };
    const p: Playlist = {
      name: playlist.name,
      songs: [playlistItem],
      description: playlist.description,
      imageUrl: "TODO",
      lastModifiedDate: new Date(playlist.lastModifiedDate),
      owner: "TODO",
    };
    playlists.push(p);
  });

  return playlists;
};

const getSongDataFromSpotifyURI = async (
  spotifyURI: string,
  accessToken: string
): Promise<any> => {
  // Example: spotify:track:1GIPP103zfsythULEpsmdw

  // Get the URI
  const split = spotifyURI.split(":");
  if (split.length !== 3) {
    console.log(`Error in spotifyURI format: ${spotifyURI}`);
    return "";
  }
  const uri = split[2];

  // Get the song data using Spotify API
  const response = await axios.get(`https://api.spotify.com/v1/tracks/${uri}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const songData = response.data;

  return {
    isrc: songData.external_ids.isrc,
    year: songData.album.release_date.split("-")[0], // Do we want the release date or just the year?
    duration: songData.duration_ms,
  };
};

const authorizeSpotify = async (
  clientId: string,
  clientSecret: string
): Promise<string> => {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    querystring.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const accessToken = response.data.access_token;
  return accessToken;
};

export default ingest;
