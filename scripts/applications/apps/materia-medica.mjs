const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class MateriaMedica extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actor: null,
    maxRolls: 20,
    position: {
      width: 420,
      height: 700,
    },
    classes: [
      "zhell-custom-stuff",
      "dnd5e2",
      "materia-medica",
    ],
    window: {
      resizable: true,
    },
    actions: {
      craft: MateriaMedica.#craft,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    main: {
      template: "modules/zhell-custom-stuff/templates/materia-craft.hbs",
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `Materia Medica: ${this.actor.name}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get id() {
    return `${ZHELL.id}-materia-medica-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  /* -------------------------------------------------- */

  get actor() {
    return this.options.actor;
  }

  /* -------------------------------------------------- */

  /**
   * The current dc for foraging checks, read from the game settings.
   * @returns {number}
   */
  get #targetValue() {
    return game.settings.get(ZHELL.id, "foragingDC");
  }

  /**
   * The compendium to extract the craftable items from.
   * @returns {CompendiumCollection}
   */
  get #pack() {
    return game.packs.get("zhell-catalogs.items");
  }

  /**
   * The amount of materials available on the actor.
   * @returns {number}
   */
  get #materials() {
    const materials = foundry.utils.getProperty(this.actor, `flags.${ZHELL.id}.materia-medica.value`) ?? 0;
    return Number(materials) || 0;
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const items = await game.packs.get("dnd5e.items").getDocuments({
      type: "consumable",
      system: {
        type: {
          value: "poison",
        },
      },
    });

    const craftingOptions = [];
    for (const item of items) {
      craftingOptions.push({
        legend: item.name,
        label: item.toAnchor().outerHTML,
        uuid: item.uuid,
      });
    }

    const context = {
      craftingOptions: craftingOptions,
    };

    return context;
  }

  /** @inheritdoc */
  async render(...args) {
    this.options.actor.apps[this.id] = this;
    return super.render(...args);
  }

  /** @inheritdoc */
  async close(...args) {
    delete this.options.actor.apps[this.id];
    return super.close(...args);
  }

  /* -------------------------------------------------- */

  /**
   * @this {MateriaMedica}
   * @param {PointerEvent} event      Initiating click event.
   * @param {HTMLElement} target      The element that defined the [data-action].
   */
  static async #craft(event, target) {
    const item = await fromUuid(target.dataset.uuid);
    const cost = 2;
    const can = cost <= this.#materials;
    if (!can) {
      ui.notifications.warn("not enough materials");
      return;
    }

    const existing = this.actor.items.find(item => item._stats.compendiumSource === target.dataset.uuid);

    let resolver;
    if (existing) resolver = () => existing.update({ "system.quantity": existing.system.quantity + 1 });
    else resolver = () => getDocumentClass("Item").create(itemData, { parent: this.actor });

    const itemData = game.items.fromCompendium(item);
    Promise.all([
      resolver(),
      this.actor.update({ [`flags.${ZHELL.id}.materia-medica.value`]: this.#materials - cost }),
    ]);
  }
}
