import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function FAR_STEP(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.WG, DEPEND.CN)) return item.use();
  const vanish = "jb2a.misty_step.01.purple";
  const appear = "jb2a.misty_step.02.purple";
  const distance = 60;

  const conc = CN.isActorConcentratingOnItem(actor, item);

  if (!conc) {
    const use = await item.use();
    if (!use) return;
  }

  return ItemMacroHelpers._teleportationHelper({item, actor, token, vanish, appear, distance});
}
