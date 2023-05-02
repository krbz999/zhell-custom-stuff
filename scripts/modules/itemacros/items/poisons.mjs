import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const poisons = {INJURY_POISON};

/**
 * Create an effect with a babonus to apply poison damage to an item's damage roll.
 * It must be one specific item, and that item must be one that deals piercing or
 * slashing damage, and it has to be an object.
 */
async function INJURY_POISON(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB)) return item.use();

  const options = actor.items.reduce((acc, item) => {
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
    content,
    label: "Poison",
    rejectClose: false,
    callback: (html) => html[0].querySelector("select").value
  });
  if (!id) return;

  const poisonItem = actor.items.get(id);
  const roll = new Roll(item.system.damage.parts[0][0])
  for (const term of roll.terms) if (term instanceof Die) term.options.flavor = "poison";
  const formula = Roll.fromTerms(roll.terms).formula;
  const babData = babonus.createBabonus({
    name: `Poisoned Item (${poisonItem.name})`,
    type: "damage",
    description: "<p>You have poisoned this item. It will apply additional damage on the first hit you make with it.</p>",
    bonuses: {bonus: formula},
    optional: true,
    consume: {
      enabled: true,
      scales: false,
      type: "effect"
    },
    aura: {enabled: false},
    filters: {
      damageTypes: ["piercing", "slashing"],
      customScripts: `return item?.id === "${id}";`
    }
  }).toObject();

  const use = await item.use({}, {configureDialog: false});
  if (!use) return;

  return actor.createEmbeddedDocuments("ActiveEffect", [{
    name: babData.name,
    icon: item.img,
    description: `You have poisoned ${poisonItem.name}. It will deal additional poison damage when dealing piercing or slashing damage.`,
    statuses: [`injury-poison-${poisonItem.id}`],
    "flags.visual-active-effects.data.content": item.system.description.value,
    "flags.babonus.bonuses": {[babData.id]: babData}
  }]);
}
