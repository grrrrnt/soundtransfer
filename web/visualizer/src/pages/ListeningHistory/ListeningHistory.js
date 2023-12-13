import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import AppBar from "../../components/AppBar";
import Drawer from "../../components/Drawer";
import Copyright from "../../components/Copyright";
import * as jose from "jose";
import {Alert} from "@mui/material";
import {Link} from "react-router-dom";

const defaultTheme = createTheme();
const drawerWidth = 240;

function ListeningHistory() {
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState([]);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const spotifyClientId = window.localStorage.getItem("spotifyClientId");
  const spotifyClientSecret = window.localStorage.getItem(
    "spotifyClientSecret"
  );
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

  const [signedIntoSpotify,] = React.useState(
    !!spotifyAccessToken
  );

  const getAppleMusicPrivateKey = () =>
    window.localStorage.getItem("appleMusicPrivateKey");
  const getAppleMusicIssuerId = () =>
    window.localStorage.getItem("appleMusicIssuerId");
  const getAppleMusicKeyId = () =>
    window.localStorage.getItem("appleMusicKeyId");

  const [signedIntoAppleMusic, setSignedIntoAppleMusic] = React.useState(false);

  (async () => {
    let pkcs8 = getAppleMusicPrivateKey();
    const alg = "ES256";
    const kid = getAppleMusicKeyId();
    const issuer = getAppleMusicIssuerId();

    if (!kid || kid.length !== 10) {
      return;
    }

    if (!issuer.trim()) {
      return;
    }

    let privateKey = undefined;
    try {
      privateKey = await jose.importPKCS8(pkcs8, alg);
    } catch (e) {
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

      setSignedIntoAppleMusic(true);
      const expiryDate = new Date(tokenIssueDate);
      expiryDate.setDate(expiryDate.getDay() + 1);
      window.localStorage.setItem("appleMusicPrivateKey", pkcs8);
      window.localStorage.setItem("appleMusicIssuerId", issuer);
      window.localStorage.setItem("appleMusicKeyId", kid);
      window.localStorage.setItem("appleMusicExpiry", expiryDate.toISOString());
    } catch (err) {
      alert(`Error ${err}`);
    }
  })();

  React.useEffect(() => {
    const getHistoryFromAPI = async () => {
      const req = await fetch("/api/listening-history");
      setHistory(await req.json());
    };
    getHistoryFromAPI();
  }, []);

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
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
        ingestTypes: ["listening-history"],
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

    const req = await fetch("/api/ingest/apple-music-data-export", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["listening-history"],
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
        ingestTypes: ["listening-history"],
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

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          title="Listening History"
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
                  Your listening history has
                </Typography>
                <Typography component="p" variant="h4">
                  {history.length}
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  records
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
                  width: "100%",
                  alignItems: "start",
                }}
              >
                <Typography color="text.secondary">Spotify actions</Typography>
                {!signedIntoSpotify && <Alert severity='info'>
                  Please <Link to='/spotify-auth'>sign in</Link> to ingest or export
                </Alert>}
                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestSpotifyFromDataExportFile}
                  disabled={!signedIntoSpotify}
                >
                  <InputIcon />
                  <Typography>Ingest history from data export file</Typography>
                </IconButton>

                <IconButton className="action-button" color="inherit" disabled>
                  <InputIcon />
                  <Typography>
                    Ingest history via API (Not available)
                  </Typography>
                </IconButton>

                <IconButton className="action-button" color="inherit" disabled>
                  <OutputIcon />
                  <Typography>
                    Export history via API (Not available)
                  </Typography>
                </IconButton>
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
                <Typography color="text.secondary" sx={{ flex: 0 }}>
                  Apple Music actions
                </Typography>
                {!signedIntoAppleMusic && <Alert severity='info'>
                  Please <Link to='/'>sign in</Link> to ingest or export
                </Alert>}
                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestAppleMusicFromDataExportFile}
                  disabled={!signedIntoAppleMusic}
                >
                  <InputIcon />
                  <Typography>Ingest history from data export file</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestAppleMusicViaAPI}
                  disabled={!signedIntoAppleMusic}
                >
                  <InputIcon />
                  <Typography>Ingest history via API</Typography>
                </IconButton>

                <IconButton className="action-button" color="inherit" disabled>
                  <OutputIcon />
                  <Typography>
                    Export history via API (Not available)
                  </Typography>
                </IconButton>
              </Paper>
            </Container>
          </Container>
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                Listening History
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Timestamp
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Title</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Artists
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Album</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>ISRC</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Duration played
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Country
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.timeStamp}</TableCell>
                      <TableCell>{row.song.title}</TableCell>
                      <TableCell>{row.song.artists.join(", ")}</TableCell>
                      <TableCell>{row.song.album}</TableCell>
                      <TableCell>{row.song.isrc}</TableCell>
                      <TableCell>
                        {formatDuration(row.durationPlayedMs)}
                      </TableCell>
                      <TableCell>{row.country}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Container>
          <Container>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default ListeningHistory;
