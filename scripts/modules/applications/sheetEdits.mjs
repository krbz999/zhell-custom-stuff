import {MODULE} from "../../const.mjs";
import {MateriaMedica} from "./materiaMedica.mjs";
import {MoneySpender} from "./moneySpender.mjs";
import {EXHAUSTION} from "../zhell_functions.mjs";

export function _performSheetEdits(sheet, html) {
  if (!sheet.sheetEdits) {
    const edits = new SheetEdits();
    sheet.sheetEdits = edits;
    edits.sheet = sheet;
    edits.html = html;
  } else {
    sheet.sheetEdits.html = html;
  }
  const e = sheet.sheetEdits;
  e.render(...arguments);
}

export class SheetEdits {
  constructor() {
    this.settings = {
      ...game.settings.get(MODULE, "worldSettings"),
      ...game.settings.get(MODULE, "colorSettings")
    };
    this.headers = new Set();
  }

  /** @override */
  async render() {
    if (this.settings.removeAlignment && (this.sheet.document.type === "character")) this._removeAlignment();
    this._setMagicItemsColor();
    if (this.sheet.document.type !== "group") this._setHealthColor();
    if (this.settings.collapsibleHeaders) this._collapsibleHeaders();
    if (["character", "npc"].includes(this.sheet.document.type)) this._createDots();
    if ((this.sheet.document.type === "character") && this.settings.createForaging) await this._createForaging();
    if (this.sheet.document.type === "character") this._createExhaustion();
    if ((this.sheet.document.type === "character") && this.settings.createMoneySpender) this._createMoneySpender();
    if (this.sheet.document.type === "character") this._createNewDay();
    if (this.sheet.document.type === "character") this._createInspirationToggle();
  }

  /** Make 'Inspiration' a toggle. */
  _createInspirationToggle() {
    const insp = this.html[0].querySelector(".inspiration h4");
    insp.classList.add("rollable");
    insp.dataset.action = "inspiration";
    insp.addEventListener("click", this._onClickInspiration.bind(this.sheet));
  }

  /**
   * Toggle inspiration on or off when clicking the 'label'.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Actor}                 The updated actor.
   */
  async _onClickInspiration(event) {
    return this.document.update({"system.attributes.inspiration": !this.document.system.attributes.inspiration});
  }

  /** Remove the 'alignment' input. */
  _removeAlignment() {
    const par = this.html[0].querySelector("[name='system.details.alignment']")?.parentElement;
    if (par) par.style.display = "none";
  }

  /** Set the color of magic items by adding css classes to them. */
  _setMagicItemsColor() {
    this.html[0].querySelectorAll(".items-list .item").forEach(item => {
      const id = item.dataset.itemId;
      const rarity = this.sheet.document.items.get(id)?.system.rarity;
      if (rarity) item.classList.add(rarity.slugify().toLowerCase());
    });
  }

  /** Set the color of the health attributes by adding a css class. */
  _setHealthColor() {
    const hp = this.sheet.document.system.attributes.hp;
    const a = (hp.value ?? 0) + (hp.temp ?? 0);
    const b = (hp.max ?? 0) + (hp.tempmax ?? 0);
    if (!b) return;
    const nearDeath = a / b < 0.33;
    const bloodied = (a / b < 0.66) && !nearDeath;

    const node = this.html[0].querySelector("[name='system.attributes.hp.value']");
    node.classList.toggle("near-death", nearDeath);
    node.classList.toggle("bloodied", bloodied);
  }

  /** Make embedded document headers collapsible. */
  _collapsibleHeaders() {
    this.html[0].querySelectorAll(".dnd5e .items-list .items-header h3").forEach(header => {
      const itemHeader = header.closest(".items-header.flexrow");
      if (!itemHeader) return;

      // apply collapse class for hover effect.
      itemHeader.classList.toggle("zhell-header-collapse");

      // Read whether to initially collapse.
      const applyNoCreate = this.headers.has(header.innerText);

      // initially add 'no-create' class if applicable.
      if (applyNoCreate) itemHeader.classList.add("no-create");

      // set up listeners to change display.
      header.addEventListener("click", (event) => {
        const text = event.currentTarget.innerText;
        const current = this.headers.has(text);
        if (current) this.headers.delete(text);
        else this.headers.add(text);
        itemHeader.classList.toggle("no-create", this.headers.has(text));
      });
    });
  }

