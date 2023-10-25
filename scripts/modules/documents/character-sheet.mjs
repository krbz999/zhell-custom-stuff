import {MODULE} from "../../const.mjs";
import {MateriaMedica} from "../applications/materiaMedica.mjs";
import {MoneySpender} from "../applications/moneySpender.mjs";

export default class ActorSheet5eCharacter extends dnd5e.applications.actor.ActorSheet5eCharacter {
  static init() {
    Actors.registerSheet("dnd5e", ActorSheet5eCharacter, {
      types: ["character"],
      makeDefault: true,
      label: "DND5E.SheetClassCharacter"
    });
  }

  /* --------------------------------- */
  /*                                   */
  /*        PREPARATION METHODS        */
  /*                                   */
  /* --------------------------------- */

  /* --------------------------------- */
  /*                                   */
  /*          EVENT LISTENERS          */
  /*                                   */
  /* --------------------------------- */

  /**
   * Roll limited uses recharge of all items that recharge on a new day.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Promise<Item5e[]>}     The array of updated items.
   */
  async _onClickNewDay(event) {
    const conf = await Dialog.confirm({
      title: "New Day",
      content: "Would you like to recharge all items that regain charges on a new day?",
      options: {id: `${this.document.uuid.replaceAll(".", "-")}-new-day-confirm`}
    });
    if (!conf) return;
    const updates = await this.document._getRestItemUsesRecovery({
      recoverShortRestUses: false,
      recoverLongRestUses: false,
      recoverDailyUses: true,
      rolls: []
    });
    return this.document.updateEmbeddedDocuments("Item", updates);
  }

  /**
   * Handle clicking a dot.
   * @param {PointerEvent} event            The initiating click event.
   * @returns {Promise<Actor5e|Item5e>}     The updated actor or item.
   */
  async _onClickDot(event) {
    const {dataset: data, classList: list} = event.currentTarget;
    const target = this.document.items.get(data.itemId) ?? this.document;
    const path = data.spellLevel ? `system.spells.${data.spellLevel}.value` : "system.uses.value";
    const current = foundry.utils.getProperty(target, path);

    let value;
    if (list.contains("has-more")) value = current + (list.contains("empty") ? 1 : -1);
    else value = Number(data.idx) + (list.contains("empty") ? 1 : 0);

    return target.update({[path]: value});
  }

  /**
   * Handle clicking the foraging label.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MateriaMedica}         The rendered crafting app.
   */
  _onClickForaging(event) {
    return new MateriaMedica(this.document, {}).render(true);
  }

  /**
   * Handle clicking the money spending anchor.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MoneySpender}          The rendered money spending app.
   */
  _onClickMoneySpender(event) {
    return new MoneySpender(this.document).render(true);
  }

  /**
   * Handle clicking the exhaustion label.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickExhaustion(event) {
    const actor = this.document;
    const level = actor.system.attributes.exhaustion;
    const effect = {
      0: "You are not currently exhausted.",
      1: "You currently have 1 level of exhaustion.",
    }[level] ?? `You currently have ${level} levels of exhaustion.`;
    const buttons = {
      up: {
        icon: "<i class='fa-solid fa-arrow-up'></i>",
        label: "Gain a Level",
        condition: level < 11,
        callback: _applyExhaustion
      },
      down: {
        icon: "<i class='fa-solid fa-arrow-down'></i>",
        label: "Down a Level",
        condition: level > 0,
        callback: _applyExhaustion
      }
    };

    function _applyExhaustion(html, event) {
      const type = event.currentTarget.dataset.button;
      const num = (type === "up") ? (level + 1) : (type === "down") ? (level - 1) : null;
      if (num === null) return ui.notifications.warn("EXHAUSTION ERROR");
      return actor.applyExhaustion(num);
    }

    return new Dialog({
      title: `Exhaustion: ${actor.name}`,
      content: `<p>Adjust your level of exhaustion.</p><p>${effect}</p>`,
      buttons
    }, {
      id: `${MODULE}-exhaustion-dialog-${actor.id}`,
      classes: [MODULE, "exhaustion", "dialog"]
    }).render(true);
  }
}
