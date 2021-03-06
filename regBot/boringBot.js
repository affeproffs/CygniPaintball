import { Action, MessageType, MapUtility, Coordinate } from "../src/index.js";
import { ANode } from "./nodeclass.js";
import { getPlayersInProximity, getTileType } from "../ownUtils/ownUtils.js";
import fs from "fs";

export const BOT_NAME = "A⭐ is born";
const VERSION = "v3+++";
let hasStayed = false;

const areCordsSame = (c1, c2) => {
  return c1.x === c2.x && c1.y === c2.y;
};

// Returns most suitable tile(Cord) from cordsArr
// Priority: Powerup > other color > unpainted > ourcolor
// if another player is in any direction -> BAD
const getBestTile = (mapUtils, cordsArr) => {
  const order = { 0: 0, 2: 4, 3: 2, 4: 1, 5: 3 }; // Powerup > Other color > unpainted > ourcolor
  let bestCord = null,
    bestCordType = 0;
  cordsArr.forEach((cord) => {
    let cordType = getTileType(cord, mapUtils, BOT_NAME);

    const upPos = mapUtils.isCoordinateOutOfBounds(
      cord.translateByAction(Action.Up)
    )
      ? null
      : mapUtils.convertCoordinateToPosition(cord.translateByAction(Action.Up));

    const downPos = mapUtils.isCoordinateOutOfBounds(
      cord.translateByAction(Action.Down)
    )
      ? null
      : mapUtils.convertCoordinateToPosition(
          cord.translateByAction(Action.Down)
        );

    const leftPos = mapUtils.isCoordinateOutOfBounds(
      cord.translateByAction(Action.Left)
    )
      ? null
      : mapUtils.convertCoordinateToPosition(
          cord.translateByAction(Action.Left)
        );

    const rightPos = mapUtils.isCoordinateOutOfBounds(
      cord.translateByAction(Action.Right)
    )
      ? null
      : mapUtils.convertCoordinateToPosition(
          cord.translateByAction(Action.Right)
        );

    const directionCords = [upPos, downPos, leftPos, rightPos];

    for (let player of mapUtils.characterInfoMap.values()) {
      if (player["name"] !== BOT_NAME) {
        // Potential player to crash with
        if (
          directionCords.find((tmpPos) => tmpPos === player["position"]) &&
          player["stunnedForGameTicks"] === 0
        ) {
          cordType = 0;
        }
      }
    }

    if (order[cordType] > bestCordType) {
      bestCord = cord;
      bestCordType = cordType;
    }
  });

  return bestCord;
};

