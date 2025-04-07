/**
 * Roll on the carousing table.
 * @returns {Promise<object>}   The object with the roll and drawn results.
 */
export default async function carousing() {
  const pack = game.packs.get("zhell-catalogs.rolltables");
  const table = await pack.getDocument(pack.index.getName("Carousing")._id);
  return table.draw({
    roll: foundry.dice.Roll.create("1d100 + @level", { level: ZHELL.utils.getAverageLevel() }),
    rollMode: CONST.DICE_ROLL_MODES.PRIVATE,
  });
}
