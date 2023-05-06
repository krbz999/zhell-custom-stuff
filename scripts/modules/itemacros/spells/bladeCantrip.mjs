import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function BLADE_CANTRIP(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM)) return item.use();

  const use = await item.use();
  if (!use) return;

  const {formula, type} = ItemMacroHelpers._bladeCantripDamageBonus(item);
  const effectData = [{
    icon: item.img,
    name: item.name,
    changes: [{key: "system.bonuses.mwak.damage", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${formula}[${type}]`}],
    statuses: [item.name.slugify({strict: true})],
    description: `You deal ${formula} additional ${type} damage on your next damage roll.`,
    "flags.visual-active-effects.data.content": item.system.description.value,
    "flags.effectmacro": {
      "dnd5e.rollDamage.script": "return effect.delete();",
      "onCombatEnd.script": "return effect.delete();"
    }
  }];
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}
