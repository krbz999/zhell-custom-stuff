import {MODULE} from "../../const.mjs";

export class MonsterCatalog extends Application {
  /** @override */
  constructor(initial) {
    super();
    this.initial = initial;
    this.packs = {};
    for (const type of Object.keys(CONFIG.DND5E.creatureTypes)) {
      this.packs[type] = game.packs.get(`zhell-catalogs.monsters-${type}`);
    }
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "monster-catalog",
      classes: [MODULE, "monster-catalog"],
      tabs: [{navSelector: ".tabs", contentSelector: ".content-tabs"}],
      title: "Monster Catalog",
      template: "modules/zhell-custom-stuff/templates/monsterCatalog.hbs",
      resizable: true,
      width: 600,
      height: 900
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action='toggle-collapse']").forEach(n => n.addEventListener("click", this._onToggleCollapse.bind(this)));
  }

  /**
   * Toggle the collapsed state of a section.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onToggleCollapse(event) {
    event.currentTarget.closest(".collapsible").classList.toggle("active");
  }

  /**
   * Helper method to get the icon for a creature type.
   * @returns {object}      An object of strings.
   */
  get icon() {
    return {
      aberration: "dna",
      beast: "paw",
      celestial: "ankh",
      construct: "robot",
      dragon: "dragon",
      elemental: "fire",
      fey: "clover",
      fiend: "tooth",
      giant: "chess-rook",
      humanoid: "person",
      monstrosity: "spaghetti-monster-flying",
      ooze: "droplet",
      plant: "leaf",
      undead: "skull-crossbones"
    };
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.packs = [];

    // Each creature type...
    for (const [key, pack] of Object.entries(this.packs)) {
      const index = await pack.getIndex({
        fields: [
          "system.details.cr",
          "system.attributes.hp.max",
          "system.attributes.ac.flat",
          "system.details.biography.value",
          "system.details.alignment",
          "system.details.source"
        ]
      });

      // Split by CR...
      const monsters = index.reduce((acc, idx) => {
        const cr = idx.system.details.cr;
        if (!acc[cr]) acc[cr] = [];
        acc[cr].push(idx);
        return acc;
      }, {});

      const sections = [];
      for (const [cr, arr] of Object.entries(monsters)) {
        sections.push({
          cr: cr,
          monsters: arr.sort((a, b) => a.name.localeCompare(b.name))
        });
      }
      sections.sort((a, b) => a.cr - b.cr);

      data.packs.push({
        key,
        label: CONFIG.DND5E.creatureTypes[key],
        sections,
        pack: pack.metadata.id,
        icon: this.icon[key]
      });
    }
    return data;
  }

  /** @override */
  async _renderInner(data) {
    if (this.initial) this._tabs[0].active = this.initial;
    return super._renderInner(data);
  }

  /** @override */
  _onChangeTab(event, tabs, active) {
    super._onChangeTab(event, tabs, active);
    this.element[0].querySelector(".content-tabs").scrollTop = 0;
  }

  /**
   * Render this application.
   * @param {string} [initial=null]     The initial tab to render.
   * @returns {MonsterCatalog}          The rendered application.
   */
  static renderMonsterCatalog(initial = null) {
    return new MonsterCatalog(initial).render(true);
  }
}
