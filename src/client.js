import { GameMode } from "./utils.js";
import {
  MessageType,
  createClientInfoMessage,
  createHeartbeatRequestMessage,
  createRegisterMoveMessage,
  createRegisterPlayerMessage,
  createStartGameMessage,
} from "./messages.js";

const HEARTBEAT_INTERVAL = 5000;
const SUPPORTED_GAME_MODES = new Set(Object.values(GameMode));

export function createClient({
  host = "wss://server.paintbot.cygni.se",
  venue = "training",
  bot,
  logger = console,
  autoStart = true,
  WebSocket: WebSocketImpl = WebSocket,
  onGameReady,
  clientInfo,
  gameSettings = bot?.GAME_SETTINGS,
}) {
  if (bot == null) {
    throw new Error("You must specify a bot to use!");
  }

  const { href } = new URL(venue, host);
  const ws = new WebSocketImpl(href);

  logger.info(`WebSocket is connecting to ${href}`);

  let heartbeatTimeout;
  let latestGameMode;
  let latestGameSettings;
  let latestGameLink;

  ws.addEventListener("open", handleOpen);
  ws.addEventListener("close", handleClose);
  ws.addEventListener("error", handleError);
  ws.addEventListener("message", handleMessage);

  function logGameProgress(gameTick) {
    if (gameTick % 20 === 0) {
      const durationInSeconds = latestGameSettings.gameDurationInSeconds;
      const timeInMsPerTick = latestGameSettings.timeInMsPerTick;
      const totalTicks = (durationInSeconds * 1000) / timeInMsPerTick;
      const progress = (gameTick / totalTicks) * 100;
      logger.info(`Progress: ${Math.floor(progress)}%`);
    }
  }

  function sendMessage(message) {
    ws.send(JSON.stringify(message));
  }

  function close() {
    if (ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING) {
      ws.close();
    }
  }

  function handleOpen() {
    logger.info(`WebSocket is open`);
    sendMessage(createClientInfoMessage(clientInfo));
    logger.info(`Registering player ${bot.BOT_NAME}`);
    sendMessage(createRegisterPlayerMessage(bot.BOT_NAME, gameSettings));
  }

  const messageHandlers = {
    [MessageType.HeartbeatResponse]({ receivingPlayerId }) {
      heartbeatTimeout = setTimeout(
        sendMessage,
        HEARTBEAT_INTERVAL,
        createHeartbeatRequestMessage(receivingPlayerId)
      );
    },

    [MessageType.PlayerRegistered]({
      receivingPlayerId,
      gameMode,
      gameSettings,
    }) {
      latestGameMode = gameMode;
      latestGameSettings = gameSettings;
      if (!SUPPORTED_GAME_MODES.has(gameMode)) {
        logger.error(`Unsupported game mode: ${gameMode}`);
        close();
      } else {
        logger.info(`Player ${bot.BOT_NAME} was successfully registered!`);
        logger.info("Game mode:", gameMode);
        logger.info("Game settings:", gameSettings);
        sendMessage(createHeartbeatRequestMessage(receivingPlayerId));
      }
    },

    [MessageType.InvalidPlayerName]() {
      logger.info(`The player name ${bot.BOT_NAME} was invalid`);
      close();
    },

    [MessageType.GameLink]({ url }) {
      logger.info(`Game is ready`);
      latestGameLink = url;
      if (autoStart && latestGameMode === GameMode.Training) {
        sendMessage(createStartGameMessage());
      } else {
        onGameReady(() => {
          sendMessage(createStartGameMessage());
        });
      }
    },

    [MessageType.GameStarting]() {
      logger.info(`Game is starting...`);
    },

    [MessageType.GameResult]() {
      logger.info(`Game result is in`);
    },

    [MessageType.GameEnded]({ playerWinnerName }) {
      logger.info(`You can view the game at ${latestGameLink}`);
      if (latestGameMode === GameMode.Training) {
        logger.info(`Game has ended. The winner was ${playerWinnerName}!`);
        close();
      }
    },

    [MessageType.TournamentEnded]() {
      close();
    },

    async [MessageType.MapUpdate](mapUpdateEvent) {
      const { receivingPlayerId, gameId, gameTick } = mapUpdateEvent;
      const action = await bot.getNextAction(mapUpdateEvent);
      sendMessage(
        createRegisterMoveMessage(action, receivingPlayerId, gameId, gameTick)
      );
      logGameProgress(gameTick);
    },
  };

  function handleMessage({ data }) {
    const message = JSON.parse(data);
    messageHandlers[message.type]?.(message);
    bot.onMessage?.(message);
  }

  function handleError(error) {
    if (error.message != null) {
      logger.error(error.message);
    }
    logger.info(`WebSocket is closing`);
  }

  function handleClose({ code, reason, wasClean }) {
    logger.info(`WebSocket is closed`, { code, reason, wasClean });
    clearTimeout(heartbeatTimeout);
    ws.removeEventListener("open", handleOpen);
    ws.removeEventListener("close", handleClose);
    ws.removeEventListener("error", handleError);
    ws.removeEventListener("message", handleMessage);
  }

  return {
    close,
  };
}
