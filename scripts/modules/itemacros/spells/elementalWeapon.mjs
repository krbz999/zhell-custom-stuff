import {DEPEND} from "../../../const.mjs";
import {elementalDialog} from "../../customDialogs.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function ELEMENTAL_WEAPON(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB, DEPEND.VAE, DEPEND.CN)) return item.use();

  const has = actor.effects.find(e => e.statuses.has(item.name.slugify({strict: true})));
  if (has) {
    await CN.isActorConcentratingOnItem(actor, item)?.delete();
    return has.delete();
  }

  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const bonus = Math.min(3, Math.floor((level - 1) / 2));
  const dice = `${bonus}d4`;

  const type = await elementalDialog({types: ["acid", "cold", "fire", "lightning", "thunder"], title: item.name});

  const options = actor.itemTypes.weapon.reduce((acc, e) => {
    return acc + `<option value="${e.id}">${e.name}</option>`;
  }, "");
  const weaponId = await Dialog.prompt({
    content: ItemMacroHelpers._basicFormContent({label: "Choose Weapon:", options, type: "select"}),
    rejectClose: false,
    title: item.name,
    callback: (html) => html[0].querySelector("select").value,
    label: "Enhance"
  });
  const weapon = actor.items.get(weaponId);

  const atk = babonus.createBabonus({
    type: "attack", name: "atk", bonuses: {bonus}, description: item.system.description.value,
    filters: {customScripts: `return item.id === "${weaponId}";`}
  }).toObject();
  const dmg = api.createBabonus({
    type: "damage", name: "dmg", bonuses: {bonus: `${dice}[${type}]`}, description: item.system.description.value,
    filters: {customScripts: `return item.id === "${weaponId}";`}
  }).toObject();

  const conc = CN.isActorConcentratingOnItem(actor, item);

  const effectData = [{
    icon: item.img,
    name: `${item.name} (${weapon.name})`,
    duration: foundry.utils.deepClone(conc.duration),
    statuses: [item.name.slugify({strict: true})],
    description: `You have a +${bonus} to attack rolls made with the chosen weapon (${weapon.name}) and it deals an additional ${dice} ${type} damage on a hit.`,
    "flags.babonus.bonuses": {[atk.id]: atk, [dmg.id]: dmg}
  }];

  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}
