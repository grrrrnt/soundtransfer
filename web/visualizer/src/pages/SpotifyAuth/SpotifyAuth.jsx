import _ from 'lodash';
import {useEffect, useState} from "react";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import {Button, CircularProgress} from "@mui/material";
import Typography from "@mui/material/Typography";

const getAccessToken = _.once(async (isAuthStage2, redirectUri, setAccessToken) => {
  if (!isAuthStage2) {
    return;
  }

  const queryParams = new URLSearchParams(window.location.search);
  const tokenUrl = new URL('https://accounts.spotify.com/api/token');
  tokenUrl.searchParams.set('code', queryParams.get('code'));
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('grant_type', 'authorization_code');
  const authToken = btoa(`${window.localStorage.getItem('spotifyClientId')}:${window.localStorage.getItem('spotifyClientSecret')}`);

  const response = await fetch(tokenUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${authToken}`,
    }, method: 'POST',
  });
  const {access_token} = await response.json();
  setAccessToken(access_token);
  const redirectUrl = new URL('/', window.location.href);
  redirectUrl.searchParams.set('spotifyAccessToken', access_token);
  window.location.href = redirectUrl.toString();
});

const SpotifyAuth = () => {
  const redirectUri = new URL(window.location.href);
  const queryParams = new URLSearchParams(window.location.search);
  redirectUri.search = '';

  const [accessToken, setAccessToken] = useState(undefined);
  const [clientId, setClientId] = useState(window.localStorage.getItem('spotifyClientId') ?? '');
  const [clientSecret, setClientSecret] = useState(window.localStorage.getItem('spotifyClientSecret') ?? '');
  const isAuthStage2 = queryParams.has('code') && queryParams.has('state');

  useEffect(() => {
    getAccessToken(isAuthStage2, redirectUri, setAccessToken).catch(alert);
  }, []);

  if (isAuthStage2) {
    return <Container maxWidth='sm' style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', paddingTop: '50px',
    }}>
      <CircularProgress style={{padding: '20px 0'}}/>

      {accessToken ? <>
        <p>Access token received</p>
        <code>
          {accessToken}
        </code>
      </> : 'Waiting to receive access token...'}
    </Container>;
  }

  const signInButtonClicked = async () => {
    const generateRandomString = (length) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = window.crypto.getRandomValues(new Uint8Array(length));
      return values.reduce((acc, x) => acc + possible[x % possible.length], '');
    };

    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email user-follow-read user-follow-modify user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

    window.localStorage.setItem('spotifyClientId', clientId);
    window.localStorage.setItem('spotifyClientSecret', clientSecret);

    const apiUrl = new URL('https://accounts.spotify.com/authorize');
    const queryParams = {
      response_type: 'code', client_id: clientId, scope: scope, redirect_uri: redirectUri, state: state,
    };

    for (const key of Object.keys(queryParams)) {
      apiUrl.searchParams.set(key, queryParams[key]);
    }

    window.location.href = apiUrl.toString();
  };

  return <Container maxWidth='sm' style={{
    display: 'grid', gridTemplateRows: 'auto auto auto auto', gridGap: '20px',
  }}>
    <Typography variant='h2' style={{padding: '20px 0'}}>
      Authorize with Spotify
    </Typography>

    <TextField variant='outlined' label='Client ID' value={clientId} onChange={e => setClientId(e.target.value)}/>
    <TextField variant='outlined' label='Client Secret' value={clientSecret}
               onChange={e => setClientSecret(e.target.value)}/>
    <Button variant='outlined' onClick={signInButtonClicked}>Sign in</Button>
  </Container>;
}

export default SpotifyAuth;
