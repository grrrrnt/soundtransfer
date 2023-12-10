import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PeopleIcon from "@mui/icons-material/People";
import AlbumIcon from "@mui/icons-material/Album";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

function Drawer(props) {
  const { drawerWidth, open, toggleDrawer } = props;

  const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
  })(({ theme, open }) => ({
    "& .MuiDrawer-paper": {
      position: "relative",
      whiteSpace: "nowrap",
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: "border-box",
      ...(!open && {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up("sm")]: {
          width: theme.spacing(9),
        },
      }),
    },
  }));

  return (
    <Drawer variant="permanent" open={open}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List component="nav">
        <ListItemButton to="/">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <Divider sx={{ my: 1 }} />
        <ListSubheader component="div" inset>
          Data Types
        </ListSubheader>
        <ListItemButton to="/songs">
          <ListItemIcon>
            <MusicNoteIcon />
          </ListItemIcon>
          <ListItemText primary="Saved Songs" />
        </ListItemButton>
        <ListItemButton to="/artists">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Followed Artists" />
        </ListItemButton>
        <ListItemButton to="/albums">
          <ListItemIcon>
            <AlbumIcon />
          </ListItemIcon>
          <ListItemText primary="Saved Albums" />
        </ListItemButton>
        <ListItemButton to="/playlists">
          <ListItemIcon>
            <PlaylistPlayIcon />
          </ListItemIcon>
          <ListItemText primary="Playlists" />
        </ListItemButton>
        <ListItemButton to="/listening-history">
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Listening History" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}

export default Drawer;
