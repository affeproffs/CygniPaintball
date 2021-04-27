import { Action, MessageType, MapUtility, Coordinate } from "../src/index.js";
import { ANode } from "./nodeclass.js";
import { getPlayersInProximity, getTileType } from "../ownUtils/ownUtils.js";
import fs from "fs";
import { parentPort } from "worker_threads";

export const BOT_NAME = "A⭐ is born";
const VERSION = "v3";

const areCordsSame = (c1, c2) => {
  return c1.x === c2.x && c1.y === c2.y;
};

// Used for A* debugging.
const printPath = (nodeDetails, goal, myCord) => {
  console.log("Whole path from", myCord, "to:", goal, ":");

  let r = goal.y;
  let c = goal.x;
  let pathArr = Array();
  while (!(nodeDetails[r][c].parentR == r && nodeDetails[r][c].parentC == c)) {
    pathArr.push({ r, c });
    const newR = nodeDetails[r][c].parentR;
    const newC = nodeDetails[r][c].parentC;
    r = newR;
    c = newC;
  }
  pathArr.push({ r, c });

  for (let i = 0; i < pathArr.length; i++) {
    console.log(pathArr[i]);
  }
};

// Returns most suitable tile(Cord) from cordsArr
// Priority: Other color, unpainted, ourcolor
const getBestTile = (mapUtils, cordsArr) => {
  /*
    Iterate thru each cord.
    Check if another player is in any direction -> BAD
  */
  let bestCord = null,
    bestCordType = -1;
  cordsArr.forEach((cord) => {
    // Continue here.
  });
  return bestCord;
};

// Iterates through A* path and returns best action for myCord to goal.
const selectAction = (mapUtils, nodeDetails, goal, myCord) => {
  let r = goal.y;
  let c = goal.x;
  let pathArr = Array();
  console.log("Me:", myCord, "Goal:", goal);
  while (
    !(nodeDetails[r][c].parentR[0] == r && nodeDetails[r][c].parentC[0] == c)
  ) {
    pathArr.push({ r, c });
    const newR = nodeDetails[r][c].parentR[0];
    const newC = nodeDetails[r][c].parentC[0];
    r = newR;
    c = newC;
  }

  let newGoal = null;
  if (pathArr.length == 1) {
    // One step away from goal.
    newGoal = pathArr[pathArr.length - 1];
  } else {
    // More than 1 step away
    newGoal = pathArr[pathArr.length - 2];
    const yArr = nodeDetails[newGoal.r][newGoal.c].parentR;
    const xArr = nodeDetails[newGoal.r][newGoal.c].parentC;
    let cordsArr = new Array();
    for (let i = 0; i < yArr.length; i++) {
      cordsArr.push(new Coordinate(xArr[i], yArr[i]));
    }
    const bestCord = getBestTile(mapUtils, cordsArr) ?? myCord;
    newGoal = { r: bestCord.y, c: bestCord.x };
  }

  if (newGoal.r < myCord.y) {
    return Action.Up;
  } else if (newGoal.r > myCord.y) {
    return Action.Down;
  } else if (newGoal.c < myCord.x) {
    return Action.Left;
  } else if (newGoal.c > myCord.x) {
    return Action.Right;
  } else {
    return Action.Stay;
  }
};

let nodeDetails = Array(); // A*
let openList = Array(); // A*
let finalF = Infinity;

// Used for each direction (up, left, down, right)
const aStarUtil = (mapUtils, co, goal, r, c) => {
  if (mapUtils.isTileAvailableForMovementTo(co)) {
    const gNew = nodeDetails[r][c].g + 1;
    const hNew = co.manhattanDistanceTo(goal);
    const fNew = gNew + hNew;
    if (fNew > finalF) return;
    if (areCordsSame(co, goal)) {
      // Reached goal.
      if (fNew < finalF) {
        nodeDetails[co.y][co.x].parentR = new Array();
        nodeDetails[co.y][co.x].parentR.push(r);
        nodeDetails[co.y][co.x].parentC = new Array();
        nodeDetails[co.y][co.x].parentC.push(c);
      } else {
        nodeDetails[co.y][co.x].parentR.push(r);
        nodeDetails[co.y][co.x].parentC.push(c);
      }
      finalF = fNew;
      return true;
    } else {
      if (nodeDetails[co.y][co.x].f > fNew) {
        // If new OR cheaper path
        openList.push({ f: fNew, r: co.y, c: co.x });
        nodeDetails[co.y][co.x].f = fNew;
        nodeDetails[co.y][co.x].g = gNew;
        nodeDetails[co.y][co.x].h = hNew;
        nodeDetails[co.y][co.x].parentR.push(r);
        nodeDetails[co.y][co.x].parentC.push(c);
      } else if (nodeDetails[co.y][co.x].f == fNew) {
        // Additional paths of same cost
        nodeDetails[co.y][co.x].parentR.push(r);
        nodeDetails[co.y][co.x].parentC.push(c);
      }
    }
  }
  return false;
};

