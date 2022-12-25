import { COLOR, DEFEATED, DISPLAY_AMMO, FORAGING, MODULE, RARITY, TRACK_REACTIONS } from "./const.mjs";
import { refreshColors } from "./modules/sheet_edits.mjs";

export function registerSettings() {
  _registerSettings();
  registerSettingsMenus();
}

function _registerSettings() {
  game.settings.register(MODULE, FORAGING, {
    name: "Foraging DC",
    hint: "The current DC for foraging.",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    requiresReload: false
  });

  game.settings.register(MODULE, DEFEATED, {
    name: "Mark Combatants Defeated",
    hint: "When combatants that are not owned by a player is reduced to 0 or less hp, mark them as defeated.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, DISPLAY_AMMO, {
    name: "Show Saving Throw Ammo",
    hint: "If ammunition has a saving throw, it will be displayed when a weapon makes an attack roll.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, TRACK_REACTIONS, {
    name: "Track Reactions in Combat",
    hint: "Track reactions for combatants when combat is ongoing.",
    scope: "world",
    config: true,
    type: String,
    default: "all",
    requiresReload: true,
    choices: {
      disabled: "Do not track reactions",
      gm: "Track reactions for the GM",
      all: "Track reactions for all actors"
    }
  });
}

class SettingsSubmenu extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      popOut: true,
      width: 550,
      height: "auto",
      template: `modules/${MODULE}/templates/settingsMenu.hbs`,
      id: "zhell-settings-submenu-additions-and-replacements",
      title: "Additions and Replacements",
      resizable: false,
      classes: [MODULE, "settings-menu"]
    });
  }

  async _updateObject(event, formData) {
    return game.settings.set(MODULE, "worldSettings", formData);
  }

  async getData() {
    const data = foundry.utils.mergeObject({
      addConditions: true,
      addEquipment: true,
      addPiety: true,
      addDivine: true,
      replaceTokenConditions: true,
      replaceLanguages: true,
      replaceTools: true,
      replaceWeapons: true,
      replaceConsumables: true,
      removeAlignment: true,
      disableInitiativeButton: true,
      createForaging: true,
      collapsibleHeaders: true
    }, game.settings.get(MODULE, "worldSettings"));
    const settings = Object.entries(data).map(s => {
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SETTINGS.${s[0]}.NAME`,
        hint: `ZHELL.SETTINGS.${s[0]}.HINT`
      }
    });
    return { settings };
  }
}

class ColorPickerSubmenu extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [MODULE, "settings-menu"],
      popOut: true,
      width: 550,
      height: "auto",
      template: `modules/${MODULE}/templates/settingsColorpickers.hbs`,
      id: "zhell-settings-submenu-colorpickers",
      title: "Character Sheet Color Adjustments",
      resizable: false
    });
  }

  async _updateObject(event, formData) {
    const set = await game.settings.set(MODULE, COLOR, formData);
    refreshColors();
    return set;
  }

  async getData() {
    const data = foundry.utils.mergeObject({
      showLimitedUses: true,
      showSpellSlots: true,
      usesUnexpended: "#ff2e2e",
      itemAttuned: "#21c050",
      itemNotAttuned: "#c2c2c2",
      itemEquipped: "#6dff38",
      itemNotEquipped: "#c2c2c2",
      spellPrepared: "#0000ff",
      spellNotPrepared: "#c2c2c2",
      spellAlwaysPrepared: "#ff0004",
      proficientNormal: "#228b22",
      proficientHalf: "#696969",
      proficientTwice: "#ff6347"
    }, game.settings.get(MODULE, COLOR));
    const checks = Object.entries({
      showLimitedUses: data.showLimitedUses,
      showSpellSlots: data.showSpellSlots
    }).map(s => {
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SETTINGS.${s[0]}.NAME`,
        hint: `ZHELL.SETTINGS.${s[0]}.HINT`
      };
    });
    delete data.showLimitedUses;
    delete data.showSpellSlots;

    const colors = Object.entries(data).map(s => {
      return {
        id: s[0],
        value: s[1],
        name: `ZHELL.SETTINGS.${s[0]}.NAME`,
        hint: `ZHELL.SETTINGS.${s[0]}.HINT`
      }
    });
    return { checks, colors };
  }
}

class RarityColorsSubmenu extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [MODULE, "settings-menu"],
      popOut: true,
      width: 550,
      height: "auto",
      template: `modules/${MODULE}/templates/settingsRaritycolors.hbs`,
      id: "zhell-settings-submenu-raritycolors",
      title: "Item Rarity Color Adjustments",
      resizable: false
    });
  }

  async _updateObject(event, formData) {
    const set = await game.settings.set(MODULE, RARITY, formData);
    refreshColors();
    return set;
  }

  async getData() {
    const source = game.settings.get(MODULE, RARITY);
    const defaults = {
      uncommon: "#008000",
      rare: "#0000ff",
      veryRare: "#800080",
      legendary: "#ffa500",
      artifact: "#d2691e"
    }
    return foundry.utils.mergeObject(defaults, source);
  }
}

const registerSettingsMenus = function() {
  game.settings.register(MODULE, "worldSettings", {
    scope: "world",
    config: false,
    type: Object,
    default: {
      addConditions: true,
      addEquipment: true,
      addPiety: true,
      addDivine: true,
      replaceTokenConditions: true,
      replaceLanguages: true,
      replaceTools: true,
      replaceWeapons: true,
      replaceConsumables: true,
      removeAlignment: true,
      disableInitiativeButton: true,
      createForaging: true,
      collapsibleHeaders: true
    },
    onChange: () => SettingsConfig.reloadConfirm({ world: true })
  });

  game.settings.registerMenu(MODULE, "worldSettings", {
    name: "Additions and Replacements",
    hint: "A collection of additions and replacements for core and system content.",
    label: "Settings Menu",
    icon: "fa-solid fa-atlas",
    type: SettingsSubmenu,
    restricted: true
  });

  // sheet color settings.
  game.settings.register(MODULE, COLOR, {
    scope: "client",
    config: false,
    type: Object,
    default: {
      showLimitedUses: true,
      showSpellSlots: true,
      usesUnexpended: "#ff2e2e",
      itemAttuned: "#21c050",
      itemNotAttuned: "#c2c2c2",
      itemEquipped: "#6dff38",
      itemNotEquipped: "#c2c2c2",
      spellPrepared: "#0000ff",
      spellNotPrepared: "#c2c2c2",
      spellAlwaysPrepared: "#ff0004",
      proficientNormal: "#228b22",
      proficientHalf: "#696969",
      proficientTwice: "#ff6347"
    },
    onChange: () => refreshColors()
  });
  game.settings.registerMenu(MODULE, COLOR, {
    name: "Sheet Colors",
    hint: "Settings for the colors that are applied to the actor sheets.",
    label: "Sheet Color Settings",
    icon: "fa-solid fa-paint-roller",
    type: ColorPickerSubmenu,
    restricted: false
  });

  // item rarity color settings.
  game.settings.register(MODULE, RARITY, {
    scope: "client",
    config: false,
    type: Object,
    default: {
      uncommon: "#008000",
      rare: "#0000ff",
      veryRare: "#800080",
      legendary: "#ffa500",
      artifact: "#d2691e"
    },
    onChange: () => refreshColors()
  });
  game.settings.registerMenu(MODULE, RARITY, {
    name: "Rarity Colors",
    hint: "Settings for the colors that are applied to items on an actor sheet depending on rarity.",
    label: "Item Rarity Color Settings",
    icon: "fa-solid fa-paint-roller",
    type: RarityColorsSubmenu,
    restricted: false
  });
}
