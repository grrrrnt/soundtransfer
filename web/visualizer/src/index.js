import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Songs from "./pages/Songs/Songs";
import Artists from "./pages/Artists/Artists";
import Albums from "./pages/Albums/Albums";
import Playlists from "./pages/Playlists/Playlists";
import ListeningHistory from "./pages/ListeningHistory/ListeningHistory";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/songs",
    element: <Songs />,
  },
  {
    path: "/artists",
    element: <Artists />,
  },
  {
    path: "/albums",
    element: <Albums />,
  },
  {
    path: "/playlists",
    element: <Playlists />,
  },
  {
    path: "/listening-history",
    element: <ListeningHistory />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
