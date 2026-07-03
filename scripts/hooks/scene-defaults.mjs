/**
 * Change the defaults of newly created scenes.
 * @param {Scene} scene         The scene document to be created.
 * @param {object} sceneData    The data object used to create the scene.
 */
export default function sceneDefaults(scene, sceneData) {
  const update = foundry.utils.mergeObject({
    padding: 0.05,
    grid: { alpha: 0.1, type: CONST.GRID_TYPES.HEXODDR },
    fog: { mode: CONST.FOG_EXPLORATION_MODES.SHARED },
    environment: { globalLight: { enabled: true } },
  }, sceneData, { insertKeys: false, insertValues: false });
  scene.updateSource(update);

  scene.levels.forEach(level => {
    const update = foundry.utils.mergeObject(
      { background: { color: "#000000" } },
      sceneData.levels?.find(l => l._id === level.id) ?? {},
      { insertKeys: false, insertValues: false},
    );
    level.updateSource(update);
  });
}
