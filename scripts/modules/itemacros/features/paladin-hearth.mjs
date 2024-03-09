import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const hearth = {BURNING_WEAPON};

async function BURNING_WEAPON(item) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB)) return item.use();

  const status = item.name.slugify({strict: true});
  const effect = item.actor.effects.find(e => e.statuses.has(status));
  if (effect) return effect.delete();

  const weapons = item.actor.items.filter(i => (i.type === "weapon") && i.system.equipped);
  if (!weapons.length) {
    ui.notifications.warn("You have no equipped weapons.");
    return;
  }

  const resourceItem = item.actor.items.get(item.system.consume.target);
  const resource = resourceItem.system.uses.value;
  if (!resource) {
    ui.notifications.warn("You have no uses left of Channel Divinity.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  // exactly one weapon
  if (weapons.length === 1) return createEffect(weapons[0].id);

  // multiple weapons
  const weaponSelect = weapons.reduce((acc, {id, name}) => {
    return acc + `<option value="${id}">${name}</option>`;
  }, "");
  const content = ItemMacroHelpers._basicFormContent({label: "Weapon:", type: "select", options: weaponSelect});

  return Dialog.prompt({
    title: item.name,
    content: content,
    rejectClose: false,
    label: "Flame On!",
    callback: ([html]) => {
      const id = html.querySelector("select").value;
      return createEffect(id);
    }
  });

  async function createEffect(id) {
    const data = babonus.createBabonus({
      type: "damage",
      name: item.name,
      description: item.system.description.value,
      bonuses: {bonus: "@abilities.cha.mod", damageType: "fire"},
      filters: {customScripts: `return item.id === "${id}";`}
    }).toObject();
    return ActiveEffect.implementation.create({
      name: item.name,
      statuses: [status],
      img: item.img,
      flags: {[`${DEPEND.BAB}.bonuses.${data.id}`]: data}
    }, {parent: item.actor});
  }
}
