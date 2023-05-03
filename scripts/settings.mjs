import {COLOR_DEFAULTS, MODULE, WORLD_DEFAULTS} from "./const.mjs";
import {ColorationMenu, GameChangesMenu, IdentifiersMenu} from "./modules/applications/settingsMenu.mjs";
import {SheetEdits} from "./modules/applications/sheetEdits.mjs";

export function registerSettings() {
  _registerSettings();
  _registerSettingsMenus();
}

function _registerSettings() {
  game.settings.register(MODULE, "foragingDC", {
    name: "ZHELL.SettingsForagingDifficultyName",
    hint: "ZHELL.SettingsForagingDifficultyHint",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    requiresReload: false
  });

  game.settings.register(MODULE, "markDefeatedCombatants", {
    name: "ZHELL.SettingsCombatantDefeatedName",
    hint: "ZHELL.SettingsCombatantDefeatedHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, "displaySavingThrowAmmo", {
    name: "ZHELL.SettingsDisplayAmmoName",
    hint: "ZHELL.SettingsDisplayAmmoHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE, "trackReactions", {
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
    label: "ZHELL.SettingsMenuWorldSettingsName",
    icon: "fa-solid fa-atlas",
    type: GameChangesMenu,
    restricted: true
  });

  // sheet color settings.
  game.settings.register(MODULE, "colorSettings", {
    scope: "client",
    config: false,
    type: Object,
    default: COLOR_DEFAULTS,
    onChange: SheetEdits.refreshColors
  });

  game.settings.registerMenu(MODULE, "colorSettings", {
    name: "ZHELL.SettingsMenuColorSettingsName",
    hint: "ZHELL.SettingsMenuColorSettingsHint",
    label: "ZHELL.SettingsMenuColorSettingsName",
    icon: "fa-solid fa-paint-roller",
    type: ColorationMenu,
    restricted: false
  });

  game.settings.register(MODULE, "identifierSettings", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.registerMenu(MODULE, "identifierSettings", {
    name: "ZHELL.SettingsMenuIdentifierSettingsName",
    hint: "ZHELL.SettingsMenuIdentifierSettingsHint",
    label: "ZHELL.SettingsMenuIdentifierSettingsName",
    icon: "fa-solid fa-key",
    type: IdentifiersMenu,
    restricted: true
  });
}
