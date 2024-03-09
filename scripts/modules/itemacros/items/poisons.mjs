import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const poisons = {INJURY_POISON};

/**
 * Create an effect with a babonus to apply poison damage to an item's damage roll.
 * It must be one specific item, and that item must be one that deals piercing or
 * slashing damage, and it has to be an object.
 */
async function INJURY_POISON(item) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB)) return item.use();

  const options = item.actor.items.reduce((acc, item) => {
    if (!["weapon", "equipment", "consumable"].includes(item.type)) return acc;
    const hasType = item.system.damage.parts.some(([formula, type]) => {
      return ["piercing", "slashing"].includes(type);
    });
    if (!hasType) return acc;
    return acc + `<option value="${item.id}">${item.name}</option>`;
  }, "");
  if (!options) {
    ui.notifications.warn("You have no items able to have this poison applied to them.");
    return null;
  }

  const content = ItemMacroHelpers._basicFormContent({label: "Item:", type: "select", options});

  const id = await Dialog.prompt({
    title: item.name,
    content: content,
    label: "Poison",
    rejectClose: false,
    callback: (html) => html[0].querySelector("select").value
  });
  if (!id) return;

  const poisonItem = item.actor.items.get(id);
  const [dvalue, dtype] = item.system.damage.parts[0];
  const babData = babonus.createBabonus({
    name: `Poisoned Item (${poisonItem.name})`,
    type: "damage",
    description: "<p>You have poisoned this item. It will apply additional damage on the first hit you make with it.</p>",
    bonuses: {bonus: dvalue, damageType: dtype},
    optional: true,
    consume: {enabled: true, type: "effect"},
    aura: {enabled: false},
    filters: {
      damageTypes: ["piercing", "slashing"],
      customScripts: `return item?.id === "${id}";`
    }
  }).toObject();

  const use = await item.use({}, {configureDialog: false});
  if (!use) return;

  return item.actor.createEmbeddedDocuments("ActiveEffect", [{
    name: babData.name,
    icon: item.img,
    description: `
    <p>You have poisoned ${poisonItem.name}. It will deal additional ${dtype} damage when dealing piercing or slashing damage.</p>
    <fieldset>
      <legend>${item.name}</legend>
      ${item.system.description.value}
    </fieldset>`,
    statuses: [`injury-poison-${poisonItem.id}`],
    flags: {[`flags.${DEPEND.BAB}.bonuses`]: {[babData.id]: babData}}
  }]);
}
