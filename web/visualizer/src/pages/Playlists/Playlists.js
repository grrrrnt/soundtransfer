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

function Playlists() {
  const [open, setOpen] = React.useState(false);
  const [playlists, setPlaylists] = React.useState([]);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  React.useEffect(() => {
    getPlaylistsFromAPI();
  }, []);

  const getPlaylistsFromAPI = () => {
    // TODO: get playlists from API
    const playlistsFromAPI = [];
    for (let i = 0; i < 100; i++) {
      playlistsFromAPI.push({
        _id: i,
        name: "This Playlist",
        description: "This is a playlist",
        lastModifiedDate: "2021-10-01T00:00:00.000Z",
        // TODO: display songs in modal instead of just the count
        songs: [
          {
            _id: 0,
            title: "This Song",
            artists: ["This Artist", "That Artist"],
            album: "This Album",
            duration: 300000,
            year: "2024",
            isrc: "123456ABCDEF",
          },
          {
            _id: 1,
            title: "That Song",
            artists: ["This Artist", "That Artist"],
            album: "That Album",
            duration: 300000,
            year: "2024",
            isrc: "ABCDEF123456",
          },
        ],
      });
    }
    setPlaylists(playlistsFromAPI);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          title="Playlists"
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
                  You have
                </Typography>
                <Typography component="p" variant="h4">
                  {playlists.length}
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
                  width: "100%",
                  alignItems: "start",
                }}
              >
                <Typography color="text.secondary">Spotify actions</Typography>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>
                    Ingest playlists from data export file
                  </Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>Ingest playlists via API</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <OutputIcon />
                  <Typography>Export playlists via API</Typography>
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
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>
                    Ingest playlists from data export file
                  </Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>Ingest playlists via API</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <OutputIcon />
                  <Typography>Export playlists via API</Typography>
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
              <Typography sx={{ fontWeight: "bold" }}>Playlists</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Description
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Number of songs
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>
                      Last modified date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playlists.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>{row.songs.length}</TableCell>
                      <TableCell>{row.lastModifiedDate}</TableCell>
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

export default Playlists;