  /** Handle creating dots for spell slots and items with limited uses. */
  _createDots() {
    const sheet = this.sheet;
    const actor = sheet.document;

    if (this.settings.showSpellSlots) {
      Object.entries(actor.system.spells).forEach(([key, {value, max}]) => {
        const _max = this.html[0].querySelector(`.spell-max[data-level=${key}]`);
        const dotContainer = document.createElement("DIV");
        dotContainer.classList.add(MODULE, "dot-container");
        if (!max || !_max) return;
        const beforeThis = _max.closest(".spell-slots");
        beforeThis.before(dotContainer);
        const q = 10;
        for (let i = 0; i < Math.min(q, max); i++) {
          const span = document.createElement("SPAN");
          dotContainer.appendChild(span);
          const le = i < (q - 1) || max <= q;
          const cls = le ? (i < value ? ["dot"] : ["dot", "empty"]) : (value < max ? ["dot", "empty", "has-more"] : ["dot", "has-more"]);
          span.classList.add(...cls);
          span.setAttribute("data-action", "toggleDot");
          span.setAttribute("data-idx", i);
          span.setAttribute("data-spell-level", key);
        }
      });
    }

    if (this.settings.showLimitedUses) {
      actor.items.filter(i => !!i.hasLimitedUses).forEach(item => {
        const uses = item.system.uses;
        if (!uses.max) return;
        const itemHTML = this.html[0].querySelector(`.item[data-item-id="${item.id}"]`);
        // skip if item is hidden via filter.
        if (!itemHTML) return;
        const position = (item.type === "spell") ? "beforeBegin" : "afterEnd";
        const adjacent = (item.type === "spell") ? itemHTML.querySelector(".item-detail.spell-uses") : itemHTML.querySelector(".item-name");

        if (item.type !== "spell") {
          const dotContainer = document.createElement("DIV");
          dotContainer.classList.add(MODULE, "dot-container");
          const q = 10;
          const max = Math.min(q, uses.max);
          dotContainer.innerHTML = Array.fromRange(max).reduce((acc, e, i) => {
            const le = e < (q - 1) || uses.max <= q;
            const cls = le ? (e < uses.value ? "dot" : "dot empty") : (uses.value < uses.max ? "dot empty has-more" : "dot has-more");
            return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${item.id}" data-idx="${i}"></span>`;
          }, "");
          adjacent.insertAdjacentElement(position, dotContainer);
        } else {
          const dotContainer = document.createElement("DIV");
          dotContainer.classList.add(MODULE, "dot-container");
          const q = 5;
          dotContainer.innerHTML = Array.fromRange(Math.min(q, uses.max)).reduce((acc, e, i) => {
            const le = e < (q - 1) || uses.max <= q;
            const cls = le ? (e < uses.value ? "dot" : "dot empty") : (uses.value < uses.max ? "dot empty has-more" : "dot has-more");
            return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${item.id}" data-idx="${i}"></span>`;
          }, "");
          adjacent.insertAdjacentElement(position, dotContainer);
        }
      });
      // items with spells
      actor.items.filter(i => {
        const f = i.flags["items-with-spells-5e"]?.["item-spells"]?.length;
        const u = i.hasLimitedUses;
        return f && u;
      }).forEach(item => {
        const header = [...this.html[0].querySelectorAll(".items-header.spellbook-header > .item-name > h3")].find(h => {
          return (h.innerText.trim() === item.name) && !h.dataset.itemId;
        });
        if (!header) return;
        header.setAttribute("data-item-id", item.id);
        const div = document.createElement("DIV");
        div.classList.add(MODULE, "dot-container");
        const q = 10;
        const uses = item.system.uses;
        div.innerHTML = Array.fromRange(Math.min(q, uses.max)).reduce((acc, e, i) => {
          const le = e < (q - 1) || uses.max <= q;
          const cls = le ? (e < uses.value ? "dot" : "dot empty") : (uses.value < uses.max ? "dot empty has-more" : "dot has-more");
          return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${item.id}" data-idx="${i}"></span>`;
        }, "");
        header.after(div);
      });
    }

    this.html[0].querySelectorAll("[data-action='toggleDot']").forEach(n => n.addEventListener("click", this._onClickDot.bind(this.sheet)));
    this.html[0].querySelectorAll(".dot.has-more").forEach(n => n.addEventListener("wheel", this._onWheelDot.bind(this.sheet)));
  }

  /**
   * Handle clicking a dot.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Actor5e|Item5e}        The updated actor or item.
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
   * Handle using the mouse wheel when hovering over the "has more" dot.
   * @param {WheelEvent} event      The initiating mouse wheel event.
   * @returns {Actor|Item}          The updated actor or item.
   */
  async _onWheelDot(event) {
    const data = event.currentTarget.dataset;
    const target = this.document.items.get(data.itemId) ?? this.document;
    const path = data.spellLevel ? `system.spells.${data.spellLevel}` : "system.uses";
    const current = foundry.utils.getProperty(target, path);
    const value = Math.clamped(current.value + Math.round(event.deltaY / (-100)), 0, current.max);
    return target.update({[`${path}.value`]: value});
  }

