import {
  COLOR,
  COLOR_DEFAULTS,
  DEFEATED,
  DISPLAY_AMMO,
  FORAGING,
  MODULE,
  RARITY,
  RARITY_DEFAULTS,
  TRACK_REACTIONS,
  WORLD_DEFAULTS
} from "./const.mjs";
import { refreshColors } from "./modules/sheet_edits.mjs";

export function registerSettings() {
  _registerSettings();
  _registerSettingsMenus();
}

function _registerSettings() {
  game.settings.register(MODULE, FORAGING, {
    name: "ZHELL.SETTINGS.FORAGING.NAME",
    hint: "ZHELL.SETTINGS.FORAGING.HINT",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    requiresReload: false
  });

  game.settings.register(MODULE, DEFEATED, {
    name: "ZHELL.SETTINGS.DEFEATED.NAME",
    hint: "ZHELL.SETTINGS.DEFEATED.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, DISPLAY_AMMO, {
    name: "ZHELL.SETTINGS.DISPLAY_AMMO.NAME",
    hint: "ZHELL.SETTINGS.DISPLAY_AMMO.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, TRACK_REACTIONS, {
    name: "ZHELL.SETTINGS.TRACK_REACTIONS.NAME",
    hint: "ZHELL.SETTINGS.TRACK_REACTIONS.HINT",
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

function _registerSettingsMenus() {
  // game additions, replacements, and tweaks.
  game.settings.register(MODULE, "worldSettings", {
    scope: "world",
    config: false,
    type: Object,
    default: WORLD_DEFAULTS,
    onChange: () => SettingsConfig.reloadConfirm({ world: true })
  });

  game.settings.registerMenu(MODULE, "worldSettings", {
    name: "ZHELL.SETTINGS.WORLD_SETTINGS.NAME",
    hint: "ZHELL.SETTINGS.WORLD_SETTINGS.HINT",
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
    default: COLOR_DEFAULTS,
    onChange: () => refreshColors()
  });

  game.settings.registerMenu(MODULE, COLOR, {
    name: "ZHELL.SETTINGS.COLOR_SETTINGS.NAME",
    hint: "ZHELL.SETTINGS.COLOR_SETTINGS.HINT",
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
    default: RARITY_DEFAULTS,
    onChange: () => refreshColors()
  });

  game.settings.registerMenu(MODULE, RARITY, {
    name: "ZHELL.SETTINGS.RARITY_SETTINGS.NAME",
    hint: "ZHELL.SETTINGS.RARITY_SETTINGS.HINT",
    label: "Item Rarity Color Settings",
    icon: "fa-solid fa-paint-roller",
    type: RarityColorsSubmenu,
    restricted: false
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
    return game.settings.set(MODULE, "worldSettings", formData, { diff: false });
  }

  async getData() {
    const data = foundry.utils.mergeObject(
      WORLD_DEFAULTS,
      game.settings.get(MODULE, "worldSettings"),
      { insertKeys: false }
    );
    const settings = Object.entries(data).map(s => {
      const str = s[0].charAt(0).toUpperCase() + s[0].slice(1);
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SettingsWorld${str}Name`,
        hint: `ZHELL.SettingsWorld${str}Hint`
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
    const set = await game.settings.set(MODULE, COLOR, formData, { diff: false });
    refreshColors();
    return set;
  }

  async getData() {
    const data = foundry.utils.mergeObject(
      COLOR_DEFAULTS,
      game.settings.get(MODULE, COLOR),
      { insertKeys: false }
    );
    const checks = Object.entries({
      showLimitedUses: data.showLimitedUses,
      showSpellSlots: data.showSpellSlots
    }).map(s => {
      const str = s[0].charAt(0).toUpperCase() + s[0].slice(1);
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SettingsColor${str}Name`,
        hint: `ZHELL.SettingsColor${str}Hint`
      };
    });
    delete data.showLimitedUses;
    delete data.showSpellSlots;

    const colors = Object.entries(data).map(s => {
      const str = s[0].charAt(0).toUpperCase() + s[0].slice(1);
      return {
        id: s[0],
        value: s[1],
        name: `ZHELL.SettingsColor${str}Name`,
        hint: `ZHELL.SettingsColor${str}Hint`
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
    const set = await game.settings.set(MODULE, RARITY, formData, { diff: false });
    refreshColors();
    return set;
  }

  async getData() {
    return {
      settings: Object.entries(foundry.utils.mergeObject(
        RARITY_DEFAULTS,
        game.settings.get(MODULE, RARITY),
        { insertKeys: false }
      )).map(d => {
        const label = CONFIG.DND5E.itemRarity[d[0]].titleCase();
        const name = d[0];
        const color = d[1];
        return { label, name, color };
      })
    };
  }
}
