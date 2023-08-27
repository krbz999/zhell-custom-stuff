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

  static async renderFeatureItemSheet(sheet, [html]) {
    const subtype = html.querySelector("[name='system.type.subtype']");
    const fg = subtype?.closest(".form-group");
    if (!fg || !subtype.value) return;
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/item-section-box.hbs", {
      checked: !!sheet.document.flags[MODULE]?.sort
    });
    fg.after(div.firstElementChild);
    sheet.setPosition();
  }

  static async renderInventoryItemSheet(sheet, [html]) {
    if (!["weapon", "equipment", "consumable", "tool", "loot"].includes(sheet.document.type)) return;
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/item-backpack-select.hbs", {
      value: sheet.document.flags[MODULE]?.backpack ?? null,
      options: sheet.document.actor.items.reduce((acc, item) => {
        if (item.type === "backpack") acc[item.id] = item.name;
        return acc;
      }, {})
    });
    html.querySelector("[name='system.source']").closest("LI").before(div.firstElementChild);
  }

  /* --------------------------------- */
  /*                                   */
  /*        PREPARATION METHODS        */
  /*                                   */
  /* --------------------------------- */

  _prepareItems(context) {
    super._prepareItems(context);
    this._prepareDivineSpellSection(context);
    this._prepareFeatureSubtypeSections(context);
  }

  _prepareDivineSpellSection(context) {
    const divine = {
      canCreate: false,
      canPrepare: false,
      dataset: {type: "spell", "preparation.mode": "atwill"},
      editable: true,
      label: "Divine",
      order: -11,
      usesSlots: false,
      spells: [],
      uses: "-",
      slots: "-"
    };
    for (const book of context.spellbook) {
      for (const spell of book.spells) {
        if (spell.system.school === "divine") {
          book.spells.findSplice(e => e === spell);
          divine.spells.push(spell);
        }
      }
    }
    if (divine.spells.length) context.spellbook.push(divine);
  }

  _prepareFeatureSubtypeSections(context) {
    const featureSections = [];
    for (const section of context.features) {
      if (!["DND5E.FeatureActive", "DND5E.FeaturePassive"].includes(section.label)) continue;
      for (const item of section.items) {
        const {value, subtype} = item.system.type ?? {};
        const sort = item.flags[MODULE]?.sort && value && !!subtype;
        if (!sort) continue;
        const label = foundry.utils.getProperty(CONFIG.DND5E.featureTypes, `${value}.subtypes.${subtype}`);
        if (!label) continue;
        let featureSection = featureSections.find(s => s.dataset.sort === subtype);
        if (!featureSection) {
          featureSection = {
            dataset: {type: "feat", sort: subtype},
            hasActions: true,
            items: [],
            label: label
          };
          featureSections.push(featureSection);
        }
        featureSection.items.push(item);
        section.items.findSplice(e => e === item);
      }
    }
    context.features.push(...featureSections);
  }

  _prepareBackpackSections(context) {
    const containers = context.inventory.find(e => e.dataset.type === "backpack").items;
    const containerSections = [];
    for (const section of context.inventory) {
      if (section.dataset.type === "backpack") continue;
      for (const item of section.items) {
        const container = containers.find(e => e.id === item.flags[MODULE]?.backpack);
        if (!container) continue;
        let containerSection = containerSections.find(s => s.dataset.backpack === container.id);
        if (!containerSection) {
          containerSection = {
            dataset: {backpack: container.id},
            hasActions: false,
            items: [],
            label: container.name
          };
          containerSections.push(containerSection);
        }
        containerSection.items.push(item);
        section.items.findSplice(e => e === item);
      }
    }

    context.inventory.push(...containerSections);
  }

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
   * Toggle inspiration on or off when clicking the 'label'.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Promise<Actor>}        The updated actor.
   */
  async _onClickInspiration(event) {
    return this.document.update({"system.attributes.inspiration": !this.document.system.attributes.inspiration});
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
