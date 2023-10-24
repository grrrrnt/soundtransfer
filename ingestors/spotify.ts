/*
  Within the directory, the following JSON files are relevant:
    1. YourLibrary.json
    2. StreamingHistory{0..n}.json
    3. Playlist1.json                 // Unsure if what the "1" is about

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

const ingest = (args: string[]): void => {
  console.log(`ingesting spotify; args = ${args}`);
};

export default ingest;
