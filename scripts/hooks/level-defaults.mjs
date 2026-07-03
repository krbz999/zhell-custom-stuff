/**
 * Change the defaults of newly created scenes.
 * @param {foundry.documents.Level} level
 * @param {object} data
 */
export default function levelDefaults(level, data) {
  const update = foundry.utils.mergeObject(
    { background: { color: "#000000" } },
    data,
    { insertKeys: false, insertValues: false},
  );
  level.updateSource(update);
}
