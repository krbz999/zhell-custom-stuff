import {DEPEND, MODULE} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function CROWN_OF_STARS(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (!isConc) {
    const use = await item.use();
    if (!use) return;

    const conc = await CN.waitForConcentrationStart(actor, {item});
    if (!conc) return;

    const level = ItemMacroHelpers._getSpellLevel(use);
    const motes = 2 * level - 7;
    return conc.setFlag(MODULE, "crownStars", motes);
  }

  const motes = isConc.flags[MODULE].crownStars;
  if (motes < 1) return isConc.delete();
  await CN.redisplayCard(actor);
  return ((motes - 1) === 0) ? isConc.delete() : isConc.setFlag(MODULE, "crownStars", motes - 1);
}
