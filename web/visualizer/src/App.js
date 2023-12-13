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
  let spotifyAccessToken = undefined;
  const tokenWithExpiryString = window.localStorage.getItem(
    "spotifyAccessTokenWithExpiry"
  );

  if (tokenWithExpiryString) {
    const tokenWithExpiry = JSON.parse(tokenWithExpiryString);
    if (new Date() < new Date(tokenWithExpiry.expiry)) {
      spotifyAccessToken = tokenWithExpiry.accessToken;
    }
  }

  const [open, setOpen] = React.useState(false);
  const [signedIntoSpotify] = React.useState(!!spotifyAccessToken);
  const [signedIntoAppleMusic, setSignedIntoAppleMusic] = React.useState(false);
  const [privateKeyFile, setPrivateKeyFile] = React.useState(undefined);
  const [keyId, setKeyId] = React.useState(
    window.localStorage.getItem("appleMusicKeyId") ?? ""
  );
  const [issuerId, setIssuerId] = React.useState(
    window.localStorage.getItem("appleMusicIssuerId") ?? ""
  );
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const spotifyClientId = window.localStorage.getItem("spotifyClientId");
  const spotifyClientSecret = window.localStorage.getItem(
    "spotifyClientSecret"
  );

  // States to maintain counts
  const [counts, setCounts] = React.useState({
    songs: 0,
    albums: 0,
    artists: 0,
    playlists: 0,
    history: 0,
  });

  const getAppleMusicPrivateKey = () =>
    window.localStorage.getItem("appleMusicPrivateKey");
  // const getAppleMusicIssuerId = () =>
  //   window.localStorage.getItem("appleMusicIssuerId");
  const getAppleMusicKeyId = () =>
    window.localStorage.getItem("appleMusicKeyId");
  // const getAppleMusicExpiry = () =>
  //   window.localStorage.getItem("appleMusicExpiry");

  React.useEffect(() => {
    const getCountsFromAPI = async () => {
      const req = await fetch("/api/counts");
      setCounts(await req.json());
    };
    getCountsFromAPI();
  }, []);

  const logIntoAppleMusic = async () => {
    let pkcs8 = undefined;
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
      pkcs8 = new TextDecoder().decode(await privateKeyFile.arrayBuffer());
      if (privateKeyFile) {
        pkcs8 = new TextDecoder().decode(await privateKeyFile.arrayBuffer());
      } else {
        pkcs8 = getAppleMusicPrivateKey();
      }

      privateKey = await jose.importPKCS8(pkcs8, alg);
    } catch (e) {
      alert(`Invalid private key file: ${e}`);
      return;
    }

    try {
      const tokenIssueDate = new Date();
      const jwt = await new jose.SignJWT({})
        .setProtectedHeader({
          alg,
          kid,
        })
        .setExpirationTime("1d")
        .setIssuer(issuer)
        .setIssuedAt(tokenIssueDate)
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

      const expiryDate = new Date(tokenIssueDate);
      expiryDate.setDate(expiryDate.getDay() + 1);
      window.localStorage.setItem("appleMusicPrivateKey", pkcs8);
      window.localStorage.setItem("appleMusicIssuerId", issuer);
      window.localStorage.setItem("appleMusicKeyId", keyId);
      window.localStorage.setItem("appleMusicExpiry", expiryDate.toISOString());
    } catch (err) {
      alert(`Error ${err}`);
      return;
    }

    setSignedIntoAppleMusic(true);
  };

  const ingestSpotifyFromDataExportFile = async () => {
    const dataExportPath = window.prompt(
      "Please enter path to the Spotify data export folder on your computer.\n\n" +
        "Paths look like C:\\Users\\username\\Downloads\\Spotify\\MyData " +
        "or /home/username/Downloads/Spotify/MyData"
    );

    if (!dataExportPath?.trim()) {
      alert("Invalid path");
      return;
    }

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
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
        dataExportPath,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    window.location.reload();
  };

  const ingestSpotifyViaAPI = async () => {
    const req = await fetch("/api/ingest/spotify-api", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["songs", "albums", "artists", "playlists"],
        accessToken: spotifyAccessToken,
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    window.location.reload();
  };

  const exportSpotifyViaAPI = async () => {
    const req = await fetch("/api/export/spotify", {
      method: "POST",
      body: JSON.stringify({
        exportTypes: ["songs", "albums", "artists", "playlists"],
        accessToken: spotifyAccessToken,
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    alert("Exported songs, albums, artists and playlists to Spotify!");
  };

  const ingestAppleMusicFromDataExportFile = async () => {
    const instance = window.MusicKit.getInstance();
    const dataExportPath = window.prompt(
      "Please enter path to the Apple Music data export folder on your computer.\n\n" +
        "Paths look like C:\\Users\\username\\Downloads\\AppleMediaServices\\Apple_Media_Services\\Apple Music Activity " +
        "or /home/username/Downloads/AppleMediaServices/Apple_Media_Services/Apple Music Activity"
    );

    if (!dataExportPath?.trim()) {
      alert("Invalid path");
      return;
    }

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
        dataExportPath,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    window.location.reload();
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
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    window.location.reload();
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
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
    alert("Exported songs, albums, artists and playlists to Apple Music!");
  };

  const getAppleMusicPrivateKeyFilePrompt = () => {
    const localStoragePrivateKey = getAppleMusicPrivateKey();
    if (!localStoragePrivateKey && !privateKeyFile) {
      return "No file selected";
    }

    if (localStoragePrivateKey) {
      return `Using cached private key for key ID ${getAppleMusicKeyId()}`;
    }

    return privateKeyFile.name;
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
                  {counts.songs}
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
                  {counts.albums}
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
                  {counts.artists}
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
                  {counts.playlists}
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
                  {counts.history}
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
                        {getAppleMusicPrivateKeyFilePrompt()}
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
