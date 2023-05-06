import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function FATHOMLESS_EVARDS_BLACK_TENTACLES(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN)) return item.use();

  const use = await item.use();
  if (!use) return;

  const effect = await CN.waitForConcentrationStart(actor, {item});
  await effect.setFlag(DEPEND.CN, "data.castData.unbreakable", true);
  return actor.applyTempHP(actor.classes.warlock.system.levels);
}
