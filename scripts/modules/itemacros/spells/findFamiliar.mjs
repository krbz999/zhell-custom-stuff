import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

/**
 * Item Macro for the 'Find Familiar' spell.
 * Currently supports only Devinn (Alyk) and Drazvik (Vrax).
 */
export async function FIND_FAMILIAR(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG)) return item.use();

  const isDevinn = actor.name.includes("Devinn") && "Alyk";
  const isDrazvik = actor.name.includes("Draz") && "Vrax";

  const isSpawned = canvas.scene.tokens.find(t => t.actor?.flags.world?.findFamiliar === actor.id);
  if (isSpawned) return ui.notifications.warn(`You already have ${isDevinn || isDrazvik} spawned.`);

  const use = await item.use();
  if (!use) return;

  const name = isDevinn || isDrazvik || "dummy";
  const update = {actor: {"flags.world.findFamiliar": actor.id}};
  const options = {crosshairs: {interval: 1}};
  await actor.sheet?.minimize();
  await ItemMacroHelpers._spawnHelper(name, update, {}, options);
  await actor.sheet?.maximize();
}
