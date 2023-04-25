import {COLOR_DEFAULTS, MODULE, WORLD_DEFAULTS} from "../../const.mjs";

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

export class GameChangesMenu extends SettingsMenu {
  /** @override */
  get template() {
    return `modules/${MODULE}/templates/settingsGameChangesMenu.hbs`;
  }

  /** @override */
  get id() {
    return "zhell-custom-stuff-settings-game-changes";
  }

  /** @override */
  get title() {
    return "Additions and Replacements";
  }

  /** @override */
  async _updateObject(event, formData) {
    return game.settings.set(MODULE, "worldSettings", formData, {diff: false});
  }

  /** @override */
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
  _getSubmitData(updateData = {}) {
    const data = super._getSubmitData(updateData);
    for (const entry of ["sheetColors", "rarityColors"]) {
      for (const [key, val] of Object.entries(COLOR_DEFAULTS[entry])) {
        if (!data[key].trim().length) data[key] = val;
      }
    }
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    return game.settings.set(MODULE, "colorSettings", formData, {diff: false});
  }

  /** @override */
  async getData() {
    const curr = game.settings.get(MODULE, "colorSettings");
    const defs = foundry.utils.deepClone(COLOR_DEFAULTS);
    const data = {};
    for (const entry of ["checks", "sheetColors", "rarityColors"]) {
      const _data = foundry.utils.mergeObject(defs[entry], curr, {insertKeys: false});
      data[entry] = Object.entries(_data).map(s => {
        return {
          id: s[0],
          value: s[1],
          name: `ZHELL.SettingsColor${s[0].capitalize()}Name`,
          hint: `ZHELL.SettingsColor${s[0].capitalize()}Hint`,
          placeholder: COLOR_DEFAULTS[entry][s[0]]
        };
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
    return "Identifiers and Keys";
  }

  /** @override */
  async _updateObject(event, formData) {
    formData["monster-catalog-key"] = formData["monster-catalog-key"]?.filter(key => key.trim().length > 0) ?? [];
    return game.settings.set(MODULE, "identifierSettings", formData);
  }

  /** @override */
  async getData() {
    return game.settings.get(MODULE, "identifierSettings");
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].addEventListener("click", e => e.target.closest("[data-action='delete-key']")?.closest(".form-group").remove());
    html[0].querySelectorAll("[data-action='add-key']").forEach(n => n.addEventListener("click", this._onAddKey.bind(this)));
  }

  /**
   * Append a row to the correct list of form groups.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onAddKey(event) {
    const content = `
    <div class="form-group">
      <label>Key</label>
      <div class="form-fields">
        <input type="text" name="monster-catalog-key">
      </div>
      <a data-action="delete-key"><i class="fa-solid fa-trash"></i></a>
    </div>`;
    const div = document.createElement("DIV");
    div.innerHTML = content;
    event.currentTarget.closest("form").querySelector(`.keys[data-type='${event.currentTarget.dataset.type}']`).appendChild(div.firstElementChild);
  }
}
