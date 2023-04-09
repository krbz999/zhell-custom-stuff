export async function carousing({
  folderId = "v0ikCyAle4wCJBFk",
  tableName = "Carousing",
  catalogName = "rolltables"
} = {}) {
  const table = await ZHELL.utils.getDocument(tableName, catalogName, false);
  const players = game.actors.filter(a => a.folder?.id === folderId);
  const combinedLevel = players.reduce((acc, a) => acc + (a.system.details.level || 0), 0);
  const partyLevel = Math.floor(combinedLevel / players.length);
  const roll = new Roll("1d100 + @level", {level: partyLevel});
  const rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  return table.draw({roll, rollMode});
}
