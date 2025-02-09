/**
 * Roll on the carousing table.
 * @param {string} [tableName]        The name of the table to draw from.
 * @param {string} [catalogName]      The name of the compendium that contains the rolltable.
 * @returns {Promise<object>}         The object with the roll and drawn results.
 */
export default async function carousing({ tableName = "Carousing", catalogName = "rolltables" } = {}) {
  const table = await ZHELL.utils.getDocument(tableName, catalogName, false);
  return table.draw({
    roll: new Roll("1d100 + @level", { level: ZHELL.utils.getAverageLevel() }),
    rollMode: CONST.DICE_ROLL_MODES.PRIVATE,
  });
}
