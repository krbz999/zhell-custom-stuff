import { ADDITION, MODULE } from "../const.mjs";

// hooks on setup.
export function ZHELL_ADDITIONS() {
  const {
    addEquipmentTypes,
    addDivine,
    addConditions,
    addPiety
  } = game.settings.get(MODULE, ADDITION);

  if (addEquipmentTypes) {
    const toAdd = { wand: "Wand" };
    foundry.utils.mergeObject(CONFIG.DND5E.equipmentTypes, toAdd);
    foundry.utils.mergeObject(CONFIG.DND5E.miscEquipmentTypes, toAdd);
  }

  if (addDivine) {
    const toAdd = { divine: "Divine" };
    foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, toAdd);
  }

  if (addConditions) {
    const toAdd = { turned: "Turned" };
    foundry.utils.mergeObject(CONFIG.DND5E.conditionTypes, toAdd);
  }

  if (addPiety) {
    CONFIG.DND5E.abilities["pty"] = "Piety";
    CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
  }
}

export function _sceneHeaderView(app, array) {
  const viewBtn = {
    class: `${MODULE}-view-scene`,
    icon: "fa-solid fa-eye",
    label: "View Scene",
    onclick: async () => await app.object.view()
  }
  array.unshift(viewBtn);
}