  /** Create the foraging button and foraged materials input. */
  async _createForaging() {
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate(`modules/${MODULE}/templates/foragingButton.hbs`, {
      name: `flags.${MODULE}.materia-medica.value`,
      value: this.sheet.document.flags[MODULE]?.["materia-medica"].value ?? 0
    });
    const input = div.querySelector(`[name="flags.${MODULE}.materia-medica.value"]`);
    input.addEventListener("focus", event => event.currentTarget.select());
    input.addEventListener("change", this._onChangeInputDeltaCustom.bind(this.sheet));
    div.querySelector("[data-action]").addEventListener("click", this._onClickForaging.bind(this.sheet));
    this.html[0].querySelector("div.counter.flexrow.exhaustion").after(div.firstChild);
  }

  /**
   * Handle clicking the foraging label.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MateriaMedica}         The rendered crafting app.
   */
  _onClickForaging(event) {
    return new MateriaMedica(this.document, {}).render(true);
  }

  /** Disable the exhaustion input and add a listener to the label. */
  _createExhaustion() {
    this.html[0].querySelector(".counter.flexrow.exhaustion .counter-value input").disabled = true;
    const header = this.html[0].querySelector(".counter.flexrow.exhaustion h4");
    header.classList.add("rollable");
    header.setAttribute("data-action", "updateExhaustion");
    header.addEventListener("click", this._onClickExhaustion.bind(this.sheet));
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
        callback: () => EXHAUSTION.increaseExhaustion(actor)
      },
      down: {
        icon: "<i class='fa-solid fa-arrow-down'></i>",
        label: "Down a Level",
        callback: () => EXHAUSTION.decreaseExhaustion(actor)
      }
    };
    if (level < 1) delete buttons.down;
    if (level > 10) delete buttons.up;

    return new Dialog({
      title: `Exhaustion: ${actor.name}`,
      content: `<p>Adjust your level of exhaustion.</p><p>${effect}</p>`,
      buttons
    }, {
      id: `${MODULE}-exhaustion-dialog-${actor.id}`,
      classes: [MODULE, "exhaustion", "dialog"]
    }).render(true);
  }

  /**
   * Create an anchor next to currencies for easily spending money.
   */
  _createMoneySpender() {
    const converter = this.html[0].querySelector(".currency > h3");
    const template = `
    <h3>Spend
      <a data-action="spendMoney" data-tooltip="Spend Money">
        <i class="fa-solid fa-hand-holding-dollar"></i>
      </a>
    </h3>`;
    const div = document.createElement("DIV");
    div.innerHTML = template;
    div.querySelector("[data-action]").addEventListener("click", this._onClickMoneySpender.bind(this));
    converter.after(...div.children);
  }

  /**
   * Handle clicking the money spending anchor.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MoneySpender}          The rendered money spending app.
   */
  _onClickMoneySpender(event) {
    return new MoneySpender({}, this.sheet.document).render(true);
  }

  /**
   * Custom function that sets a min and max of a type:text input field and runs
   * every time such a field is changed to modify the value using input deltas.
   * @param {InputEvent} event              The initiating event.
   */
  _onChangeInputDeltaCustom(event) {
    const input = event.currentTarget;
    const value = input.value;
    if (["+", "-"].includes(value[0])) {
      const delta = parseFloat(value);
      input.value = Number(foundry.utils.getProperty(this.document, input.name)) + delta;
    } else if (value[0] === "=") input.value = value.slice(1);
    input.value = Math.clamped(input.value, 0, 999);
  }

  /**
   * Create 'New Day' button after Short and Long rest buttons.
   */
  _createNewDay() {
    const lr = this.html[0].querySelector(".rest.long-rest");
    const div = document.createElement("DIV");
    div.innerHTML = "<a class='rest new-day' data-tooltip='DND5E.NewDay'>Day</a>";
    div.querySelector(".new-day").addEventListener("click", this._onClickNewDay.bind(this.sheet));
    lr.after(div.firstChild);
  }

  /**
   * Roll limited uses recharge of all items that recharge on a new day.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Item5e[]}              The array of updated items.
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
}

/**
 * Refreshes the style sheet when a user changes their color settings for various sheet colors
 * such as limited uses, prepared spells, and the color of rarities on magic items.
 */
export function refreshColors() {
  const colors = game.settings.get(MODULE, "colorSettings");
  const rarities = game.settings.get(MODULE, "rarityColorSettings");

  const root = document.querySelector(":root")
  const cssSheet = Object.values(root.parentNode.styleSheets).find(s => {
    return s.href.includes("zhell-custom-stuff/styles/sheetEdits.css");
  });

  const map = Object.values(cssSheet.rules).find(r => r.selectorText === ":root").styleMap;

  for (const key of Object.keys(colors)) {
    if (typeof colors[key] === "string") map.set(`--${key}`, colors[key]);
  }

  for (const key of Object.keys(rarities)) {
    if (typeof rarities[key] === "string") map.set(`--rarity${key.capitalize()}`, rarities[key]);
  }
}
