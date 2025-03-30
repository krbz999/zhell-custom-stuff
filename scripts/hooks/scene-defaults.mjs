/**
 * Change the defaults of newly created scenes.
 * @param {Scene} scene         The scene document to be created.
 * @param {object} sceneData    The data object used to create the scene.
 */
export default function sceneDefaults(scene, sceneData) {
  const data = foundry.utils.mergeObject({
    grid: { type: 2, alpha: 0.1 },
    padding: 0.05,
    fog: { exploration: false },
    environment: { globalLight: { enabled: true } },
    backgroundColor: "#000000",
  }, sceneData);
  scene.updateSource(data);
}
