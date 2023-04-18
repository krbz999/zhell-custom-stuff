import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function CALL_LIGHTNING(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN, DEPEND.VAE)) return item.use();

  const concentrating = CN.isActorConcentratingOnItem(actor, item);
  if (!concentrating) {
    const use = await item.use();
    if (!use) return;
  }

  const template = dnd5e.canvas.AbilityTemplate.fromItem(item);
  template.document.updateSource({distance: 5});
  return template.drawPreview();
}
