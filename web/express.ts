import path from 'path';
import morgan from 'morgan';
import express from 'express';
import assert from 'assert';
import { AppleMusicAPI } from '../lib/apple-music';

export const port = 8080;
const app = express();

app.use(express.json());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'static')));

const listeningPromise = new Promise<void>((resolve) => {
  app.listen(port, () => {
    console.log(`Express is listening on port ${port}`);
    resolve();
  });
});

app.post('/api/apple-music-user-auth', (req, res) => {
  assert(typeof req.body === 'object' && req.body.hasOwnProperty('musicUserToken'));
  AppleMusicAPI.__unsafe_setUserMusicToken(req.body.musicUserToken);
  res.send();
});

export const listen = () => listeningPromise;
