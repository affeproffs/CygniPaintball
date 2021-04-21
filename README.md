# Paintbot client in JavaScript

[![CI](https://github.com/cygni/paintbot-client-js/workflows/CI/badge.svg)](https://github.com/cygni/paintbot-client-js/actions?query=branch%3Amaster+workflow%3ACI)

This is a Paintbot Client written in JavaScript (ECMAScript 2020)

For more information about what Paintbot is, see: https://paintbot.cygni.se/

For running your own server, see [Paintbot Server Repository](https://github.com/cygni/paintbot).

## Requirements

- Node.js v14 or later
- npm
- Paintbot Server (local or remote, there's one running by Cygni so no worries ;) )

## Installation

First off, clone the repository.

```
git clone git@github.com:cygni/paintbot-client-js.git
```

Open the directory of your newly cloned project.

```
cd paintbot-client-js/
```

Now, install it.

```
npm install
```

## Usage

To run a training game:

```
npm start
```

You can supply the path of your bot as an argument, e.g.:

```
npm start -- ./bot/bot.js
```

The default path is "./bot/bot.js".

There are also some other options:

- `--host [url]` The server to connect to (default is "wss://server.paintbot.cygni.se")
- `--venue [name]` Which venue to use (default is "training")
- `--no-autostart` Do not automatically start the game

### Tournament mode

When the time comes for the real game to start, connect to it by setting the venue flag to "tournament", e.g.:

```
npm start -- ./bot/bot.js --venue tournament
```

## Implementation

You only need to implement one function in order to have your own bot up and running: `getNextMove`.

For every `mapUpdateEvent` received, you are expected to reply with an Action (UP, DOWN, LEFT, RIGHT, STAY or EXPLODE).

Have a look at the [example bot](bot/bot.js) to get an idea of how it's done.

### Helper functions

There's a utility class with nifty methods to help you out. Take a look at [`MapUtility`](src/utils.js) and what it offers.

### Pitfalls

Beware the common mishaps:

- If two bots try to move to the same empty space, they will collide and stun each other. Once the stun ends, they risk doing the same thing again. And again, and again. Don't be the bot who runs into another bot the whole game! (`canIMoveInDirection` won't help you here, it only checks if the tile is currently empty - which it is!)
