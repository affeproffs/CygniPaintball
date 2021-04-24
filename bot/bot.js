import {
  Action,
  MessageType,
  MapUtility,
  Coordinate,
  TileType,
} from "../src/index.js";

export const BOT_NAME = "Im a QT";
const directionActions = [Action.Up, Action.Right, Action.Down, Action.Left];
// const actionArr = [Action.Up, Action.Right, Action.Down, Action.Left, Action.Explode];
const QTable = new Map();
let oldState = 0;
let paintedTiles = 0;
let playersStunned = 0;
let isStunned = false;

let currentDirection = 0;

function canMoveForward(mapUtils) {
  return mapUtils.canIMoveInDirection(directionActions[currentDirection]);
}

function canMoveLeft(mapUtils) {
  return mapUtils.canIMoveInDirection(
    directionActions[(currentDirection + 3) % 4]
  );
}

function canMoveRight(mapUtils) {
  return mapUtils.canIMoveInDirection(
    directionActions[(currentDirection + 1) % 4]
  );
}

function canMoveBack(mapUtils) {
  return mapUtils.canIMoveInDirection(
    directionActions[(currentDirection + 2) % 4]
  );
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

// Returns direction of closest power-up
// Any of: NW, NE, N, SE, SW, S, E, W, NO(nowhere)
// Actual:  1,  2, 3,  4,  5, 6, 7, 8, 9
const getPowerDir = (myCord, powerCoords) => {
  let minDist = Infinity;
  let goal = myCord;

  powerCoords.forEach((cord) => {
    if (myCord.manhattanDistanceTo(cord) < minDist) {
      goal = cord;
      minDist = myCord.manhattanDistanceTo(cord);
    }
  });

  if (goal == myCord) return 9;

  if (goal.y < myCord.y && goal.x < myCord.x) {
    return 1;
  } else if (goal.y < myCord.y && goal.x > myCord.x) {
    return 2;
  } else if (goal.y < myCord.y) {
    return 3;
  } else if (goal.y > myCord.y && goal.x > myCord.x) {
    return 4;
  } else if (goal.y > myCord.y && goal.x < myCord.x) {
    return 5;
  } else if (goal.y > myCord.y) {
    return 6;
  } else if (goal.x > myCord.x) {
    return 7;
  } else if (goal.x < myCord.x) {
    return 8;
  }

  return 9;
};

// Returns what type of tile is at cord
// Translation: 1(obstacle, player, oob), 2(powerup), 3(unpainted), 4(our color), 5(other color)
const getTileType = (cord, mapUtils) => {
  if (mapUtils.isCoordinateOutOfBounds(cord)) return 1;
  const cordPos = mapUtils.convertCoordinateToPosition(cord);
  const tileType = mapUtils.getTileAt(cordPos).type;
  let type = 3;

  if (tileType == TileType.Obstacle || tileType == TileType.Character) {
    type = 1;
  } else if (tileType == TileType.PowerUp) {
    type = 2;
  } else {
    for (const [_, cinfo] of mapUtils.characterInfoMap.entries()) {
      cinfo["colouredPositions"].forEach((cpos) => {
        if (cpos == cordPos) {
          // Tile is colored
          type = 5;
          if (cinfo["name"] == BOT_NAME) {
            type = 4;
          }
        }
      });
    }
  }
  return type;
};

// Returns # of players withing 5x5 radius of player
const getPlayersInProximity = (myCord, mapUtils) => {
  let closePlayers = -1; // -1 due to counting ourselves once

  for (const char of mapUtils.characterInfoMap.values()) {
    const charCord = mapUtils.convertPositionToCoordinate(char["position"]);
    if (myCord.manhattanDistanceTo(charCord) <= 5) {
      closePlayers += 1;
    }
  }

  return closePlayers;
};

const getStunnedPlayersInProx = (myCord, mapUtils) => {
  let stunnedPlayers = 0; // -1 due to counting ourselves once

  for (const char of mapUtils.characterInfoMap.values()) {
    const charCord = mapUtils.convertPositionToCoordinate(char["position"]);
    if (myCord.manhattanDistanceTo(charCord) <= 5) {
      if (char["name"] !== BOT_NAME && char["stunnedForGameTicks"] > 0) {
        stunnedPlayers += 1;
      }
    }
  }

  return stunnedPlayers;
};

// Encodes values into a state (number)
const encodeValues = (values) => {
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    sum *= 10;
  }
  return sum;
};

