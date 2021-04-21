import { Action, MessageType, MapUtility, Coordinate } from '../src/index.js';

export const BOT_NAME = 'Im a QT';

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

/*
  5 actions:
    - Up
    - Down
    - Left
    - Right
    - Boom

  States:
    - Direction of closest powerup(n, ne, nw, w, sw, s, se, e) - 8
    - Type of block in each direction (4 directions, 4 types of blocks(unpainted, our paint, other paint, blocked))
    - # of other players in 5x5 proximity - 1
    - # of stunned players in 5x5 proximity - 1
    - Do we hold a power-up? - 1
    - Are we stunned? - 1
    - # of total blocks painted - 1

  Reward:
    - # of total blocks painted since last state
    - # of players stunned (+5 per player)
    - Are we stunned? (-20)
*/

/**
 * @param {import('../src/index.js').MapUpdateEvent} mapUpdateEvent
 * @returns {Action | Promise<Action>}
 */
export function getNextAction(mapUpdateEvent) {
  const mapUtils = new MapUtility(mapUpdateEvent.map, mapUpdateEvent.receivingPlayerId);
  const myCharacter = mapUtils.getMyCharacterInfo();
  
  let minDist = Infinity;
  let goal = mapUtils.convertPositionToCoordinate(myCharacter.position);
  const myCord = mapUtils.getMyCoordinate();

  mapUtils.getCoordinatesContainingPowerUps().forEach((cord) => {
    if (myCord.manhattanDistanceTo(cord) < minDist) {
      goal = cord   
      minDist = myCord.manhattanDistanceTo(cord);
    }    
  })  

  if (goal != myCord) {
    if (myCord.translateByAction(directionActions[currentDirection]).manhattanDistanceTo(goal) < minDist && canMoveForward(mapUtils)) {
      // You'll do NUFFIN
    } else if (myCord.translateByAction(directionActions[(currentDirection + 1) % 4]).manhattanDistanceTo(goal) < minDist && canMoveRight(mapUtils)) {
      turnRight();
    } else if (myCord.translateByAction(directionActions[(currentDirection + 3) % 4]).manhattanDistanceTo(goal) < minDist && canMoveLeft(mapUtils)) {
      turnLeft();
    } else {
      turnAround();
    }
  }

  console.log(goal, minDist);

  if (myCharacter.carryingPowerUp) {
    return Action.Explode;
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
    case MessageType.GameResult:      
      console.log("yooo game over lmao");
      console.log(message)
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
