import yargs, {ArgumentsCamelCase, Argv} from 'yargs';
import {hideBin} from "yargs/helpers";

import ingestAppleMusic from "./ingestors/apple-music";
import ingestAppleMusicApi from "./ingestors/apple-music-api";
import ingestSpotify from "./ingestors/spotify";
import ingestSpotifyApi from "./ingestors/spotify-api";

enum IngestSource {
  Spotify = 'spotify',
  SpotifyApi = 'spotify-api',
  AppleMusic = 'apple-music',
  AppleMusicApi = 'apple-music-api',
}

interface IngestCommandOptions {
  source: IngestSource;
  args: string[];
}

yargs(hideBin(process.argv))
  .scriptName('music-streaming-adapter')
  .usage('$0 <cmd> args')
  .command('ingest <source> [args..]',
    'ingest information from source',
    (args: Argv) => {
      args.positional('source', {
        describe: 'source to ingest user data from',
        choices: [
          IngestSource.Spotify,
          IngestSource.SpotifyApi,
          IngestSource.AppleMusic,
          IngestSource.AppleMusicApi,
        ],
      });
      args.positional('args', {
        describe: 'arguments to the ingestor',
      });
    },
    (args: ArgumentsCamelCase<IngestCommandOptions>) => {
      (() => {
        switch (args.source) {
          case IngestSource.Spotify:
            return ingestSpotify;
          case IngestSource.SpotifyApi:
            return ingestSpotifyApi;
          case IngestSource.AppleMusic:
            return ingestAppleMusic;
          case IngestSource.AppleMusicApi:
            return ingestAppleMusicApi;
          default:
            yargs.showHelpOnFail(true, `unknown ingest source '${args.source}'`);
            return (_: string[]) => {}; // no-op
        }
      })()(args.args);
    })
  .demandCommand()
  .parseSync();
