import {MODULE} from "../../const.mjs";

export class ClassPages extends Application {
  static ASSET_PATH = "assets/images/art/classes/";
  static CLASS_KEY = "zhell-catalogs.classes";
  static SUBCLASS_KEY = "zhell-catalogs.subclasses";
  static SPELLS_KEY = "zhell-catalogs.spells";

  constructor(initial) {
    super();
    this.initial = initial;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "class-pages",
      classes: [MODULE, "class-pages"],
      tabs: [],
      title: "ZHELL.ClassPages",
      template: "modules/zhell-custom-stuff/templates/class-pages.hbs",
      resizable: true,
      height: 1000,
      width: 800
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action='toggle-item']").forEach(n => {
      n.addEventListener("click", this._onToggleItem.bind(this));
    });
  }

  /**
   * Toggle the description of an item.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onToggleItem(event) {
    const target = event.currentTarget;
    if (event.target.closest(".content-link, .item")) return;
    const uuid = target.dataset.uuid;
    if (target.classList.contains("expanded")) {
      const summary = target.parentNode.querySelector(".item-summary");
      if (summary) summary.remove();
    } else {
      const item = await fromUuid(uuid);
      const data = await item.getChatData();
      const div = document.createElement("DIV");
      div.innerHTML = await renderTemplate("systems/dnd5e/templates/items/parts/item-summary.hbs", data);
      div.firstElementChild.setAttribute("data-uuid", uuid);
      target.after(div.firstElementChild);
    }
    target.classList.toggle("expanded");
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    const getIndex = async (key, fields = []) => game.packs.get(key).getIndex({fields: [...fields, "system.description.value"]});
    const nameSort = (a, b) => a.name.localeCompare(b.name);

    const indices = await Promise.all([
      getIndex(ClassPages.CLASS_KEY, ["system.identifier"]),
      getIndex(ClassPages.SUBCLASS_KEY, ["system.classIdentifier"]),
      getIndex(ClassPages.SPELLS_KEY, ["system.level", "system.school"])
    ]);

    // Array of classes, sorted alphabetically.
    this.classes = data.classes = await Promise.all(indices[0].map(c => this._enrichData(c, {
      //name: c.name,
      pack: ClassPages.CLASS_KEY,
      identifier: c.system.identifier,
      subclassLabel: game.i18n.localize(`ZHELL.SubclassLabel${c.system.identifier.capitalize()}`)
    })));

    // Subclasses split by class identifier.
    const subclasses = await Promise.all(indices[1].map(s => this._enrichData(s, {pack: ClassPages.SUBCLASS_KEY})));
    const subclassIds = subclasses.reduce((acc, idx) => {
      const key = idx.system.classIdentifier;
      if (!data.classes.some(c => c.identifier === key)) {
        console.warn(`The subclass '${idx.name}' has no matching class with class identifier '${key}'.`);
        return acc;
      }
      acc[key] ??= [];
      acc[key].push(idx);
      return acc;
    }, {});

    const setting = game.settings.get(MODULE, "spell-lists") ?? {};
    for (const c of data.classes) {
      // Add all subclasses to the class.
      c.subclasses = subclassIds[c.identifier].sort(nameSort);
      c.backdrop = ClassPages.ASSET_PATH + c.identifier + ".webp";

      // Retrieve and enrich spell descriptions.
      const spellIds = setting[c.identifier] ?? [];
      const _spells = spellIds.reduce((acc, id) => {
        const idx = indices[2].get(id);
        if (idx) acc.push(idx);
        return acc;
      }, []);

      // Create empty arrays.
      c.spellLists = Object.entries(CONFIG.DND5E.spellLevels).map(([n, label]) => ({level: n, label, spells: []}));

      // Push to array, partitioned by spell level.
      for (const spell of _spells) {
        const {level, school} = spell.system;
        if (!(level in CONFIG.DND5E.spellLevels) || !(school in CONFIG.DND5E.spellSchools)) {
          console.warn(`The spell '${spell.name}' has an invalid spell school ('${school}') or spell level ('${level}').`);
          continue;
        }
        c.spellLists[spell.system.level].spells.push(spell);
      }

      // Sort the spells.
      for (const key in c.spellLists) c.spellLists[key].spells.sort(nameSort)
      c.hasSpells = _spells.length > 0;
    }

    // Sort the classes.
    data.classes.sort(nameSort);
    return data;
  }

  /**
   * Utility function to batch enrich an index entry.
   * @param {CompendiumIndex} idx         One entry from a compendium's index.
   * @param {object} [additional={}]      Additional keys to add.
   * @returns {Promise<object>}
   */
  async _enrichData(idx, additional = {}) {
    const desc = await TextEditor.enrichHTML(idx.system.description.value);
    return {...idx, id: idx._id, desc, ...additional};
  }

  /** @override */
  async _renderInner(data) {
    const tabs = [{
      group: "page",
      navSelector: ".tabs[data-group=page]",
      contentSelector: ".page",
      initial: this.initial
    }];
    for (const cls of data.classes) {
      const id = cls.identifier;
      tabs.push({
        group: id,
        navSelector: `[data-tab='${id}'] .tabs[data-group=subpage]`,
        contentSelector: `[data-group=page][data-tab='${id}'] .subpage`
      }, {
        group: "spells",
        navSelector: `[data-group=page][data-tab='${id}'] .subpage .tabs[data-group=subsubpage]`,
        contentSelector: `[data-tab='${id}'] .subsubpage`
      });
    }
    this.options.tabs = tabs;
    this._tabs = this._createTabHandlers();
    return super._renderInner(data);
  }

  /**
   * Render this application.
   * @param {string} [initial=null]     The initial tab to render.
   * @returns {ClassPages}       The rendered application.
   */
  static show(initial = null) {
    const active = Object.values(ui.windows).find(w => w instanceof ClassPages);
    if (active) return active.render();
    return new ClassPages(initial).render(true);
  }

  /** @override */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (game.user.isGM) {
      buttons.unshift({
        class: "class-pages-config",
        icon: "fa-solid fa-rectangle-list",
        label: "ZHELL.ClassPagesConfig",
        onclick: () => {
          new ClassPagesConfig(this.classes, this).render(true);
        }
      }, {
        class: "class-pages-config-backup",
        icon: "fa-solid fa-download",
        label: "ZHELL.ClassPagesConfigDownload",
        onclick: () => {
          const data = JSON.stringify(game.settings.get(MODULE, "spell-lists") ?? {});
          const type = "application/json";
          const name = "spell-list-backup-" + Date.now();
          return saveDataToFile(data, type, name);
        }
      });
    }
    return buttons;
  }
}

