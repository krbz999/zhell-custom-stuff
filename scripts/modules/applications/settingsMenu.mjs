import {COLOR_DEFAULTS, MODULE} from "../../const.mjs";

class SettingsMenu extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      popOut: true,
      width: 550,
      resizable: true,
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

  /** @override */
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

export class ColorationMenu extends SettingsMenu {
  /** @override */
  get template() {
    return `modules/${MODULE}/templates/settingsColorationMenu.hbs`;
  }

  /** @override */
  get id() {
    return "zhell-custom-stuff-settings-coloration";
  }

  /** @override */
  get title() {
    return "Character Sheet Colors";
  }

  /** @override */
  async _updateObject(event, formData) {
    formData = foundry.utils.expandObject(formData);
    return game.settings.set(MODULE, "colorationSettings", formData, {diff: false});
  }

  /** @override */
  async getData() {
    const data = {};
    const curr = game.settings.get(MODULE, "colorationSettings");
    const defs = foundry.utils.deepClone(COLOR_DEFAULTS);
    const _data = foundry.utils.mergeObject(defs, curr, {insertKeys: false});

    for (const [key, val] of Object.entries(foundry.utils.flattenObject(_data))) {
      const [section, entry] = key.split(".");
      data[section] ??= [];
      data[section].push({
        id: entry,
        value: val,
        name: `ZHELL.SettingsColoration${entry.capitalize()}`,
        hint: `ZHELL.SettingsColoration${entry.capitalize()}Hint`,
        placeholder: COLOR_DEFAULTS[section][entry]
      });
    }
    return data;
  }
}

export class IdentifiersMenu extends SettingsMenu {
  /** @override */
  get template() {
    return `modules/${MODULE}/templates/settingsIdentifiersMenu.hbs`;
  }

  /** @override */
  get id() {
    return "zhell-custom-stuff-settings-identifiers";
  }

  /** @override */
  get title() {
    return game.i18n.localize("ZHELL.SettingsMenuIdentifierSettings");
  }

  /** @override */
  async _updateObject(event, formData) {
    const data = foundry.utils.expandObject(formData);
    return game.settings.set(MODULE, "identifierSettings", data);
  }

  /** @override */
  async getData() {
    const data = game.settings.get(MODULE, "identifierSettings") ?? {};
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("INPUT").forEach(n => n.addEventListener("focus", event => event.currentTarget.select()));
  }
}
