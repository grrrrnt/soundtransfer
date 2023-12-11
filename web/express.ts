import _ from 'lodash';
import path from 'path';
import express from 'express';
import { AppleMusicAPI } from '../lib/apple-music';
import * as AppleMusicIngestor from '../ingestors/apple-music';
import * as AppleMusicApiIngestor from '../ingestors/apple-music-api';
import * as AppleMusicExporter from '../exporters/apple-music';
import { getAlbums, getArtists, getListeningHistory, getPlaylists, getSongs } from '../lib/mongo';

type IngestTypes =
  'albums' |
  'playlists' |
  'artists' |
  'songs' |
  'listening-history';

type ExportTypes =
  'albums' |
  'playlists' |
  'artists' |
  'songs';

interface AppleMusicRequest {
  devToken: string;
  userMusicToken: string;
}

interface IngestAppleMusicDataExportRequestBody extends AppleMusicRequest {
  ingestTypes: IngestTypes[];
  dataExportPath: string;
}

interface IngestAppleMusicApiRequestBody extends AppleMusicRequest {
  ingestTypes: IngestTypes[];
}

interface IngestSpotifyDataExportRequestBody {
  dataExportPath: string;
  ingestTypes: IngestTypes[];
  clientId?: string;
  clientSecret?: string;
}

interface IngestSpotifyApiRequestBody {
  ingestTypes: IngestTypes[];
  clientId?: string;
  clientSecret?: string;
}

interface ExportAppleMusicRequestBody extends AppleMusicRequest{
  exportTypes: ExportTypes[];
}

interface ExportSpotifyRequestBody {
  exportTypes: ExportTypes[];
  clientId?: string;
  clientSecret?: string;
}

export const port = 8080;
const app = express();

app.use(express.json());
// app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, 'visualizer', 'build')));

export const listen = _.once(
  async () =>
    new Promise<void>((resolve) => {
    app.listen(port, () => {
        console.log(`Express is listening on port ${port}`);
        resolve();
      });
    }),
);

app.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    next();
    return;
  }

  res.sendFile(path.join(__dirname, 'visualizer', 'build', 'index.html'));
});

app.post('/api/ingest/apple-music-data-export', async (req, res) => {
  const {devToken, userMusicToken, ingestTypes, dataExportPath } = req.body as IngestAppleMusicDataExportRequestBody;
  const api = new AppleMusicAPI({
    devToken,
    userMusicToken,
  });

  await AppleMusicIngestor.parseAndStoreInLibrary(api, dataExportPath);

  for (const ingestType of new Set(ingestTypes)) {
    switch (ingestType) {
      case 'albums':
        await AppleMusicIngestor.ingestAlbums();
        break;
      case 'playlists':
        await AppleMusicIngestor.ingestPlaylists();
        break;
      case 'artists':
        await AppleMusicIngestor.ingestArtists();
        break;
      case 'listening-history':
        await AppleMusicIngestor.ingestListeningHistory();
        break;
      case 'songs':
        await AppleMusicIngestor.ingestSongs();
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }

  res.json({
    done: true,
  });
});

app.post('/api/ingest/apple-music-api', async (req, res) => {
  const {devToken, userMusicToken, ingestTypes} = req.body as IngestAppleMusicApiRequestBody;
  const api = new AppleMusicAPI({
    devToken,
    userMusicToken,
  });

  for (const ingestType of new Set(ingestTypes)) {
    switch (ingestType) {
      case 'albums':
        await AppleMusicApiIngestor.ingestAlbums(api);
        break;
      case 'playlists':
        await AppleMusicApiIngestor.ingestPlaylists(api);
        break;
      case 'artists':
        await AppleMusicApiIngestor.ingestArtists(api);
        break;
      case 'listening-history':
        await AppleMusicApiIngestor.ingestListeningHistory(api);
        break;
      case 'songs':
        await AppleMusicApiIngestor.ingestSongs(api);
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }

  res.json({
    done: true,
  });
});

app.post('/api/ingest/spotify-data-export', async (req, res) => {
  const body = req.body as IngestSpotifyDataExportRequestBody;
  for (const ingestType of new Set(body.ingestTypes)) {
    switch (ingestType) {
      case 'albums':
        break;
      case 'playlists':
        break;
      case 'artists':
        break;
      case 'listening-history':
        break;
      case 'songs':
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }
});

app.post('/api/ingest/spotify-api', async (req, res) => {
  const body = req.body as IngestSpotifyApiRequestBody;
  for (const ingestType of new Set(body.ingestTypes)) {
    switch (ingestType) {
      case 'albums':
        break;
      case 'playlists':
        break;
      case 'artists':
        break;
      case 'listening-history':
        break;
      case 'songs':
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }
});

app.post('/api/export/apple-music', async (req, res) => {
  const {devToken, userMusicToken, exportTypes} = req.body as ExportAppleMusicRequestBody;
  const api = new AppleMusicAPI({
    devToken,
    userMusicToken,
  });

  for (const ingestType of new Set(exportTypes)) {
    switch (ingestType) {
      case 'albums':
        await AppleMusicExporter.exportAlbums(api);
        break;
      case 'playlists':
        await AppleMusicExporter.exportPlaylists(api);
        break;
      case 'artists':
        await AppleMusicExporter.exportArtists(api);
        break;
      case 'songs':
        await AppleMusicExporter.exportSongs(api);
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }

  res.json({
    done: true,
  });
});

app.post('/api/export/spotify', async (req, res) => {
  const body = req.body as ExportSpotifyRequestBody;
  for (const ingestType of new Set(body.exportTypes)) {
    switch (ingestType) {
      case 'albums':
        break;
      case 'playlists':
        break;
      case 'artists':
        break;
      case 'songs':
        break;
      default:
        throw new Error(`Unknown ingestType ${ingestType}`);
    }
  }
});

app.get('/api/songs', async (req, res) => {
  const ret = [];
  for await (const song of await getSongs()) {
    ret.push(song);
  }
  res.json(ret);
});

app.get('/api/albums', async (req, res) => {
  const ret = [];
  for await (const album of await getAlbums()) {
    ret.push(album);
  }
  res.json(ret);
});

app.get('/api/artists', async (req, res) => {
  const ret = [];
  for await (const artist of await getArtists()) {
    ret.push(artist);
  }
  res.json(ret);
});

app.get('/api/listening-history', async (req, res) => {
  const ret = [];
  for await (const historyItem of await getListeningHistory()) {
    ret.push(historyItem);
  }
  res.json(ret);
});

app.get('/api/playlists', async (req, res) => {
  const ret = [];
  for await (const playlist of await getPlaylists()) {
    ret.push(playlist);
  }
  res.json(ret);
});