/* Utility class for configuring spell lists. */
class ClassPagesConfig extends FormApplication {
  constructor(classes = [], pages) {
    super();
    this.classes = classes;
    this.pages = pages;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: "auto",
      template: "modules/zhell-custom-stuff/templates/class-pages-config.hbs",
      classes: [MODULE, "class-pages-config"],
      title: "ZHELL.ClassPagesConfig"
    });
  }

  /** @override */
  async _updateObject(event, formData) {
    for (const c in formData) formData[c] = formData[c].filter(u => u);
    await game.settings.set(MODULE, "spell-lists", formData);
    this.pages.render();
  }

  /** @override */
  async getData() {
    const key = this.pages.constructor.SPELLS_KEY;
    const index = game.packs.get(key).index;
    const setting = game.settings.get(MODULE, "spell-lists") ?? {};

    const classes = {};
    for (const c of this.classes) {
      const list = setting[c.identifier] ?? [];
      classes[c.identifier] = {list, label: c.name};
    }

    const spells = [];
    for (const idx of index) {
      if (idx.type !== "spell") continue;
      const spell = {...idx, classes: {}};
      for (const c in classes) spell.classes[c] = classes[c].list.includes(idx._id);
      spells.push(spell);
    }

    spells.sort((a, b) => a.name.localeCompare(b.name));

    return {spells, classes: this.classes};
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action=render]").forEach(n => {
      n.addEventListener("click", this._onClickRender.bind(this));
    });
  }

  /** @override */
  async _onClickRender(event) {
    const uuid = event.currentTarget.closest("[data-uuid]").dataset.uuid;
    const item = await fromUuid(uuid);
    return item.sheet.render(true);
  }
}
