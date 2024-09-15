import {MODULE} from "./const.mjs";

export default class ModuleSettings {
  static init() {
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
        2: "ZHELL.SettingsTrackReactionsChoice2" // all
      }
    });
  }
}
