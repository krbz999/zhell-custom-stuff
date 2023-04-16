import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const hearth = {BURNING_WEAPON, WARMING_RESPITE};

async function BURNING_WEAPON(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM, DEPEND.BAB, DEPEND.VAE)) return item.use();

  const effect = actor.effects.find(e => e.flags.core?.statusId === item.name.slugify({strict: true}));
  if (effect) return effect.delete();

  const weapons = actor.items.filter(i => (i.type === "weapon") && i.system.equipped);
  if (!weapons.length) {
    ui.notifications.warn("You have no equipped weapons.");
    return;
  }

  const resourceItem = actor.items.get(item.system.consume.target);
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

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      go: {
        icon: "<i class='fa-solid fa-fire'></i>",
        label: "Flame On!",
        callback: (html) => {
          const id = html[0].querySelector("select").value;
          return createEffect(id);
        }
      }
    }
  }).render(true);

  async function createEffect(id) {
    const lightData = {
      bright: 20,
      dim: 40,
      color: "#e05d06",
      animation: {type: "torch", speed: 1}
    };
    const babonusData = babonus.createBabonus({
      type: "damage",
      name: item.name,
      description: item.system.description.value,
      bonuses: {bonus: `@abilities.cha.mod[fire]`},
      filters: {customScripts: `return item.id === "${id}";`}
    }).toObject();
    const flags = {
      [`babonus.bonuses.${babonusData.id}`]: babonusData,
      "flags.core.statusId": item.name.slugify({strict: true})
    };
    const effectData = ItemMacroHelpers._constructLightEffectData({item, lightData, flags});
    return actor.createEmbeddedDocuments("ActiveEffect", effectData);
  }
}

async function WARMING_RESPITE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG)) return item.use();

  const targets = game.user.targets;
  if (!targets.size) {
    ui.notifications.warn("You need at least one target to use this feature!");
    return null;
  }

  const use = await item.use();
  if (!use) return;

  const levels = actor.classes.paladin.system.levels;
  const updates = {actor: {"system.attributes.hp.temp": levels}};
  const options = {
    permanent: true,
    description: `${actor.name} is granting you ${levels} temporary hit points.`
  };

  ui.notifications.info("Granting temporary hit points to your targets!");
  for (const target of targets) {
    if (target.actor.system.attributes.hp.temp < levels) {
      warpgate.mutate(target.document, updates, {}, options);
    }
  }
}
