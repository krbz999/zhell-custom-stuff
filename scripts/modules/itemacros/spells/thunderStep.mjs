import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function THUNDER_STEP(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.WG)) return item.use();
  const vanish = "jb2a.thunderwave.center.blue";
  const appear = "jb2a.thunderwave.center.blue";
  const distance = 90;

  const use = await item.use();
  if (!use) return;

  return ItemMacroHelpers._teleportationHelper({item, actor, token, vanish, appear, distance});
}
