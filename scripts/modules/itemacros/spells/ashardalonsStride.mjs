import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

/**
 * Item Macro for the 'Ashardalon's Stride' spell. Simply updates the concentration effect
 * to grant the movement speed increase to any movement values that are already greater than 0ft.
 */
export async function ASHARDALONS_STRIDE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.VAE, DEPEND.CN)) return item.use();

  const use = await item.use();
  if (!use) return;

  const conc = await CN.waitForConcentrationStart(actor, {item});
  const value = conc.flags[DEPEND.CN].data.castData.castLevel * 5 + 5
  const mode = CONST.ACTIVE_EFFECT_MODES.ADD;

  const changes = Object.keys(CONFIG.DND5E.movementTypes).reduce((acc, type) => {
    const feet = actor.system.attributes.movement[type];
    if (feet > 0) acc.push({key: `system.attributes.movement.${type}`, mode, value});
    return acc;
  }, []);
  return conc.update({changes});
}
