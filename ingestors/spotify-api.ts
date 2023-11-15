import "../types";
import axios from "axios";
import fs, { promises as fsAsync } from "fs";
import { SpotifyAPI } from "../lib/spotify";
import { kebabCase } from "lodash";
import querystring from "querystring";
import { getLibrary, mergeWithLibrary } from "../lib/library";

const BATCH_SIZE = 50;

const ingest = async (args: string[]): Promise<void> => {
  console.log(`ingesting spotify API; args = ${args}`);
  const clientId = args[0];
  const clientSecret = args[1];

  // Initialize the Spotify API handler
  await SpotifyAPI.initWithAuthorizationCode(clientId, clientSecret);
  const api = SpotifyAPI.getInstance();
};

export default ingest;
