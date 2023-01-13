import { MODULE } from "../../const.mjs";
import { _basicFormContent, _constructLightEffectData, _getDependencies } from "../itemMacros.mjs";

export const ITEMACRO_ITEMS = {
  AMULET_OF_EQUILLIBRIUM,
  RING_OF_LIGHT,
  TORCH,
  HIT_DIE_APPLY,
  WHITEHARBOUR_TEA_SET,
  LANTERN_OF_TRACKING,
  FREE_USE
};

async function AMULET_OF_EQUILLIBRIUM(item, speaker, actor, token, character, event, args) {
  const { value } = item.system.uses;
  if (!value) {
    ui.notifications.warn("You have no uses remaining on the amulet.");
    return;
  }

  const optionsA = Array.fromRange(value).reduce((acc, e) => acc += `<option value="${e + 1}">${e + 1}`, "");
  const optionsB = Array.fromRange(5).reduce((acc, e) => acc += `<option value="d${(e + 2) * 2}">d${(e + 2) * 2}</option>`, "");
  const optionsC = ["cold", "fire", "lightning"].reduce((acc, e) => acc += `<option value="${e}">${CONFIG.DND5E.damageTypes[e]}</option>`, "");
  const content = `
  <p>Select what you are rerolling.</p>
  <form>
    <div class="form-group">
      <div class="form-fields">
        <select id="amulet-a">${optionsA}</select>
        <select id="amulet-b">${optionsB}</select>
        <select id="amulet-c">${optionsC}</select>
      </div>
    </div>
  </form>`;

  return Dialog.prompt({
    title: item.name,
    content,
    rejectClose: false,
    label: "Roll",
    callback: async (html, event) => {
      const a = html[0].querySelector("#amulet-a").value;
      const b = html[0].querySelector("#amulet-b").value;
      const c = html[0].querySelector("#amulet-c").value;
      await item.update({ "system.uses.value": value - Number(a) });
      return item.clone({ "system.damage.parts": [[`${a}${b}`, c]] }, { keepId: true }).rollDamage({ event });
    }
  });
}

async function HIT_DIE_APPLY(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;
  return actor.rollHitDie(undefined, { dialog: false });
}

async function RING_OF_LIGHT(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("effectmacro", "visual-active-effects")) return item.use();

  const use = await item.use();
  if (!use) return;

  const lightData = { bright: 30, dim: 60 };
  return actor.createEmbeddedDocuments("ActiveEffect", _constructLightEffectData({ item, lightData }));
}

async function TORCH(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("effectmacro", "visual-active-effects")) return item.use();

  const use = await item.use();
  if (!use) return;

  const lightData = {
    alpha: 0.05, angle: 360,
    animation: { type: "flame", speed: 2, intensity: 4 },
    attenuation: 0.5, color: "#ff4d00",
    bright: 20, dim: 40,
    coloration: 1, contrast: 0,
    darkness: { min: 0, max: 1 },
    luminosity: 0.5, saturation: 0, shadows: 0
  };
  return actor.createEmbeddedDocuments("ActiveEffect", _constructLightEffectData({ item, lightData }));
}

async function WHITEHARBOUR_TEA_SET(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("rollgroups")) return item.use();

  const servings = [
    { id: foundry.utils.randomID(), uses: 1, label: "Quiant Serving (1 use)" },
    { id: foundry.utils.randomID(), uses: 2, label: "Psychedelic Serving (2 uses)" }
  ];

  // get current limited uses and bail out if not enough.
  const value = item.system.uses.value;
  const minimum = Math.min(...servings.map(i => i.uses));
  if (value < minimum) {
    ui.notifications.warn(game.i18n.format("DND5E.ItemNoUses", { name: item.name }));
    return;
  }

  // construct selection options.
  const options = servings.filter(({ uses }) => {
    return uses <= value;
  }).reduce((acc, { id, label }) => {
    return acc + `<option value="${id}">${label}</option>`;
  }, "");

  const content = _basicFormContent({ label: "Serving Type", type: "select", options });

  new Dialog({
    title: item.name,
    content,
    buttons: {
      serve: {
        icon: "<i class='fa-solid fa-mug-hot'></i>",
        label: "Serve",
        callback: async (html) => {
          const id = html[0].querySelector("select").value;
          const uses = servings.find(i => i.id === id).uses;
          const clone = createClone(uses);
          await clone.use({}, { "flags.dnd5e.itemData": clone.toObject() });
          return item.update({ "system.uses.value": value - uses });
        }
      }
    }
  }).render(true);

  function createClone(uses) {
    const itemData = { "system.uses": { value: 0, max: Math.max(...servings.map(s => s.uses)) } }

    if (uses === 2) {
      itemData["system.damage.parts"] = [["1d6", "healing"], ["1d6", "temphp"]];
      itemData["system.actionType.actionType"] = "heal";
      itemData["flags.rollgroups.config.groups"] = [
        { label: "Healing", parts: [0] },
        { label: "Temp HP", parts: [1] }
      ]
    }
    return item.clone(itemData, { keepId: true });
  }
}

async function LANTERN_OF_TRACKING(item, speaker, actor, token, character, event, args) {
  const oilFlask = actor.items.getName("Oil Flask");
  if (!oilFlask) return ui.notifications.error("You have no Oil Flasks!");

  const quantity = oilFlask.system.quantity;
  if (!quantity) return ui.notifications.error("You have no Oil Flasks!");

  const use = await item.use();
  if (!use) return;
  return oilFlask.update({ "system.quantity": quantity - 1 });
}

async function FREE_USE(item, speaker, actor, token, character, event, args) {
  return item.use({
    createMeasuredTemplate: false,
    consumeQuantity: false,
    consumeRecharge: false,
    consumeResource: false,
    consumeSpellLevel: false,
    consumeSpellSlot: false,
    consumeUsage: false
  }, { configureDialog: false });
}

async function SCORCHING_CLEAVER(item, speaker, actor, token, character, event, args) {
  const uuid = item.getFlag(MODULE, "sourceWeapon");
  const weapon = actor.items.find(i => i.uuid === uuid);
  const value = weapon.system.uses.value;
  if (value < 3) {
    ui.notifications.warn(game.i18n.format("DND5E.ItemNoUses", { name: item.name }));
    return;
  }

  const options = Array.fromRange(value, 3).reduce((acc, e) => {
    if (e > value) return acc;
    return acc + `<option value="${e}">${e} charges</option>`;
  }, "");

  const content = _basicFormContent({ label: "Expend Charges:", type: "select", options });

  const expend = await Dialog.prompt({
    title: weapon.name,
    label: "Fire Away!",
    content,
    callback: (html) => Number(html[0].querySelector("select").value),
    rejectClose: false
  });
  if (!expend) return;

  const val = value - expend;
  const bonus = (val === 0 && expend >= 4) ? 3 : 0;
  const parts = [[`${expend + bonus}d6`, "fire"]];

  await weapon.update({ "system.uses.value": val });
  const clone = item.clone({ "system.damage.parts": parts }, { keepId: true });
  clone.prepareFinalAttributes();
  return clone.use({}, { "flags.dnd5e.itemData": clone.toObject() });
}
