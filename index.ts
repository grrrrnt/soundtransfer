import yargs, { ArgumentsCamelCase, Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';

import ingestAppleMusic from './ingestors/apple-music';
import ingestAppleMusicApi from './ingestors/apple-music-api';
import ingestSpotify from './ingestors/spotify';
import ingestSpotifyApi from './ingestors/spotify-api';
import exportSpotify from './exporters/spotify';
import exportAppleMusic from './exporters/apple-music';
import { listen, shutdownExpress } from './web/express';
import { closeMongoDBConnection, connectDB } from './lib/mongo';
import { asyncNoOp } from './lib/utils';

dotenv.config();

enum IngestSource {
  Spotify = 'spotify',
  SpotifyApi = 'spotify-api',
  AppleMusic = 'apple-music',
  AppleMusicApi = 'apple-music-api',
}

enum ExportSink {
  Spotify = 'spotify',
  AppleMusic = 'apple-music',
}

interface IngestCommandOptions {
  source: IngestSource;
  args: string[];
}

interface ExportCommandOptions {
  sink: ExportSink;
  args: string[];
}

const shutdown = async () => {
  await Promise.all([
    shutdownExpress(),
    closeMongoDBConnection(),
  ]);
}

Promise.all([
  listen(),
  connectDB(),
]).then(() => {
  yargs(hideBin(process.argv))
    .scriptName('music-streaming-adapter')
    .usage('$0 <cmd> args')
    .command(
      'ingest <source> [args..]',
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
              yargs.showHelpOnFail(
                true,
                `unknown ingest source '${args.source}'`,
              );
              return asyncNoOp<string[]>;
          }
        })()(args.args)
          .catch(console.error)
          .finally(shutdown);
      },
    )
    .command(
      'export <sink> [args..]',
      'export ingested data to sink',
      (args: Argv) => {
        args.positional('sink', {
          describe: 'Music streaming service to export data to',
          choices: [
            ExportSink.AppleMusic,
            ExportSink.Spotify,
          ],
        });
        args.positional('args', {
          describe: 'arguments to the exporter',
        });
      },
      (args: ArgumentsCamelCase<ExportCommandOptions>) => {
        (() => {
          switch (args.sink) {
            case ExportSink.Spotify:
              return exportSpotify;
            case ExportSink.AppleMusic:
              return exportAppleMusic;
            default:
              yargs.showHelpOnFail(
                true,
                `unknown ingest source '${args.source}'`,
              );
              return asyncNoOp<string[]>;
          }
        })()(args.args)
          .catch(console.error)
          .finally(shutdown);
      },
    )
    .demandCommand()
    .parseSync();
});
