export async function wallFixer() {
  let updates;
  if (!event.shiftKey) {
    const { BOTH, LEFT, RIGHT } = CONST.WALL_DIRECTIONS;
    const obj = { [BOTH]: LEFT, [LEFT]: RIGHT, [RIGHT]: BOTH };
    updates = canvas.walls.controlled.map(i => {
      return { _id: i.id, dir: obj[i.document.dir] };
    });
  } else {
    const { NONE, NORMAL } = CONST.WALL_MOVEMENT_TYPES;
    updates = canvas.walls.controlled.map(i => {
      const move = i.document.move === NONE ? NORMAL : NONE;
      return { _id: i.id, move };
    });
  }
  return canvas.scene.updateEmbeddedDocuments("Wall", updates);
}