/* Modified A* algorithm, uses manhattan dist as heuristic.
   Finds path from starnt(Cord) to goal(Cord)*/
const aStar = (mapUtils, start, goal) => {
  const h = mapUtils.map["height"];
  const w = mapUtils.map["width"];
  nodeDetails = new Array(h);
  for (let i = 0; i < nodeDetails.length; i++) {
    nodeDetails[i] = new Array(w);
    for (let j = 0; j < nodeDetails[i].length; j++) {
      nodeDetails[i][j] = new ANode();
    }
  }

  let r = start.y;
  let c = start.x;
  nodeDetails[r][c].f = 0.0;
  nodeDetails[r][c].g = 0.0;
  nodeDetails[r][c].h = 0.0;
  nodeDetails[r][c].parentR.push(r);
  nodeDetails[r][c].parentC.push(c);

  openList = new Array();
  openList.push({ f: 0, r, c });

  finalF = Infinity;

  while (openList.length > 0) {
    const node = openList.shift();

    r = node["r"];
    c = node["c"];

    // Up
    let cord = new Coordinate(c, r - 1);
    aStarUtil(mapUtils, cord, goal, r, c);

    // Down
    cord = new Coordinate(c, r + 1);
    aStarUtil(mapUtils, cord, goal, r, c);

    // Right
    cord = new Coordinate(c + 1, r);
    aStarUtil(mapUtils, cord, goal, r, c);

    // Left
    cord = new Coordinate(c - 1, r);
    aStarUtil(mapUtils, cord, goal, r, c);
  }
  return selectAction(mapUtils, nodeDetails, goal, start);
};

// Returns paintable tiles within boom range
const getPaintableTilesInProx = (mapUtils, myCord) => {
  let closeCords = new Array();
  const h = mapUtils.map["height"];
  const w = mapUtils.map["width"];
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const cord = new Coordinate(j, i);

      if (myCord.manhattanDistanceTo(cord) <= 4) {
        closeCords.push(cord);
      }
    }
  }
  let paintable = 0;
  closeCords.forEach((cord) => {
    const tileType = getTileType(cord, mapUtils, BOT_NAME);
    if (tileType === 3 || tileType === 5) {
      paintable += 1;
    }
  });
  return paintable;
};

const isGoodTimeToExplode = (mapUtils, myCord, action) => {
  const paintableTiles = getPaintableTilesInProx(mapUtils, myCord);
  const nextTile = getTileType(
    myCord.translateByAction(action),
    mapUtils,
    BOT_NAME
  );
  const ticksLeft = 240 - mapUtils.map["worldTick"];
  if (paintableTiles >= 30) {
    // Enough tiles in proximity that aren't our color
    return true;
  } else if (getPlayersInProximity(myCord, mapUtils, 3) >= 1) {
    // Atleast 1 player in BOOM range
    return true;
  } else if (nextTile == 2) {
    // We are about to pick-up another power-up
    return true;
  } else if (ticksLeft <= 3) {
    // End of game
    return true;
  }
  return false;
};

const closestPowerCord = (powerUpCords, myCord) => {
  let minDist = Infinity;
  let goal = myCord;

  powerUpCords.forEach((cord) => {
    if (myCord.manhattanDistanceTo(cord) < minDist) {
      goal = cord;
      minDist = myCord.manhattanDistanceTo(cord);
    }
  });

  return goal != myCord ? goal : -1;
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
  const myCord = mapUtils.getMyCoordinate();

  const goal = closestPowerCord(
    mapUtils.getCoordinatesContainingPowerUps(),
    myCord
  );

  if (goal === -1) {
    // No powerup, stay
    // Should probably set goal as center of least inhabited quadrant.
    return Action.Stay;
  }

  const action = aStar(mapUtils, myCord, goal);

  if (myCharacter.carryingPowerUp) {
    if (isGoodTimeToExplode(mapUtils, myCord, action)) {
      return Action.Explode;
    }
  }

  return action;

  // If there are multiple ways to reach same cord with same dist, save them
  // in order to iterate thru them and choose the least "risky" one.
}

// This handler is optional
export function onMessage(message) {
  switch (message.type) {
    case MessageType.GameStarting:
      // Reset bot state here
      break;
    case MessageType.GameResult:
      // Logs results.
      /*
      message["playerRanks"].forEach((player) => {
        if (player["playerName"] == BOT_NAME) {
          fs.appendFileSync(
            "logs/astar" + VERSION + ".txt",
            player["points"].toString() +
              " " +
              message["gameId"] +
              " " +
              (player["rank"] == 1 ? "1" : "0") +
              "\n"
          );
        }
      });*/
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
