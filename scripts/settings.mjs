import {MODULE} from "./const.mjs";
import {IdentifiersMenu} from "./modules/applications/settingsMenu.mjs";

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
