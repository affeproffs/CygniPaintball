/**
 * @typedef {{ type: TileType, character?: CharacterInfo }} Tile
 * @typedef {{ position: number, colliders: string[] }} CollisionInfo
 * @typedef {{ position: number, exploders: string[] }} ExplosionInfo
 * @typedef {{ id: string, name: string, position: number, "colouredPositions": number[], "stunnedForGameTicks": number, "carryingPowerUp": boolean }} CharacterInfo
 * @typedef {{ width: number, height: number, worldTick: number, powerUpPositions: number[], obstaclePositions: number[], characterInfos: CharacterInfo[], collisionInfos: CollisionInfo[], explosionInfos: ExplosionInfo[] }} PaintbotMap
 * @typedef {{ gameTick: number, gameId: string,map: PaintbotMap, receivingPlayerId: string }} MapUpdateEvent
 *
 */

/** @enum {symbol} */
export const TileType = Object.freeze({
  Empty: Symbol('Empty'),
  PowerUp: Symbol('PowerUp'),
  Obstacle: Symbol('Obstacle'),
  Character: Symbol('Character'),
});

const emptyTile = Object.freeze({ type: TileType.Empty });
const powerUpTile = Object.freeze({ type: TileType.PowerUp });
const obstactleTile = Object.freeze({ type: TileType.Obstacle });

/** @param {CharacterInfo} character */
const createCharacterTile = (character) => Object.freeze({ type: TileType.Character, character });

/** @enum {string} */
export const Action = Object.freeze({
  Up: 'UP',
  Down: 'DOWN',
  Left: 'LEFT',
  Right: 'RIGHT',
  Stay: 'STAY',
  Explode: 'EXPLODE',
});

const actionDeltas = Object.freeze({
  [Action.Up]: { x: 0, y: -1 },
  [Action.Down]: { x: 0, y: 1 },
  [Action.Left]: { x: -1, y: 0 },
  [Action.Right]: { x: 1, y: 0 },
  [Action.Stay]: { x: 0, y: 0 },
  [Action.Explode]: { x: 0, y: 0 },
});

/** @enum {string} */
export const GameMode = Object.freeze({
  Training: 'TRAINING',
  Tournament: 'TOURNAMENT',
});

export function noop() {
  // Nothing to see here
}

export class Coordinate {
  /**
   * @param {number} position
   * @param {number} mapWidth
   * @returns {Coordinate}
   */
  static fromPosition(position, mapWidth) {
    const x = position % mapWidth;
    const y = (position - x) / mapWidth;
    return new Coordinate(x, y);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Coordinate} otherCoordinate
   * @returns {number}
   */
  manhattanDistanceTo(otherCoordinate) {
    const { x: x0, y: y0 } = this;
    const { x: x1, y: y1 } = otherCoordinate;
    return Math.abs(x1 - x0) + Math.abs(y1 - y0);
  }

  /**
   * Returns a new coordinate translated by the provided delta
   * @param {{ x: number, y: number }} delta
   * @returns {Coordinate}
   */
  translateByDelta(delta) {
    const { x, y } = this;
    const { x: dx, y: dy } = delta;
    return new Coordinate(x + dx, y + dy);
  }

  /**
   * Returns a new coordinate translated by the provided action
   * @param {Action} action
   * @returns {Coordinate}
   */
  translateByAction(action) {
    const actionDelta = actionDeltas[action];

    if (action === undefined) {
      throw new TypeError(`The action "${action}" is invalid`);
    }

    return this.translateByDelta(actionDelta);
  }

  /**
   * Convert this Coordinate to an integer position
   * @param {number} mapWidth
   * @returns {number}
   */
  toPosition(mapWidth) {
    const { x, y } = this;
    return x + y * mapWidth;
  }
}

export class MapUtility {
  /**
   * @param {PaintbotMap} map
   * @param {string} playerId
   */
  constructor(map, playerId) {
    this.map = map;
    this.playerId = playerId;

    /** @type {Map<string, CharacterInfo>} */
    this.characterInfoMap = new Map();

    /** @type {Map<number, Tile>} */
    this.positionToTiles = new Map();

    for (const p of this.map.powerUpPositions) {
      this.positionToTiles.set(p, powerUpTile);
    }

    for (const p of map.obstaclePositions) {
      this.positionToTiles.set(p, obstactleTile);
    }

    for (const ci of map.characterInfos) {
      this.characterInfoMap.set(ci.id, ci);
      this.positionToTiles.set(ci.position, createCharacterTile(ci));
    }
  }

  get mapSize() {
    const { width, height } = this.map;
    return width * height;
  }

  /**
   * Converts a position in the flattened single array representation
   * of the Map to a Coordinate.
   * @param {number} position
   * @returns {Coordinate} Coordinate
   */
  convertPositionToCoordinate(position) {
    const y = Math.floor(position / this.map.width);
    const x = position - y * this.map.width;
    return new Coordinate(x, y);
  }

  /**
   * Converts a list of positions in array format to list of coordinates.
   * @param {readonly number[]} positions
   */
  convertPositionsToCoordinates(positions) {
    return positions.map(this.convertPositionToCoordinate, this);
  }

