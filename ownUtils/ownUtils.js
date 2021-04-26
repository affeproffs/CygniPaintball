import { TileType } from "../src/index.js";

// Returns # of players withing 5x5 radius of player
export const getPlayersInProximity = (myCord, mapUtils, prox) => {
  let closePlayers = -1; // -1 due to counting ourselves once

  for (const char of mapUtils.characterInfoMap.values()) {
    const charCord = mapUtils.convertPositionToCoordinate(char["position"]);
    if (myCord.manhattanDistanceTo(charCord) <= prox) {
      closePlayers += 1;
    }
  }

  return closePlayers;
};

// Returns what type of tile is at cord
// Translation: 1(obstacle, player, oob), 2(powerup), 3(unpainted), 4(our color), 5(other color)
export const getTileType = (cord, mapUtils, botName) => {
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
          if (cinfo["name"] == botName) {
            type = 4;
          }
        }
      });
    }
  }
  return type;
};
