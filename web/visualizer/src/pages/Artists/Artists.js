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

const defaultTheme = createTheme();
const drawerWidth = 240;

function Artists() {
  const [open, setOpen] = React.useState(false);
  const [artists, setArtists] = React.useState([]);
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

  React.useEffect(() => {
    const getArtistsFromAPI = async () => {
      const req = await fetch("/api/artists");
      setArtists(await req.json());
    };
    getArtistsFromAPI();
  }, []);

  const ingestSpotifyFromDataExportFile = async () => {
    const req = await fetch("/api/ingest/spotify-data-export", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["artists"],
        accessToken: spotifyAccessToken,
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
  };

  const ingestSpotifyViaAPI = async () => {
    const req = await fetch("/api/ingest/spotify-api", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["artists"],
        accessToken: spotifyAccessToken,
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
  };

  const exportSpotifyViaAPI = async () => {
    const req = await fetch("/api/export/spotify-api", {
      method: "POST",
      body: JSON.stringify({
        exportTypes: ["artists"],
        accessToken: spotifyAccessToken,
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
  };

  const ingestAppleMusicFromDataExportFile = async () => {
    const instance = window.MusicKit.getInstance();

    const req = await fetch("/api/ingest/apple-music-data-export", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["artists"],
        userMusicToken: instance.musicUserToken,
        devToken: instance.developerToken,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
  };

  const ingestAppleMusicViaAPI = async () => {
    const instance = window.MusicKit.getInstance();

    const req = await fetch("/api/ingest/apple-music-api", {
      method: "POST",
      body: JSON.stringify({
        ingestTypes: ["artists"],
        userMusicToken: instance.musicUserToken,
        devToken: instance.developerToken,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(await req.json());
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          title="Followed Artists"
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
                  You've followed
                </Typography>
                <Typography component="p" variant="h4">
                  {artists.length}
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
                  width: "100%",
                  alignItems: "start",
                }}
              >
                <Typography color="text.secondary">Spotify actions</Typography>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestSpotifyFromDataExportFile}
                >
                  <InputIcon />
                  <Typography>Ingest artists from data export file</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestSpotifyViaAPI}
                >
                  <InputIcon />
                  <Typography>Ingest artists via API</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={exportSpotifyViaAPI}
                >
                  <OutputIcon />
                  <Typography>Export artists via API</Typography>
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
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Apple Music actions
                </Typography>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestAppleMusicFromDataExportFile}
                >
                  <InputIcon />
                  <Typography>Ingest artists from data export file</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={ingestAppleMusicViaAPI}
                >
                  <InputIcon />
                  <Typography>Ingest artists via API</Typography>
                </IconButton>

                <IconButton className="action-button" color="inherit" disabled>
                  <OutputIcon />
                  <Typography>
                    Export artists via API (Not available)
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
                Followed Artists
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {artists.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.name}</TableCell>
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

export default Artists;
