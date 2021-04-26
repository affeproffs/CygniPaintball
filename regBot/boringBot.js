import { Action, MessageType, MapUtility, Coordinate } from "../src/index.js";
import { ANode } from "./nodeclass.js";
import { getPlayersInProximity, getTileType } from "../ownUtils/ownUtils.js";
import fs from "fs";

export const BOT_NAME = "A⭐ is born";
const VERSION = "v2";

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

const selectAction = (nodeDetails, goal, myCord) => {
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

  const newGoal = pathArr[pathArr.length - 1];
  if (newGoal.r < myCord.y) {
    return Action.Up;
  } else if (newGoal.r > myCord.y) {
    return Action.Down;
  } else if (newGoal.c < myCord.x) {
    return Action.Left;
  } else {
    return Action.Right;
  }
};

/* A* algorithm, uses manhattan dist as heuristic.
   Finds path from start(Cord) to goal(Cord)*/
const aStar = (mapUtils, start, goal) => {
  const h = mapUtils.map["height"];
  const w = mapUtils.map["width"];
  let closedList = Array.from(Array(h), () => new Array(w).fill(false));
  let nodeDetails = new Array(h);
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
  nodeDetails[r][c].parentR = r;
  nodeDetails[r][c].parentC = c;

  let openList = Array();
  openList.push({ f: 0, r, c });

  closedList[0][0] = true;
  while (openList.length > 0) {
    const node = openList.shift();

    r = node["r"];
    c = node["c"];

    // Up
    let cord = new Coordinate(c, r - 1);
    if (mapUtils.isTileAvailableForMovementTo(cord)) {
      if (areCordsSame(cord, goal)) {
        // Reached goal.
        nodeDetails[r - 1][c].parentR = r;
        nodeDetails[r - 1][c].parentC = c;
        return selectAction(nodeDetails, goal, start);
      } else if (closedList[r - 1][c] == false) {
        const gNew = nodeDetails[r][c].g + 1;
        const hNew = cord.manhattanDistanceTo(goal);
        const fNew = gNew + hNew;

        if (nodeDetails[r - 1][c].f > fNew) {
          // If new OR cheaper path
          openList.push({ f: fNew, r: r - 1, c });
          nodeDetails[r - 1][c].f = fNew;
          nodeDetails[r - 1][c].g = gNew;
          nodeDetails[r - 1][c].h = hNew;
          nodeDetails[r - 1][c].parentR = r;
          nodeDetails[r - 1][c].parentC = c;
        }
      }
    }

    // Down
    cord = new Coordinate(c, r + 1);
    if (mapUtils.isTileAvailableForMovementTo(cord)) {
      if (areCordsSame(cord, goal)) {
        // Reached goal.
        nodeDetails[r + 1][c].parentR = r;
        nodeDetails[r + 1][c].parentC = c;
        return selectAction(nodeDetails, goal, start);
      } else if (!closedList[r + 1][c]) {
        const gNew = nodeDetails[r][c].g + 1;
        const hNew = cord.manhattanDistanceTo(goal);
        const fNew = gNew + hNew;

        if (nodeDetails[r + 1][c].f > fNew) {
          // If new OR cheaper path
          openList.push({ f: fNew, r: r + 1, c });
          nodeDetails[r + 1][c].f = fNew;
          nodeDetails[r + 1][c].g = gNew;
          nodeDetails[r + 1][c].h = hNew;
          nodeDetails[r + 1][c].parentR = r;
          nodeDetails[r + 1][c].parentC = c;
        }
      }
    }

    // Right
    cord = new Coordinate(c + 1, r);
    if (mapUtils.isTileAvailableForMovementTo(cord)) {
      if (areCordsSame(cord, goal)) {
        // Reached goal.
        nodeDetails[r][c + 1].parentR = r;
        nodeDetails[r][c + 1].parentC = c;
        return selectAction(nodeDetails, goal, start);
      } else if (!closedList[r][c + 1]) {
        const gNew = nodeDetails[r][c].g + 1;
        const hNew = cord.manhattanDistanceTo(goal);
        const fNew = gNew + hNew;

        if (nodeDetails[r][c + 1].f > fNew) {
          // If new OR cheaper path
          openList.push({ f: fNew, r, c: c + 1 });
          nodeDetails[r][c + 1].f = fNew;
          nodeDetails[r][c + 1].g = gNew;
          nodeDetails[r][c + 1].h = hNew;
          nodeDetails[r][c + 1].parentR = r;
          nodeDetails[r][c + 1].parentC = c;
        }
      }
    }

    // Left
    cord = new Coordinate(c - 1, r);
    if (mapUtils.isTileAvailableForMovementTo(cord)) {
      if (areCordsSame(cord, goal)) {
        // Reached goal.
        nodeDetails[r][c - 1].parentR = r;
        nodeDetails[r][c - 1].parentC = c;
        return selectAction(nodeDetails, goal, start);
      } else if (!closedList[r][c - 1]) {
        const gNew = nodeDetails[r][c].g + 1;
        const hNew = cord.manhattanDistanceTo(goal);
        const fNew = gNew + hNew;

        if (nodeDetails[r][c - 1].f > fNew) {
          // If new OR cheaper path
          openList.push({ f: fNew, r, c: c - 1 });
          nodeDetails[r][c - 1].f = fNew;
          nodeDetails[r][c - 1].g = gNew;
          nodeDetails[r][c - 1].h = hNew;
          nodeDetails[r][c - 1].parentR = r;
          nodeDetails[r][c - 1].parentC = c;
        }
      }
    }
  }
  console.log("Reached end of a* wtf..");
  return Action.Stay;
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
  if (paintableTiles >= 30) {
    // Enough tiles in proximity that aren't our color
    return true;
  } else if (getPlayersInProximity(myCord, mapUtils, 3) >= 1) {
    // Atleast 1 player in BOOM range
    return true;
  } else if (nextTile == 2) {
    // We are about to pick-up another power-up
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
