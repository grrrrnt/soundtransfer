# Music Streaming Adapter

Our music streaming adapter is a web app that allows users of music streamin services to transfer their music streaming data from one service to another. It currently supports transferring songs, albums, playlists, artists and listening history between Spotify and Apple Music. Do note that our entire web app runs locally on the user's machine. We host only a local server, and we do not ask for, retrieve or store any other user data. This maximises user data privacy and security.

This project was done as part of the CSCI 2390 (Privacy-Conscious Computer Systems) course at Brown University. For more information, see our [final report](www.google.com).

## Running locally

1. Retrieve your Spotify and/or Apple Music developer credentials:
   - Spotify client ID and secret
     - [Spotify developer dashboard](https://developer.spotify.com/dashboard)
     - Create a new app (see [Developer documentation](https://developer.spotify.com/documentation/web-api/concepts/apps))
     - Be sure to add `http://localhost:8080/spotify-auth` as a redirect URI
   - Apple Music developer license
     - [Apple developer dashboard](https://developer.apple.com)
     - Create a media identifier and private key (see [Apple Music API documentation](https://developer.apple.com/help/account/configure-app-capabilities/create-a-media-identifier-and-private-key/))
     - To locate your Team ID, sign in to your developer account, and click Membership in the sidebar. Your Team ID appears in the Membership Information section under the team name.
2. Initialize a MongoDB database running on port `27017` (by default).
3. Run the following command in your terminal to launch our web app:
   ```bash
   (cd web/visualizer && npm run build) && npm start
   ```
4. Navigate to [http://localhost:8080](http://localhost:8080) in your browser.