// Iterates through A* path and returns best action for myCord to goal.
const selectAction = (mapUtils, nodeDetails, goal, myCord) => {
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

  let newGoal = null;
  newGoal = pathArr[pathArr.length - 1];

  // We only stay still once in a row
  if (!hasStayed) {
    let cordsArr = new Array();
    cordsArr.push(new Coordinate(newGoal.c, newGoal.r));
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
let finalF = Infinity; // A*

// Used for each direction (up, left, down, right) in A*
const aStarUtil = (mapUtils, co, goal, r, c) => {
  if (mapUtils.isTileAvailableForMovementTo(co)) {
    const gNew = nodeDetails[r][c].g + 1;
    const hNew = co.manhattanDistanceTo(goal);
    const fNew = gNew + hNew;
    const tType = getTileType(co, mapUtils, BOT_NAME);
    const thisColorable = tType === 3 || tType === 5 ? 1 : 0;
    const colorableNew = nodeDetails[r][c].colorable + thisColorable;
    if (fNew > finalF) return;
    if (areCordsSame(co, goal)) {
      // Reached goal.
      if (fNew < finalF) {
        nodeDetails[co.y][co.x].parentR = r;
        nodeDetails[co.y][co.x].parentC = c;
        finalF = fNew;
      } else if (fNew === finalF) {
        if (colorableNew > nodeDetails[co.y][co.x].colorable) {
          nodeDetails[co.y][co.x].parentR = r;
          nodeDetails[co.y][co.x].parentC = c;
          nodeDetails[co.y][co.x].colorable = colorableNew;
        }
      }
    } else {
      if (nodeDetails[co.y][co.x].f > fNew) {
        // If new OR cheaper path
        openList.push({ f: fNew, r: co.y, c: co.x });
        nodeDetails[co.y][co.x].f = fNew;
        nodeDetails[co.y][co.x].g = gNew;
        nodeDetails[co.y][co.x].h = hNew;
        nodeDetails[co.y][co.x].colorable = colorableNew;
        nodeDetails[co.y][co.x].parentR = r;
        nodeDetails[co.y][co.x].parentC = c;
      } else if (nodeDetails[co.y][co.x].f == fNew) {

        // Additional path of same cost but more colorable tiles
        if (colorableNew > nodeDetails[co.y][co.x].colorable) {
          nodeDetails[co.y][co.x].parentR = r;
          nodeDetails[co.y][co.x].parentC = c;
          nodeDetails[co.y][co.x].colorable = colorableNew;
          // Might need to add to openList here.
        }
      }
    }
  }
};

/* Modified A* algorithm, uses manhattan dist as heuristic.
   Finds path from start(Cord) to goal(Cord)*/
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
  nodeDetails[r][c].parentR = r;
  nodeDetails[r][c].parentC = c;

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

const getTileInQuadrant = (mapUtils, bestQuadrant) => {
  const h = mapUtils.map["height"];
  const w = mapUtils.map["width"];
  let goalCord = new Coordinate(Math.floor(w / 4), Math.floor(h / 4));

  // Place cord in center of correct quadrant.
  if (bestQuadrant == "q2") {
    goalCord.x += Math.floor(w / 2);
  } else if (bestQuadrant == "q3") {
    goalCord.y += Math.floor(h / 2);
  } else if (bestQuadrant == "q4") {
    goalCord.x += Math.floor(w / 2);
    goalCord.y += Math.floor(h / 2);
  }

  let tType = getTileType(goalCord, mapUtils, BOT_NAME);
  while (tType !== 3 && tType !== 5) {
    goalCord.x += 1;
    tType = getTileType(goalCord, mapUtils, BOT_NAME);

    // Choose another quadrant if no available tiles.
    if (mapUtils.isCoordinateOutOfBounds(goalCord)) {
      const quadrants = ["q1", "q2", "q3", "q4"];
      const randomIndex = Math.floor(Math.random() * quadrants.length);
      return getTileInQuadrant(mapUtils, quadrants[randomIndex]);
    }
  }
  return goalCord;
};

// Returns a cord in the least inhabited quadrant.
// Used when there is no power-up
/*  
    Q1   |   Q2
         |
  ----------------
         |
    Q3   |   Q4
*/
const getLeastInhabited = (mapUtils, myCord) => {
  const h = mapUtils.map["height"];
  const w = mapUtils.map["width"];
  let qCount = { q1: 0, q2: 0, q3: 0, q4: 0 };

  for (let player of mapUtils.characterInfoMap.values()) {
    if (player["name"] !== BOT_NAME) {
      const playerCord = mapUtils.convertPositionToCoordinate(
        player["position"]
      );

      // Locate which quadrant player is located in
      if (playerCord.x < w / 2 && playerCord.y < h / 2) {
        qCount.q1 += 1;
      } else if (playerCord.x > w / 2 && playerCord.y < h / 2) {
        qCount.q2 += 1;
      } else if (playerCord.x < w / 2 && playerCord.y > h / 2) {
        qCount.q3 += 1;
      } else if (playerCord.x > w / 2 && playerCord.y > h / 2) {
        qCount.q4 += 1;
      }
    }
  }

  let leastVisitors = Infinity;
  let bestQuadrant = null;

  for (const [k, v] of Object.entries(qCount)) {
    if (v < leastVisitors) {
      bestQuadrant = k;
      leastVisitors = v;
    }
  }

  const goal = getTileInQuadrant(mapUtils, bestQuadrant);
  return goal;
};

// Returns # of paintable tiles within boom range
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
  } else if (ticksLeft <= 2) {
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

  let goal = closestPowerCord(
    mapUtils.getCoordinatesContainingPowerUps(),
    myCord
  );

  if (goal === -1) {
    // No powerup, go towards least inhabited quadrant
    goal = getLeastInhabited(mapUtils, myCord);
  }

  const action = aStar(mapUtils, myCord, goal);

  if (myCharacter.carryingPowerUp) {
    if (isGoodTimeToExplode(mapUtils, myCord, action)) {
      return Action.Explode;
    }
  }

  // Makes sure we only stay still once.
  if (action === Action.Stay) {
    hasStayed = true;
  } else {
    hasStayed = false;
  }

  return action;
}

// This handler is optional
export function onMessage(message) {
  switch (message.type) {
    case MessageType.GameStarting:
      // Reset bot state here
      break;
    case MessageType.GameResult:
      // Logs results.
      /* message["playerRanks"].forEach((player) => {
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
      }); */
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
