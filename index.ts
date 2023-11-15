import yargs, { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import dotenv from "dotenv";

import ingestAppleMusic from "./ingestors/apple-music";
import ingestAppleMusicApi from "./ingestors/apple-music-api";
import ingestSpotify from "./ingestors/spotify";
import ingestSpotifyApi from "./ingestors/spotify-api";
import { AsyncOrSync } from "ts-essentials";
import { listen } from "./web/express";

dotenv.config();

enum IngestSource {
  Spotify = "spotify",
  SpotifyApi = "spotify-api",
  AppleMusic = "apple-music",
  AppleMusicApi = "apple-music-api",
}

interface IngestCommandOptions {
  source: IngestSource;
  args: string[];
}
listen().then(() => {
  yargs(hideBin(process.argv))
    .scriptName("music-streaming-adapter")
    .usage("$0 <cmd> args")
    .command(
      "ingest <source> [args..]",
      "ingest information from source",
      (args: Argv) => {
        args.positional("source", {
          describe: "source to ingest user data from",
          choices: [
            IngestSource.Spotify,
            IngestSource.SpotifyApi,
            IngestSource.AppleMusic,
            IngestSource.AppleMusicApi,
          ],
        });
        args.positional("args", {
          describe: "arguments to the ingestor",
        });
      },
      (args: ArgumentsCamelCase<IngestCommandOptions>) => {
        const ret: AsyncOrSync<void> = (() => {
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
                `unknown ingest source '${args.source}'`
              );
              return (_: string[]) => {}; // no-op
          }
        })()(args.args);

        // stupid TypeScript doesn't consider that void functions actually return undefined
        const ret2 = ret as undefined | Promise<void>;
        if (ret2 instanceof Promise) {
          ret2.catch(console.error);
        }
      }
    )
    .demandCommand()
    .parseSync();
});
