import fs from "fs/promises";
import url from "url";
import process from "process";
import readline from "readline";
import commander from "commander";

import { createNodeClient } from "./index.js";

const defaultBotPath = url.fileURLToPath(
  new URL("./bot/bot.js", import.meta.url)
);

async function run(botPath = defaultBotPath, { host, venue, autostart }) {
  // https://github.com/mysticatea/eslint-plugin-node/issues/250
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const bot = await import(url.pathToFileURL(botPath).href);

  const client = createNodeClient({
    host,
    venue,
    bot,
    autoStart: autostart,
    onGameReady(startGame) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question("Start game? (y/n) ", (answer) => {
        rl.close();
        if (answer === "" || answer.startsWith("y")) {
          startGame();
        } else {
          client.close();
        }
      });
    },
  });
}

(async () => {
  const pkg = JSON.parse(
    await fs.readFile(new URL("./package.json", import.meta.url), "utf8")
  );

  const program = commander
    .version(pkg.version)
    .arguments("[paintbot-path]")
    .option("--host <url>", "The server to connect to", "http://localhost:8080") //wss://server.paintbot.cygni.se
    .option("--venue <name>", "Which venue to use", "training")
    .option("--autostart", "Automatically start the game", true)
    .option("--no-autostart", "Do not automatically start the game")
    .action(run);

  await program.parseAsync(process.argv);
})();
