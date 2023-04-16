import {COLOR_DEFAULTS, MODULE, WORLD_DEFAULTS} from "../../const.mjs";

class SettingsMenu extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      popOut: true,
      width: 550,
      height: "auto",
      resizable: false,
      classes: [MODULE, "settings-menu"]
    });
  }

  /** @override */
  get template() {
    return null;
  }

  /** @override */
  get id() {
    return null;
  }

  get title() {
    return null;
  }

  /** @override */
  async _updateObject(event, formData) {
    throw new Error("You must override updateObject.");
  }

  /** @override */
  async getData() {
    throw new Error("You must override getData.");
  }
}

export class GameChangesMenu extends SettingsMenu {
  get template() {
    return `modules/${MODULE}/templates/settingsGameChangesMenu.hbs`;
  }
  get id() {
    return "zhell-custom-stuff-settings-game-changes";
  }
  get title() {
    return "Additions and Replacements";
  }
  async _updateObject(event, formData) {
    return game.settings.set(MODULE, "worldSettings", formData, {diff: false});
  }
  async getData() {
    const def = game.settings.get(MODULE, "worldSettings");
    const data = foundry.utils.mergeObject(WORLD_DEFAULTS, def, {insertKeys: false});
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

export class ColorationMenu extends SettingsMenu {
  get template() {
    return `modules/${MODULE}/templates/settingsColorationMenu.hbs`;
  }
  get id() {
    return "zhell-custom-stuff-settings-coloration";
  }
  get title() {
    return "Character Sheet Colors";
  }
  async _updateObject(event, formData) {
    return game.settings.set(MODULE, "colorSettings", formData, {diff: false});
  }
  async getData() {
    const def = game.settings.get(MODULE, "colorSettings");
    const data = {};
    for (const entry of ["checks", "sheetColors", "rarityColors"]) {
      const _data = foundry.utils.mergeObject(COLOR_DEFAULTS[entry], def, {insertKeys: false});
      data[entry] = Object.entries(_data).map(s => {
        return {
          id: s[0],
          value: s[1],
          name: `ZHELL.SettingsColor${s[0].capitalize()}Name`,
          hint: `ZHELL.SettingsColor${s[0].capitalize()}Hint`
        };
      });
    }
    return data;
  }
}
