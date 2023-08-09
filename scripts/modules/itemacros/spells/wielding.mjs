import {DEPEND, MODULE} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function WIELDING(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN, DEPEND.VAE, DEPEND.EM)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return;

  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const target = game.user.targets.first();

  function getWeaponOptions(actorDoc) {
    if (!actorDoc) return "";
    const pre = (actorDoc === actor) ? "" : "[Target] ";
    return actorDoc.itemTypes.weapon.reduce((acc, e) => {
      return acc + `<option value="${e.uuid}">${pre}${e.name}</option>`;
    }, "") ?? "";
  }
  const options = getWeaponOptions(actor) + getWeaponOptions(target?.actor);
  const content = ItemMacroHelpers._basicFormContent({type: "select", options, label: "Choose weapon:"});

  const uuid = await Dialog.prompt({
    title: item.name,
    label: "Cast",
    rejectClose: false,
    content,
    callback: (html) => html[0].querySelector("select").value
  });
  if (!uuid) return CN.isActorConcentratingOnItem(actor, item)?.delete();

  const weapon = await fromUuid(uuid);
  const att = (weapon.system.attunement === 0) ? 0 : (level < 5) ? 1 : 2;
  const itemData = foundry.utils.mergeObject(weapon.toObject(), {
    "system.proficient": 1,
    "system.ability": actor.system.attributes.spellcasting,
    "system.equipped": true,
    "system.attunement": att
  });
  delete itemData.system.consume;
  delete itemData.system.uses;
  const conc = CN.isActorConcentratingOnItem(actor, item);
  await conc.createMacro("onDelete", function() {
    const id = effect.flags.world?.storedFlag;
    return actor.effects.get(id)?.delete();
  });

  const [{id}] = await actor.createEmbeddedDocuments("ActiveEffect", [{
    icon: itemData.img,
    name: `${itemData.name} (${item.name})`,
    statuses: [item.name.slugify({strict: true})],
    origin: actor.uuid,
    duration: foundry.utils.deepClone(conc.duration),
    description: `You are in control of ${itemData.name}.`,
    [`flags.${DEPEND.VAE}.data.content`]: itemData.system.description.value,
    [`flags.${MODULE}`]: {itemData, types: ["use"]}
  }]);

  return conc.setFlag("world", "storedFlag", id);
}
