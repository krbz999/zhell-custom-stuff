import {elementalDialog} from "../../customDialogs.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function ABSORB_ELEMENTS(item, speaker, actor, token, character, event, args) {
  const type = await elementalDialog({
    types: ["acid", "cold", "fire", "lightning", "thunder"],
    content: "Choose the damage type.",
    title: item.name
  });
  if (!type) return;

  return resolve(type);

  async function resolve(s) {
    const use = await item.use();
    if (!use) return;
    const level = ItemMacroHelpers._getSpellLevel(use);

    const mode = CONST.ACTIVE_EFFECT_MODES.ADD;
    const value = `+${level}d6[${s}]`;
    const effectData = [{
      changes: [
        {key: "system.traits.dr.value", mode, value: s},
        {key: "system.bonuses.mwak.damage", mode, value},
        {key: "system.bonuses.msak.damage", mode, value}
      ],
      icon: item.img,
      label: item.name,
      origin: item.uuid,
      duration: {rounds: 1},
      "flags.core.statusId": item.name.slugify({strict: true}),
      "flags.visual-active-effects.data": {
        intro: `<p>You have ${s} resistance and deal ${level}d6 additional ${s} damage on your first melee attack before this effect expires.</p>`,
        content: item.system.description.value
      }
    }];
    return actor.createEmbeddedDocuments("ActiveEffect", effectData);
  }
}
