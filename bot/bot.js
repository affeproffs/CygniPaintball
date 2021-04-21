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
