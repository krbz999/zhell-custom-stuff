import {COLOR_DEFAULTS, MODULE} from "./const.mjs";
import {ColorationMenu, IdentifiersMenu} from "./modules/applications/settingsMenu.mjs";
import {SheetEdits} from "./modules/applications/sheetEdits.mjs";

export default class ModuleSettings {
  static init() {
    ModuleSettings._registerSettings();
    ModuleSettings._registerSettingsMenus();
  }

  static _registerSettings() {
    game.settings.register(MODULE, "foragingDC", {
      name: "ZHELL.SettingsForagingDifficulty",
      hint: "ZHELL.SettingsForagingDifficultyHint",
      scope: "world",
      config: true,
      type: Number,
      default: 15,
      requiresReload: false
    });

    game.settings.register(MODULE, "markDefeatedCombatants", {
      name: "ZHELL.SettingsCombatantDefeated",
      hint: "ZHELL.SettingsCombatantDefeatedHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true
    });

    game.settings.register(MODULE, "displaySavingThrowAmmo", {
      name: "ZHELL.SettingsDisplayAmmo",
      hint: "ZHELL.SettingsDisplayAmmoHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true
    });

    // Whether to track reactions.
    game.settings.register(MODULE, "trackReactions", {
      name: "ZHELL.SettingsTrackReactions",
      hint: "ZHELL.SettingsTrackReactionsHint",
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      requiresReload: true,
      choices: {
        0: "ZHELL.SettingsTrackReactionsChoice0", // none
        1: "ZHELL.SettingsTrackReactionsChoice1", // gm only
        2: "ZHELL.SettingsTrackReactionsChoice2"  // all
      }
    });
  }

  static _registerSettingsMenus() {
    // Settings that change the colors on character sheets.
    game.settings.register(MODULE, "colorationSettings", {
      scope: "client",
      config: false,
      type: Object,
      default: COLOR_DEFAULTS,
      onChange: SheetEdits.refreshColors
    });

    game.settings.registerMenu(MODULE, "colorationSettings", {
      name: "ZHELL.SettingsMenuColorationSettings",
      hint: "ZHELL.SettingsMenuColorationSettingsHint",
      label: "ZHELL.SettingsMenuColorationSettings",
      icon: "fa-solid fa-paint-roller",
      type: ColorationMenu,
      restricted: false
    });

    // Settings for various keys, ids, and uuids.
    game.settings.register(MODULE, "identifierSettings", {
      scope: "world",
      config: false,
      type: Object,
      default: {}
    });

    game.settings.registerMenu(MODULE, "identifierSettings", {
      name: "ZHELL.SettingsMenuIdentifierSettings",
      hint: "ZHELL.SettingsMenuIdentifierSettingsHint",
      label: "ZHELL.SettingsMenuIdentifierSettings",
      icon: "fa-solid fa-key",
      type: IdentifiersMenu,
      restricted: true
    });
  }
}
