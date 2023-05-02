import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function SHIELD(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM)) return item.use();

  const use = await item.use();
  if (!use) return;

  return actor.createEmbeddedDocuments("ActiveEffect", [{
    changes: [{key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 5}],
    icon: item.img,
    name: item.name,
    origin: item.uuid,
    duration: {rounds: 1},
    statuses: [item.name.slugify({strict: true})],
    description: "You have a +5 bonus to your AC and immunity to damage from the Magic Missile spell.",
    "flags.visual-active-effects.data.content": item.system.description.value,
    "flags.effectmacro.onTurnStart.script": `(${function() {return effect.delete();}})()`
  }]);
}
