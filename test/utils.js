import assert from 'assert';
import { Action, Coordinate } from '../src/utils.js';

describe('Direction', () => {
  it('has the correct directions', () => {
    assert.strictEqual(Action.Up, 'UP');
    assert.strictEqual(Action.Down, 'DOWN');
    assert.strictEqual(Action.Left, 'LEFT');
    assert.strictEqual(Action.Right, 'RIGHT');
  });
});

describe('Coordinate', () => {
  it('creates a coordinate object from x and y', () => {
    const x = 1;
    const y = 2;

    const coordinate = new Coordinate(x, y);

    assert.strictEqual(coordinate.x, x);
    assert.strictEqual(coordinate.y, y);
  });

  it('translates the coordinate by delta', () => {
    const x = 1;
    const y = 2;

    const coordinate = new Coordinate(x, -y);

    // @ts-expect-error
    assert.throws(() => coordinate.translateByDelta(undefined));

    const translatedCoordinate = coordinate.translateByDelta({ x, y });

    assert.notStrictEqual(translatedCoordinate, coordinate);
    assert.strictEqual(translatedCoordinate.x, 2 * x);
    assert.strictEqual(translatedCoordinate.y, 0);
  });

  it('translates the coordinate by direction', () => {
    const coordinate = new Coordinate(0, 0);

    // @ts-expect-error
    assert.throws(() => coordinate.translateByAction(undefined));

    assert.deepStrictEqual(coordinate.translateByAction(Action.Up), new Coordinate(0, -1));
    assert.deepStrictEqual(coordinate.translateByAction(Action.Down), new Coordinate(0, 1));
    assert.deepStrictEqual(coordinate.translateByAction(Action.Left), new Coordinate(-1, 0));
    assert.deepStrictEqual(coordinate.translateByAction(Action.Right), new Coordinate(1, 0));
  });

  it('computes the manhattan distance', () => {
    const coordinateA = new Coordinate(0, 0);
    const coordinateB = new Coordinate(3, 4);

    assert.strictEqual(coordinateA.manhattanDistanceTo(coordinateB), 7);
  });
});
