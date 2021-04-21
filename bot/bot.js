import { Action, MessageType, MapUtility } from '../src/index.js';

export const BOT_NAME = 'Turner';

const directionActions = [Action.Up, Action.Right, Action.Down, Action.Left];

let currentDirection = 0;

function canMoveForward(mapUtils) {
  return mapUtils.canIMoveInDirection(directionActions[currentDirection]);
}

function canMoveLeft(mapUtils) {
  return mapUtils.canIMoveInDirection(directionActions[(currentDirection + 3) % 4]);
}

function canMoveRight(mapUtils) {
  return mapUtils.canIMoveInDirection(directionActions[(currentDirection + 1) % 4]);
}

function canMoveBack(mapUtils) {
  return mapUtils.canIMoveInDirection(directionActions[(currentDirection + 2) % 4]);
}

function turnLeft() {
  currentDirection = (currentDirection + 3) % 4;
}

function turnRight() {
  currentDirection = (currentDirection + 1) % 4;
}

function turnAround() {
  currentDirection = (currentDirection + 2) % 4;
}

/**
 * @param {import('../src/index.js').MapUpdateEvent} mapUpdateEvent
 * @returns {Action | Promise<Action>}
 */
export function getNextAction(mapUpdateEvent) {
  const mapUtils = new MapUtility(mapUpdateEvent.map, mapUpdateEvent.receivingPlayerId);
  const myCharacter = mapUtils.getMyCharacterInfo();

  if (myCharacter.carryingPowerUp) {
    return Action.Explode;
  }

  if (!canMoveForward(mapUtils)) {
    if (canMoveLeft(mapUtils)) {
      turnLeft();
    } else if (canMoveRight(mapUtils)) {
      turnRight();
    } else if (canMoveBack(mapUtils)) {
      turnAround();
    } else {
      return Action.Stay;
    }
  }
  return directionActions[currentDirection];
}

// This handler is optional
export function onMessage(message) {
  switch (message.type) {
    case MessageType.GameStarting:
      // Reset bot state here
      currentDirection = 0;
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
