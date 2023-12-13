import "./App.css";
import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as jose from "jose";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import { Button, Input } from "@mui/material";

import AppBar from "./components/AppBar";
import Drawer from "./components/Drawer";
import Copyright from "./components/Copyright";
import { Link } from "react-router-dom";

const defaultTheme = createTheme();
const drawerWidth = 240;

function App() {
  const tokenWithExpiry = JSON.parse(
    window.localStorage.getItem("spotifyTokenWithExpiry")
  );
  let spotifyAccessToken = undefined;
  if (new Date() > new Date(tokenWithExpiry.expiry)) {
    spotifyAccessToken = tokenWithExpiry.accessToken;
  }

  const [open, setOpen] = React.useState(false);
  const [signedIntoSpotify, setSignedIntoSpotify] = React.useState(
    !!spotifyAccessToken
  );
  const [signedIntoAppleMusic, setSignedIntoAppleMusic] = React.useState(false);
  const [privateKeyFile, setPrivateKeyFile] = React.useState(undefined);
  const [keyId, setKeyId] = React.useState("");
  const [issuerId, setIssuerId] = React.useState("");
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const logIntoAppleMusic = async () => {
    const alg = "ES256";
    const kid = keyId.trim();
    const issuer = issuerId.trim();

    if (!kid || kid.length !== 10) {
      alert("Please enter valid 10-digit key ID");
      return;
    }

    if (!issuer.trim()) {
      alert("Please enter valid issuer ID");
      return;
    }

    if (!privateKeyFile) {
      alert("Please select valid private key file");
      return;
    }

    let privateKey = undefined;
    try {
      const pkcs8 = new TextDecoder().decode(
        await privateKeyFile.arrayBuffer()
      );
      privateKey = await jose.importPKCS8(pkcs8, alg);
    } catch (e) {
      alert(`Invalid private key file: ${e}`);
      return;
    }

    try {
      const jwt = await new jose.SignJWT({})
        .setProtectedHeader({
          alg,
          kid,
        })
        .setExpirationTime("1d")
        .setIssuer(issuer)
        .setIssuedAt(new Date())
        .sign(privateKey);

      await window.MusicKit.configure({
        developerToken: jwt,
        app: {
          name: "Music Streaming Adapter",
          build: "v0.1",
        },
        suppressErrorDialog: false,
        storefrontId: "US",
      });

      const music = window.MusicKit.getInstance();
      await music.authorize();
    } catch (err) {
      alert(`Error ${err}`);
      return;
    }

    setSignedIntoAppleMusic(true);
  };

  const ingestSpotifyFromDataExportFile = async () => {
    // TODO: WIP
    const req = await fetch("/api/ingest/spotify-data-export", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: [
          "songs",
          "albums",
          "artists",
          "playlists",
          "listening-history",
        ],
        accessToken: spotifyAccessToken,
      }),
    });

    console.log(await req.json());
  };

  const ingestSpotifyViaAPI = async () => {
    // TODO
    console.log("TODO");
  };

  const exportSpotifyViaAPI = async () => {
    // TODO
    console.log("TODO");
  };

  const ingestAppleMusicFromDataExportFile = async () => {
    const instance = window.MusicKit.getInstance();

    const req = fetch("/api/ingest/apple-music-data-export", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: [
          "songs",
          "albums",
          "artists",
          "playlists",
          "listening-history",
        ],
        userMusicToken: instance.musicUserToken,
        devToken: instance.developerToken,
      }),
    });

    console.log(await req.json());
  };

  const ingestAppleMusicViaAPI = async () => {
    const instance = window.MusicKit.getInstance();

    const req = await fetch("/api/ingest/apple-music-api", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: [
          "songs",
          "albums",
          "artists",
          "playlists",
          "listening-history",
        ],
        userMusicToken: instance.musicUserToken,
        devToken: instance.developerToken,
      }),
    });

    console.log(await req.json());
  };

  const exportAppleMusicViaAPI = async () => {
    const instance = window.MusicKit.getInstance();

    const req = await fetch("/api/export/apple-music-api", {
      method: "POST",
      body: JSON.stringify({
        exportTypes: ["songs", "albums", "artists", "playlists"],
        userMusicToken: instance.musicUserToken,
        devToken: instance.developerToken,
      }),
    });

    console.log(await req.json());
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          title="Music Streaming Adapter"
          drawerWidth={drawerWidth}
          open={open}
          toggleDrawer={toggleDrawer}
        />
        <Drawer
          drawerWidth={drawerWidth}
          open={open}
          toggleDrawer={toggleDrawer}
        />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container
            maxWidth="xl"
            sx={{ mt: 4, mb: 4 }}
            style={{ display: "flex", flexDirection: "row" }}
          >
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  You've saved
                </Typography>
                <Typography component="p" variant="h4">
                  100
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  songs
                </Typography>
              </Paper>
            </Container>
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  You've saved
                </Typography>
                <Typography component="p" variant="h4">
                  100
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  albums
                </Typography>
              </Paper>
            </Container>
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  You've followed
                </Typography>
                <Typography component="p" variant="h4">
                  100
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  artists
                </Typography>
              </Paper>
            </Container>
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  You have
                </Typography>
                <Typography component="p" variant="h4">
                  100
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  playlists
                </Typography>
              </Paper>
            </Container>
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Your listening history has
                </Typography>
                <Typography component="p" variant="h4">
                  100
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  records
                </Typography>
              </Paper>
            </Container>
          </Container>
          <Container
            maxWidth="md"
            style={{ display: "flex", flexDirection: "row" }}
          >
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                  alignItems: "start",
                }}
              >
                <Typography color="text.secondary">Spotify actions</Typography>
                {signedIntoSpotify ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "start",
                    }}
                  >
                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={ingestSpotifyFromDataExportFile}
                    >
                      <InputIcon />
                      <Typography>Ingest from data export file</Typography>
                    </IconButton>

                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={ingestSpotifyViaAPI}
                    >
                      <InputIcon />
                      <Typography>Ingest via API</Typography>
                    </IconButton>

                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={exportSpotifyViaAPI}
                    >
                      <OutputIcon />
                      <Typography>Export via API</Typography>
                    </IconButton>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Button
                      component={Link}
                      to="/spotify-auth"
                      sx={{ flex: 1, alignSelf: "center" }}
                    >
                      <Typography className="sign-in-button-text">
                        Sign into Spotify
                      </Typography>
                    </Button>
                  </div>
                )}
              </Paper>
            </Container>
            <Container style={{ flex: "1" }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                  alignItems: "start",
                }}
              >
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Apple Music actions
                </Typography>

                {signedIntoAppleMusic ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "start",
                    }}
                  >
                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={ingestAppleMusicFromDataExportFile}
                    >
                      <InputIcon />
                      <Typography>Ingest from data export file</Typography>
                    </IconButton>

                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={ingestAppleMusicViaAPI}
                    >
                      <InputIcon />
                      <Typography>Ingest via API</Typography>
                    </IconButton>

                    <IconButton
                      className="action-button"
                      color="inherit"
                      onClick={exportAppleMusicViaAPI}
                    >
                      <OutputIcon />
                      <Typography>Export via API</Typography>
                    </IconButton>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                      }}
                    >
                      1.
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Button
                          sx={{ flex: 1, alignSelf: "center" }}
                          component="label"
                        >
                          <Typography className="sign-in-button-text">
                            Upload private key file
                          </Typography>
                          <input
                            type="file"
                            onChange={(evt) =>
                              setPrivateKeyFile(evt.target.files[0])
                            }
                            hidden
                          />
                        </Button>
                        {privateKeyFile
                          ? privateKeyFile.name
                          : "No file selected"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                      }}
                    >
                      2.{" "}
                      <Input
                        placeholder="Key ID"
                        value={keyId}
                        onChange={(e) => setKeyId(e.target.value)}
                      ></Input>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                      }}
                    >
                      3.{" "}
                      <Input
                        placeholder="Issuer ID (Team ID)"
                        value={issuerId}
                        onChange={(e) => setIssuerId(e.target.value)}
                      ></Input>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      4.
                      <Button
                        onClick={logIntoAppleMusic}
                        sx={{ flex: 1, alignSelf: "center" }}
                      >
                        <Typography className="sign-in-button-text">
                          Sign into Apple Music
                        </Typography>
                      </Button>
                    </div>
                  </div>
                )}
              </Paper>
            </Container>
          </Container>
          <Container>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
