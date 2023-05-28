import {DEPEND} from "../../../const.mjs";
import {elementalDialog} from "../../customDialogs.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function ABSORB_ELEMENTS(item, speaker, actor, token, character, event, args) {
  const type = await elementalDialog({
    types: ["acid", "cold", "fire", "lightning", "thunder"],
    content: "Choose the damage type.",
    title: item.name
  });
  if (!type) return;

  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const mode = CONST.ACTIVE_EFFECT_MODES.ADD;
  const value = `+${level}d6[${type}]`;
  const effectData = [{
    changes: [
      {key: "system.traits.dr.value", mode, value: type},
      {key: "system.bonuses.mwak.damage", mode, value},
      {key: "system.bonuses.msak.damage", mode, value}
    ],
    icon: item.img,
    name: item.name,
    origin: item.uuid,
    duration: {rounds: 1},
    statuses: [item.name.slugify({strict: true})],
    description: game.i18n.format("ZHELL.DescriptionAbsorbElements", {type, level}),
    [`flags.${DEPEND.VAE}.data.content`]: item.system.description.value
  }];
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}
