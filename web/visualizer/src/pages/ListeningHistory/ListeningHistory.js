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

function ListeningHistory() {
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState([]);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  React.useEffect(() => {
    getHistoryFromAPI();
  }, []);

  const getHistoryFromAPI = () => {
    // TODO: get listening history from API
    const historyFromAPI = [];
    for (let i = 0; i < 100; i++) {
      historyFromAPI.push({
        _id: i,
        timeStamp: "2021-10-01T00:00:00.000Z",
        title: "This Song",
        artists: ["This Artist", "That Artist"],
        album: "This Album",
        isrc: "123456ABCDEF",
        durationPlayed: 300000,
        country: "US",
      });
    }
    setHistory(historyFromAPI);
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
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

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>Ingest history from data export file</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>Ingest history via API</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <OutputIcon />
                  <Typography>Export history via API</Typography>
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
                  <Typography>Ingest history from data export file</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <InputIcon />
                  <Typography>Ingest history via API</Typography>
                </IconButton>

                <IconButton
                  className="action-button"
                  color="inherit"
                  onClick={toggleDrawer}
                >
                  <OutputIcon />
                  <Typography>Export history via API</Typography>
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
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.artists.join(", ")}</TableCell>
                      <TableCell>{row.album}</TableCell>
                      <TableCell>{row.isrc}</TableCell>
                      <TableCell>
                        {formatDuration(row.durationPlayed)}
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
