import {MODULE} from "../../const.mjs";

class SettingsMenu extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      popOut: true,
      width: 550,
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
