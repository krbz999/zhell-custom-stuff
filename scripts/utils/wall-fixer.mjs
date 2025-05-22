export default async function wallFixer({ cycleDirection = false, cycleMovementType = true } = {}) {
  const { BOTH, LEFT, RIGHT } = CONST.WALL_DIRECTIONS;
  const { NONE, NORMAL } = CONST.WALL_MOVEMENT_TYPES;

  const updates = [];

  for (const wall of canvas.walls.controlled) {
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
    updates.push(update);
  }

  return canvas.scene.updateEmbeddedDocuments("Wall", updates);
}
