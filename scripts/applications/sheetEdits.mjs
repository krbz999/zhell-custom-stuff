import { MateriaMedica } from "./apps/materiaMedica.mjs";

export class SheetEdits {
  /** Create the foraging button and foraged materials input. */
  static async _createCharacterSheetCounters(app, [html]) {
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/character-sheet-counters.hbs", {
      foraged: foundry.utils.getProperty(app.document, `flags.${ZHELL.id}.materia-medica.value`) || 0,
    });
    div.querySelectorAll("[data-dtype=Number]").forEach(n => {
      n.addEventListener("focus", event => event.currentTarget.select());
      n.addEventListener("change", SheetEdits._onChangeInputDeltaCustom.bind(app));
    });
    div.querySelector("[data-action]").addEventListener("click", SheetEdits._onClickForaging.bind(app));
    html.querySelector(".currency > label:has(.cp)").after(...div.children);
  }

  /**
   * Custom function that sets a min and max of a type:text input field and runs
   * every time such a field is changed to modify the value using input deltas.
   * @param {Event} event     The initiating event.
   */
  static _onChangeInputDeltaCustom(event) {
    const input = event.currentTarget;
    const target = this.document;
    const value = dnd5e.utils.parseInputDelta(input, target);
    if (value !== undefined) input.value = Math.clamp(value, 0, 999);
  }

  static init() {
    Hooks.on("renderActorSheet5eCharacter2", SheetEdits._createCharacterSheetCounters);
  }

  /**
   * Handle clicking the foraging label.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MateriaMedica}         The rendered crafting app.
   */
  static _onClickForaging(event) {
    event.preventDefault();
    event.stopPropagation();
    return new MateriaMedica({ actor: this.document }).render({ force: true });
  }
}