  /**
   * Converts a Coordinate to the same position in the flattened
   * single array representation of the Map.
   * @param {Coordinate} coordinate
   * @returns {number} position
   */
  convertCoordinateToPosition(coordinate) {
    if (this.isCoordinateOutOfBounds(coordinate)) {
      throw new RangeError(`Coordinate [${coordinate.x},${coordinate.y}] is out of bounds`);
    }

    return coordinate.x + coordinate.y * this.map.width;
  }

  /**
   * Converts a list of coordinates to position array format
   * @param {readonly Coordinate[]} coordinates
   * @returns {number[]} position list of converted positions
   */
  convertCoordinatesToPositions(coordinates) {
    return coordinates.map(this.convertCoordinateToPosition, this);
  }

  /**
   * @returns {Coordinate} player's coordinate
   */
  getMyCoordinate() {
    const { position } = this.getMyCharacterInfo();
    return this.convertPositionToCoordinate(position);
  }

  /**
   * @returns {CharacterInfo} player's CharacterInfo
   */
  getMyCharacterInfo() {
    const characterInfo = this.characterInfoMap.get(this.playerId);
    if (characterInfo === undefined) {
      throw new Error('My character info is missing');
    }
    return characterInfo;
  }

  /**
   *
   * @param {string} playerId the id of the player too look up
   * @returns {CharacterInfo | undefined} the character info or undefined
   */
  getCharacterInfoOf(playerId) {
    return this.characterInfoMap.get(playerId);
  }

  /**
   * Returns an array of coordinates painted in the provided player's colour.
   * @param {string} playerId
   * @returns {Coordinate[] | undefined}
   */
  getPlayerColouredCoordinates(playerId) {
    const characterInfo = this.characterInfoMap.get(playerId);
    if (characterInfo === undefined) {
      return undefined;
    }
    return this.convertPositionsToCoordinates(characterInfo.colouredPositions);
  }

  /**
   * @returns {Coordinate[]} an array containing all Coordinates where there's Power ups
   */
  getCoordinatesContainingPowerUps() {
    return this.convertPositionsToCoordinates(this.map.powerUpPositions);
  }

  /**
   * @returns {Coordinate[]} an array containing all Coordinates where there's an Obstacle
   */
  getCoordinatesContainingObstacle() {
    return this.convertPositionsToCoordinates(this.map.obstaclePositions);
  }

  /**
   * Checks if it's possible to move in the action specified
   * @param {Action} action
   * @returns {boolean} if action is available for movement
   */
  canIMoveInDirection(action) {
    try {
      const myPos = this.getMyCoordinate();
      const myNewPos = myPos.translateByAction(action);
      return this.isTileAvailableForMovementTo(myNewPos);
    } catch (e) {
      return false;
    }
  }

  /**
   *
   * @param {Coordinate} coordinate
   * @returns {boolean} whether or not it is out of bounds
   */
  isCoordinateOutOfBounds(coordinate) {
    return coordinate.x < 0 || coordinate.x >= this.map.width || coordinate.y < 0 || coordinate.y >= this.map.height;
  }

  /**
   *
   * @param {number} position
   * @returns {boolean} whether or not it is out of bounds
   */
  isPositionOutOfBounds(position) {
    return position < 0 || position >= this.mapSize;
  }

  /**
   *
   * @param {Coordinate} coordinate
   * @returns true if the TileContent at coordinate is Empty or contains Power Up
   */
  isTileAvailableForMovementTo(coordinate) {
    if (this.isCoordinateOutOfBounds(coordinate)) {
      return false;
    }

    const position = this.convertCoordinateToPosition(coordinate);
    return this.isTilePositionAvailableForMovementTo(position);
  }

  /**
   *
   * @param {number} position
   * @returns {boolean} true if the TileContent at position is Empty or contains Power Up
   */
  isTilePositionAvailableForMovementTo(position) {
    if (this.isPositionOutOfBounds(position)) {
      return false;
    }

    const tile = this.positionToTiles.get(position);

    return tile == null || tile.type === TileType.Empty || tile.type === TileType.PowerUp;
  }

  /**
   * @param {number} position
   * @returns {Tile} the TileContent at the specified position of the flattened map.
   */
  getTileAt(position) {
    if (this.isPositionOutOfBounds(position)) {
      throw new RangeError(`Position [${position}] is out of bounds`);
    }

    return this.positionToTiles.get(position) ?? emptyTile;
  }

  /**
   *
   * @param {number} position
   * @returns {Tile | undefined}
   */
  getCharacterTile(position) {
    const playerId = this.getPlayerIdAtPosition(position);
    const characterInfo = this.characterInfoMap.get(playerId);
    if (characterInfo === undefined) {
      return undefined;
    }
    return createCharacterTile(characterInfo);
  }

  getPlayerIdAtPosition(position) {
    const tile = this.getTileAt(position);
    if (tile.type === TileType.Character) {
      // @ts-expect-error
      return tile.character.id;
    }
    throw new Error(`No paintbot at position: ${position}`);
  }
}
