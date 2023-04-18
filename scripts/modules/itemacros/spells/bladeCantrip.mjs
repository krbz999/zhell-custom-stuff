import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function BLADE_CANTRIP(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM)) return item.use();

  const use = await item.use();
  if (!use) return;

  const deleteMe = async function() {
    return effect.delete();
  }

  const {formula, type} = ItemMacroHelpers._bladeCantripDamageBonus(item);

  const effectData = [{
    icon: item.img,
    label: item.name,
    changes: [{key: "system.bonuses.mwak.damage", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${formula}[${type}]`}],
    "flags.core.statusId": item.name.slugify({strict: true}),
    "flags.visual-active-effects.data": {
      intro: `<p>You deal ${formula} additional ${type} damage on your next damage roll.</p>`,
      content: item.system.description.value
    },
    "flags.effectmacro": {
      "dnd5e.rollDamage.script": `(${deleteMe.toString()})()`,
      "onCombatEnd.script": `(${deleteMe.toString()})()`
    }
  }];
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}
