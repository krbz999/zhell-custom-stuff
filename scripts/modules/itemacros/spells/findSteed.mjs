import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

/**
 * Item Macro for the 'Find Steed' spell. Currently supports only Drazvik.
 */
export async function FIND_STEED(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG)) return item.use();

  const isDrazvik = actor.name.includes("Draz");
  if (isDrazvik) {
    const isSpawned = canvas.scene.tokens.find(t => t.actor?.flags.world?.findSteed === actor.id);
    if (isSpawned) return ui.notifications.warn("You already have Dreg spawned.");
    const use = await item.use();
    if (!use) return;
    const update = {actor: {"flags.world.findSteed": actor.id}};
    const options = {crosshairs: {interval: 1}};
    await actor.sheet?.minimize();
    await ItemMacroHelpers._spawnHelper("Dreg", update, {}, options);
    await actor.sheet?.maximize();
  }
}
