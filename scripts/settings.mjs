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
import {refreshColors} from "./modules/sheet_edits.mjs";

export function registerSettings() {
  _registerSettings();
  _registerSettingsMenus();
}

function _registerSettings() {
  game.settings.register(MODULE, FORAGING, {
    name: "ZHELL.SettingsForagingDifficultyName",
    hint: "ZHELL.SettingsForagingDifficultyHint",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    requiresReload: false
  });

  game.settings.register(MODULE, DEFEATED, {
    name: "ZHELL.SettingsCombatantDefeatedName",
    hint: "ZHELL.SettingsCombatantDefeatedHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, DISPLAY_AMMO, {
    name: "ZHELL.SettingsDisplayAmmoName",
    hint: "ZHELL.SettingsDisplayAmmoHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, TRACK_REACTIONS, {
    name: "ZHELL.SettingsTrackReactionsName",
    hint: "ZHELL.SettingsTrackReactionsHint",
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
    onChange: () => SettingsConfig.reloadConfirm({world: true})
  });

  game.settings.registerMenu(MODULE, "worldSettings", {
    name: "ZHELL.SettingsMenuWorldSettingsName",
    hint: "ZHELL.SettingsMenuWorldSettingsHint",
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
    onChange: refreshColors
  });

  game.settings.registerMenu(MODULE, COLOR, {
    name: "ZHELL.SettingsMenuColorSettingsName",
    hint: "ZHELL.SettingsMenuColorSettingsHint",
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
    onChange: refreshColors
  });

  game.settings.registerMenu(MODULE, RARITY, {
    name: "ZHELL.SettingsMenuRarityColorsName",
    hint: "ZHELL.SettingsMenuRarityColorsHint",
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
    return game.settings.set(MODULE, "worldSettings", formData, {diff: false});
  }

  async getData() {
    const data = foundry.utils.mergeObject(
      WORLD_DEFAULTS,
      game.settings.get(MODULE, "worldSettings"),
      {insertKeys: false}
    );
    const settings = Object.entries(data).map(s => {
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SettingsWorld${s[0].capitalize()}Name`,
        hint: `ZHELL.SettingsWorld${s[0].capitalize()}Hint`
      }
    });
    return {settings};
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
    return game.settings.set(MODULE, COLOR, formData, {diff: false});
  }

  async getData() {
    const data = foundry.utils.mergeObject(
      foundry.utils.duplicate(COLOR_DEFAULTS),
      game.settings.get(MODULE, COLOR),
      {insertKeys: false}
    );
    const checks = Object.entries({
      showLimitedUses: data.showLimitedUses,
      showSpellSlots: data.showSpellSlots
    }).map(s => {
      return {
        id: s[0],
        checked: s[1],
        name: `ZHELL.SettingsColor${s[0].capitalize()}Name`,
        hint: `ZHELL.SettingsColor${s[0].capitalize()}Hint`
      };
    });
    delete data.showLimitedUses;
    delete data.showSpellSlots;

    const colors = Object.entries(data).map(s => {
      return {
        id: s[0],
        value: s[1],
        name: `ZHELL.SettingsColor${s[0].capitalize()}Name`,
        hint: `ZHELL.SettingsColor${s[0].capitalize()}Hint`
      }
    });
    return {checks, colors};
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
    const set = await game.settings.set(MODULE, RARITY, formData, {diff: false});
    refreshColors();
    return set;
  }

  async getData() {
    return {
      settings: Object.entries(foundry.utils.mergeObject(
        RARITY_DEFAULTS,
        game.settings.get(MODULE, RARITY),
        {insertKeys: false}
      )).map(d => {
        const label = CONFIG.DND5E.itemRarity[d[0]].titleCase();
        const name = d[0];
        const color = d[1];
        return {label, name, color};
      })
    };
  }
}
