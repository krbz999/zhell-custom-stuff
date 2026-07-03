/**
 * Utility function for swapping wall configurations.
 * @param {object} [options={}]
 * @param {boolean} [options.cycleDirection=false]
 * @param {boolean} [options.cycleMovementType=true]
 * @returns {Promise<WallDocument[]>}
 */
export default async function wallFixer({ cycleDirection = false, cycleMovementType = true } = {}) {
  const { BOTH, LEFT, RIGHT } = CONST.EDGE_DIRECTIONS;
  const { NONE, NORMAL } = CONST.WALL_MOVEMENT_TYPES;

  const updates = canvas.walls.controlled.map(wall => {
    const update = { _id: wall.id };
    if (cycleDirection) {
      update.dir = (wall.document.dir === BOTH)
        ? LEFT
        : (wall.document.dir === LEFT)
          ? RIGHT
          : BOTH;
    }

    if (cycleMovementType) {
      update.move = (wall.document.move === NONE) ? NORMAL : NONE;
    }

    return update;
  });

  return canvas.scene.updateEmbeddedDocuments("Wall", updates);
}
