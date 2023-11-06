import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { listen, port } from '../web/express';

/*
"https://authorize.music.apple.com/woa?"
 query params: { a: base64encode({"thirdPartyName":"js-cdn.music.apple.com","thirdPartyToken":"token"}),
                 referrer: '**referrer here**',}

const getAuthenticateUserUrl = (token: string): string => {
  const queryParam = {
    'thirdPartyName': 'MusicStreamingAdapter',
    'thirdPartyToken': token,
  };
  const url = `https://authorize.music.apple.com/woa?a=${encodeURIComponent(btoa(JSON.stringify(queryParam)))}`;
  return url;
}*/

const ingest = async (args: string[]): Promise<void> => {
  const privateKey = await fs.readFile(args[0]);

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    keyid: 'CHBP53WURA',
    issuer: 'X44A27MMDB', // Team ID from Apple developer account
    expiresIn: '1h',
  });

  const data = await fetch('https://api.music.apple.com/v1/catalog/US/songs/1538003843', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!data.ok) {
    console.error(`Error while making API call: ${data.status} ${data.statusText}`);
    console.error(JSON.stringify(await data.json()));
    return;
  }

  console.log(JSON.stringify(await data.json(), null, 2));

  await listen();
  console.log(`Please visit http://localhost:${port}/apple-music-authorization.html?devToken=${encodeURIComponent(token)}`);
}

export default ingest;
