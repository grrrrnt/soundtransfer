import _ from "lodash";
import path from "path";
import morgan from "morgan";
import express from "express";
import assert from "assert";
import querystring from "querystring";
import axios from "axios";
import crypto from "crypto";
import { AppleMusicAPI } from "../lib/apple-music";
import { SpotifyAPI, SpotifyAPIError } from "../lib/spotify";

export const port = 8080;
const app = express();

app.use(express.json());
// app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "static")));

export const listen = _.once(
  async () =>
    new Promise<void>((resolve) => {
      app.listen(port, () => {
        console.log(`Express is listening on port ${port}`);
        resolve();
      });
    })
);

app.post("/api/apple-music-user-auth", (req, res) => {
  assert(
    typeof req.body === "object" && req.body.hasOwnProperty("musicUserToken")
  );
  AppleMusicAPI.__unsafe_setUserMusicToken(req.body.musicUserToken);
  res.send();
});

// GET /api/spotify/user-auth -> redirect to Spotify login page
app.get("/api/spotify/user-auth", function (req, res) {
  const generateRandomString = (length: number) => {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  };

  var state = generateRandomString(16);
  var scope =
    "user-read-private user-read-email user-follow-read user-follow-modify user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";
  var redirectUri = "http://localhost:8080/api/spotify/user-auth-callback";

  res.send(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
      })
  );

  // res.send();
});

// GET /api/spotify/user-auth-callback -> get access token
app.get("/api/spotify/user-auth-callback", async function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var redirectUri = "http://localhost:8080/api/spotify/user-auth-callback";

  if (state === null) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    const authToken = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      "utf-8"
    ).toString("base64");

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code?.toString() || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${authToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new SpotifyAPIError({
        status: response.status,
        body: await response.data,
      });
    }

    assert(
      typeof response.data === "object" &&
        response.data.hasOwnProperty("access_token")
    );

    SpotifyAPI.__unsafe_setAccessToken(response.data.access_token);
    res.redirect("/spotify-authorization-success.html");
  }
});
