import {MODULE} from "../../const.mjs";

export class MonsterCatalog extends Application {
  /** @override */
  constructor() {
    let packKeys = [];
    let packs = [];
    try {
      packKeys = game.settings.get(MODULE, "identifierSettings")["monster-catalog-key"];
      packs = packKeys.reduce((acc, key) => {
        const pack = game.packs.get(key);
        if (pack && (pack.metadata.type === "Actor")) acc.push(pack);
        return acc;
      }, []);
    } catch {}
    if (!packs.length) {
      ui.notifications.warn("You have not added any valid compendium keys to the catalog setting!");
    } else {
      super();
      this.packs = packs;
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
      undead: "skull-crossbones",
      other: "question"
    };
  }

  /** @override */
  async getData() {
    const data = await super.getData();

    // Get all monsters.
    const monsters = [];
    for (const pack of this.packs) {
      if (!pack) continue;
      const idx = await pack.getIndex({
        fields: [
          "system.details.cr",
          "system.attributes.hp.max",
          "system.attributes.ac.flat",
          "system.details.biography.value",
          "system.details.alignment",
          "system.details.source",
          "system.details.type.value"
        ]
      });
      idx.forEach(i => i.pack = pack.metadata.id);
      monsters.push(...idx);
    }

    data.types = [];
    for (const m of monsters) {
      if (m.type !== "npc") continue;
      const cr = m.system.details.cr;
      const _type = m.system.details.type.value;
      const type = (_type in CONFIG.DND5E.creatureTypes) ? _type : "other";
      let section = data.types.find(e => (e.key === type));
      if (!section) {
        section = {
          key: type,
          label: CONFIG.DND5E.creatureTypes[type] || "Other",
          icon: this.icon[type],
          ratings: []
        };
        data.types.push(section);
      }
      let ratingGroup = section.ratings.find(e => (e.cr === cr));
      if (!ratingGroup) {
        ratingGroup = {cr: cr, monsters: []};
        section.ratings.push(ratingGroup);
      }
      ratingGroup.monsters.push(m);
    }

    for (const val of data.types) {
      val.ratings.sort((a, b) => a.cr - b.cr);
      for (const m of val.ratings) {
        if (m.cr == 0.125) m.cr = "1/8";
        else if (m.cr == 0.25) m.cr = "1/4";
        else if (m.cr == 0.5) m.cr = "1/2";
        m.monsters.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return data;
  }

  /** @override */
  _onChangeTab(event, tabs, active) {
    super._onChangeTab(event, tabs, active);
    this.element[0].querySelector(".content-tabs").scrollTop = 0;
  }

  /**
   * Render this application.
   * @returns {MonsterCatalog}      The rendered application.
   */
  static renderMonsterCatalog() {
    return new MonsterCatalog().render(true);
  }
}
