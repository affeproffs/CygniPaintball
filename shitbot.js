import { Action, MessageType, MapUtility, Coordinate } from "./src/index.js";

export const BOT_NAME = "Latency test";

const directionActions = [Action.Up, Action.Right, Action.Down, Action.Left];
const actionArr = new Array();
let curr = 0;

for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 3; j++) {
    actionArr.push(directionActions[i]);
  }
}

console.log(actionArr);

/**
 * @param {import('./src/index.js').MapUpdateEvent} mapUpdateEvent
 * @returns {Action | Promise<Action>}
 */
export function getNextAction(mapUpdateEvent) {
  const mapUtils = new MapUtility(
    mapUpdateEvent.map,
    mapUpdateEvent.receivingPlayerId
  );
  const myCharacter = mapUtils.getMyCharacterInfo();
  const myCord = mapUtils.getMyCoordinate();

  const action = actionArr[curr % actionArr.length];
  curr += 1;

  return action;
}

// This handler is optional
export function onMessage(message) {
  switch (message.type) {
    case MessageType.GameStarting:
      // Reset bot state here
      break;
  }
}

// Set to null to user server default settings
export const GAME_SETTINGS = {
  maxNoofPlayers: 5,
  timeInMsPerTick: 250,
  obstaclesEnabled: true,
  powerUpsEnabled: true,
  addPowerUpLikelihood: 15,
  removePowerUpLikelihood: 5,
  trainingGame: true,
  pointsPerTileOwned: 1,
  pointsPerCausedStun: 5,
  noOfTicksInvulnerableAfterStun: 3,
  noOfTicksStunned: 10,
  startObstacles: 30,
  startPowerUps: 0,
  gameDurationInSeconds: 60,
  explosionRange: 4,
  pointsPerTick: false,
};