const getState = (mapUtils, myChar) => {
  let values = [];

  const myCord = mapUtils.getMyCoordinate();
  const closestPowerDir = getPowerDir(
    myCord,
    mapUtils.getCoordinatesContainingPowerUps()
  );
  values.push(closestPowerDir);

  let tempCord = myCord;
  tempCord.y -= 1;

  const northCordType = getTileType(tempCord, mapUtils);
  values.push(northCordType);

  tempCord.y += 2;
  const southCordType = getTileType(tempCord, mapUtils);
  values.push(southCordType);

  tempCord.y -= 1;
  tempCord.x -= 1;
  const westCordType = getTileType(tempCord, mapUtils);
  values.push(westCordType);

  tempCord.x += 2;
  const eastCordType = getTileType(tempCord, mapUtils);
  values.push(eastCordType);

  const closePlayers = getPlayersInProximity(myCord, mapUtils);
  values.push(closePlayers);

  const stunnedPlayers = getStunnedPlayersInProx(myCord, mapUtils);
  values.push(stunnedPlayers);

  const holdingPower = myChar.carryingPowerUp ? 1 : 0;
  values.push(holdingPower);

  const isStunned = myChar.stunnedForGameTicks > 0 ? 1 : 0;
  values.push(isStunned);

  const state = encodeValues(values);
  return state;
};

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

  Reward:
    - # of total blocks painted (+-) since last state
    - # of players stunned (+5 per player)
    - Are we stunned? (-20)

  Steps:
    for each getNextAction:
      - Get new state
      - Get previous reward
      - Calculate reward of new state
      - Put reward of new state into QT[previous state-action]
      - Select action from new state (chance of exploration)
      - Previous state = new state

  To implement:
    getState(mapUtils, myChar) => returns number corresponding to state
    getReward(mapUtils, myChar) => returns number corresponding to reward
    selectAction(state) => returns action for state
*/

const getReward = (prevTiles, prevPlayersStunned, prevIsStunned) => {
  let reward = 0;
  reward += paintedTiles - prevTiles;
  if (prevPlayersStunned < playersStunned) {
    reward += (playersStunned - prevPlayersStunned) * 5;
  }
  if (!prevIsStunned && isStunned) {
    reward -= 20;
  }
  return reward;
};

/**
 * @param {import('../src/index.js').MapUpdateEvent} mapUpdateEvent
 * @returns {Action | Promise<Action>}
 */
export function getNextAction(mapUpdateEvent) {
  const mapUtils = new MapUtility(
    mapUpdateEvent.map,
    mapUpdateEvent.receivingPlayerId
  );
  const myCharacter = mapUtils.getMyCharacterInfo();

  const newState = getState(mapUtils, myCharacter);

  const prevTiles = paintedTiles;
  const prevPlayersStunned = playersStunned;
  const prevIsStunned = isStunned;

  paintedTiles = myCharacter.colouredPositions.length;
  playersStunned = getStunnedPlayersInProx(
    mapUtils.convertPositionToCoordinate(myCharacter.position),
    mapUtils
  );
  isStunned = myCharacter.stunnedForGameTicks > 0;

  // If we're still stunned, return dummy action
  if (prevIsStunned && isStunned) {
    return Action.Stay;
  }

  const previousStateReward = getReward(
    prevTiles,
    prevPlayersStunned,
    prevIsStunned
  );

  // First time state+action combination
  if (!QTable.has(oldState)) {
    QTable.set(oldState, 0.0);
  }

  // Q-learning update value
  const update = QTable.get(oldState);

  QTable.set(oldState, update);

  // action =  Select action based on new state. 1,2,3,4,5

  oldState = newState; // + action;

  let minDist = Infinity;
  let goal = mapUtils.convertPositionToCoordinate(myCharacter.position);
  const myCord = mapUtils.getMyCoordinate();

  mapUtils.getCoordinatesContainingPowerUps().forEach((cord) => {
    if (myCord.manhattanDistanceTo(cord) < minDist) {
      goal = cord;
      minDist = myCord.manhattanDistanceTo(cord);
    }
  });

  if (goal != myCord) {
    if (
      myCord
        .translateByAction(directionActions[currentDirection])
        .manhattanDistanceTo(goal) < minDist &&
      canMoveForward(mapUtils)
    ) {
      // You'll do NUFFIN
    } else if (
      myCord
        .translateByAction(directionActions[(currentDirection + 1) % 4])
        .manhattanDistanceTo(goal) < minDist &&
      canMoveRight(mapUtils)
    ) {
      turnRight();
    } else if (
      myCord
        .translateByAction(directionActions[(currentDirection + 3) % 4])
        .manhattanDistanceTo(goal) < minDist &&
      canMoveLeft(mapUtils)
    ) {
      turnLeft();
    } else {
      turnAround();
    }
  }

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
      console.log(message);
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
