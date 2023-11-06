import path from 'path';
import morgan from 'morgan';
import express from 'express';

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
  console.log(req.body);
  res.send();
});

export const listen = () => listeningPromise;
