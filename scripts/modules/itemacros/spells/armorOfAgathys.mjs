import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function ARMOR_OF_AGATHYS(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  return actor.applyTempHP(5 * level);
}
