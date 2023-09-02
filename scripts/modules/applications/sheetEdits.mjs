import {COLOR_DEFAULTS, MODULE} from "../../const.mjs";

export class SheetEdits {
  constructor() {
    this.headers = new Set();
  }

  // Inject the new functionality and elements into the sheet.
  async render() {
    this.settings = {
      ...game.settings.get(MODULE, "worldSettings"),
      ...game.settings.get(MODULE, "colorationSettings")
    };
    const isChar = this.sheet.document.type === "character";
    const isGroup = this.sheet.document.type === "group";
    const isNPC = this.sheet.document.type === "npc";

    this._setMagicItemsColor();
    if (!isGroup) this._setHealthColor();
    this._collapsibleHeaders();
    if (isChar || isNPC) this._createDots();
    if (isChar) await this._createCharacterSheetCounters();
    if (isChar) this._createExhaustion();
    if (isChar) this._createNewDay();
    if (isChar) this._createInspirationToggle();
  }

  /** Make 'Inspiration' a toggle. */
  _createInspirationToggle() {
    const insp = this.html[0].querySelector(".inspiration h4");
    insp.classList.add("rollable");
    insp.dataset.action = "inspiration";
    insp.addEventListener("click", this.sheet._onClickInspiration.bind(this.sheet));
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
    if (!b || (a / b > 0.65)) return;

    const node = this.html[0].querySelector("[name='system.attributes.hp.value']");
    node.style.color = dnd5e.documents.Actor5e.getHPColor(a, b).css;
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

    if (this.settings.checks.showSpellSlots) {
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

    if (this.settings.checks.showLimitedUses) {
      actor.items.filter(i => i.hasLimitedUses).forEach(item => {
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

    this.html[0].querySelectorAll("[data-action='toggleDot']").forEach(n => {
      n.addEventListener("click", this.sheet._onClickDot.bind(this.sheet));
    });
  }

  /** Create the foraging button and foraged materials input. */
  async _createCharacterSheetCounters() {
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/character-sheet-counters.hbs", {
      foraged: foundry.utils.getProperty(this.sheet.document, `flags.${MODULE}.materia-medica.value`) || 0,
      totalCurrency: Object.entries(this.sheet.document.system.currency ?? {}).reduce((acc, [key, value]) => {
        return acc + Math.floor(value / CONFIG.DND5E.currencies[key].conversion);
      }, 0)
    });
    div.querySelectorAll("[data-dtype=Number]").forEach(n => {
      n.addEventListener("focus", event => event.currentTarget.select());
      n.addEventListener("change", this._onChangeInputDeltaCustom.bind(this.sheet));
    });
    div.querySelectorAll("[data-action]").forEach(n => {
      switch(n.dataset.action) {
        case "forage": {
          n.addEventListener("click", this.sheet._onClickForaging.bind(this.sheet));
          break;
        }
        case "spend-money": {
          n.addEventListener("click", this.sheet._onClickMoneySpender.bind(this.sheet));
          break;
        }
      }
    });
    this.html[0].querySelector("div.counter.flexrow.exhaustion").after(...div.children);
  }

  /** Disable the exhaustion input and add a listener to the label. */
  _createExhaustion() {
    this.html[0].querySelector(".counter.flexrow.exhaustion .counter-value input").disabled = true;
    const header = this.html[0].querySelector(".counter.flexrow.exhaustion h4");
    header.classList.add("rollable");
    header.setAttribute("data-action", "updateExhaustion");
    header.addEventListener("click", this.sheet._onClickExhaustion.bind(this.sheet));
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
    div.querySelector(".new-day").addEventListener("click", this.sheet._onClickNewDay.bind(this.sheet));
    lr.after(div.firstChild);
  }

  static _performSheetEdits(sheet, html) {
    if (!sheet.sheetEdits) {
      const edits = new SheetEdits();
      sheet.sheetEdits = edits;
      edits.sheet = sheet;
      edits.html = html;
    } else {
      sheet.sheetEdits.html = html;
    }
    const e = sheet.sheetEdits;
    e.render();
  }

  /**
   * Refreshes the style sheet when a user changes their color settings for various sheet colors
   * such as limited uses, prepared spells, and the color of rarities on magic items.
   */
  static refreshColors() {
    const colors = game.settings.get(MODULE, "colorationSettings");
    const stl = document.querySelector(":root").style;
    for (const key of Object.keys(COLOR_DEFAULTS.sheetColors)) stl.setProperty(`--${key}`, colors.sheetColors[key]);
    for (const key of Object.keys(COLOR_DEFAULTS.rarityColors)) stl.setProperty(`--rarity${key.capitalize()}`, colors.rarityColors[key]);
  }
}
