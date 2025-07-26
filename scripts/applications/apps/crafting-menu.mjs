/** @import { CraftingItemConfiguration, CraftingActorConfiguration } from "../../_types.mjs" */

export default class CraftingMenu extends dnd5e.applications.api.Application5e {
  constructor({ document, ...options } = {}) {
    if (document?.type !== "character") {
      throw new Error("A CraftingMenu must be created with a character.");
    }

    super(options);
    this.#actor = document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["crafting-menu"],
    tag: "form",
    position: {
      width: 600,
      height: "auto",
    },
    window: {
      title: "ZHELL.CRAFTING.MENU.title",
      contentClasses: ["standard-form"],
    },
    actions: {
      create: CraftingMenu.#create,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    search: {
      template: "modules/zhell-custom-stuff/templates/apps/crafting-menu/search.hbs",
    },
    details: {
      template: "modules/zhell-custom-stuff/templates/apps/crafting-menu/details.hbs",
    },
    recipes: {
      template: "modules/zhell-custom-stuff/templates/apps/crafting-menu/recipes.hbs",
      classes: ["scrollable"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /**
   * The actor performing crafting.
   * @type {foundry.documents.Actor}
   */
  #actor;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get subtitle() {
    return this.#actor.name;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const recipes = await ZHELL.settings.getCraftingRecipes();
    const value = this.#actor.getFlag(ZHELL.id, "crafting.resources") ?? 0;
    Object.assign(context, { ctx: { recipes, value } });

    recipes.forEach(rcp => {
      rcp.link = rcp.item.toAnchor().outerHTML;
      rcp.disabled = rcp.resources > value;
    });

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.#actor.apps[this.id] = this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (!options.isFirstRender) delete parts.search;
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _syncPartState(partId, newElement, priorElement, state) {
    super._syncPartState(partId, newElement, priorElement, state);

    if (partId === "search") {
      const priorSearch = priorElement.querySelector("search input");
      const newSearch = newElement.querySelector("search input");
      if (priorSearch && newSearch) newSearch.value = priorSearch.value;
    }

    else if (partId === "recipes") {
      for (const element of priorElement.querySelectorAll("TBODY TR.hidden")) {
        const uuid = element.dataset.itemUuid;
        const res = element.dataset.itemResources;
        for (const el of newElement.querySelectorAll(`TBODY TR[data-item-uuid="${uuid}"][data-item-resources="${res}"]`)) {
          el.classList.add("hidden");
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);
    if (partId === "search") {
      const input = element.querySelector("search input");
      input.addEventListener("search", CraftingMenu.#onSearch.bind(this));
    }
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Handle search events.
   * @this {CraftingMenu}
   * @param {Event} event   The search event.
   */
  static #onSearch(event) {
    let input;
    let query;
    let resources = Infinity;
    const SearchFilter = foundry.applications.ux.SearchFilter;

    query = input = SearchFilter.cleanQuery(event.currentTarget.value);
    const match = query.match(/(res|resources)([=<>]+)(\d+)/);
    if (match) {
      query = query.replace(match[0], "").trim();
      resources = Number(match[3]);
    }

    const rgx = new RegExp(RegExp.escape(query), "i");
    for (const tr of this.element.querySelectorAll("[data-application-part=recipes] table tbody tr")) {
      let hidden = false;

      if (!input) hidden = false;
      else {
        if (match) {
          const operator = SearchFilter.OPERATORS[{
            "=": "EQUALS",
            "<": "LESS_THAN",
            "<=": "LESS_THAN_EQUAL",
            ">": "GREATER_THAN",
            ">=": "GREATER_THAN_EQUAL",
          }[match[2]]];

          if (operator) {
            const object = { name: tr.dataset.name, resources: Number(tr.dataset.itemResources) };
            const filter = {
              operator,
              value: resources,
              field: "resources",
            };
            if (!SearchFilter.evaluateFilter(object, filter)) hidden = true;
          } else {
            // Hide entries if the operator is invalid.
            hidden = true;
          }
        }

        if (query && !SearchFilter.testQuery(rgx, tr.dataset.name)) hidden = true;
      }

      tr.classList.toggle("hidden", hidden);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle item creation.
   * @this {CraftingMenu}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #create(event, target) {
    const quantity = Number(target.closest("[data-item-quantity]")?.dataset.itemQuantity || 1);
    const resources = Number(target.closest("[data-item-resources]").dataset.itemResources);
    const item = await fromUuid(target.closest("[data-item-uuid]").dataset.itemUuid);

    CraftingMenu.promptItemCreation({ quantity, item }, { resources, actor: this.#actor });
  }

  /* -------------------------------------------------- */
  /*   API                                              */
  /* -------------------------------------------------- */

  /**
   * Consume or receive an amount of resources. It is the responsibility of the caller to ensure
   * that the actor has the required resources available.
   * @param {CraftingActorConfiguration} actorConfig    Actor configuration.
   * @returns {Promise<foundry.documents.Actor>}        A promise that resolves to the updated actor.
   */
  static async consume(actorConfig) {
    const value = actorConfig.actor.getFlag(ZHELL.id, "crafting.resources") ?? 0;
    const resources = actorConfig.resources ?? 1;

    // Cannot consume more than is available.
    if ((resources > 0) && (resources > value)) {
      throw new Error(`Actor [${actorConfig.actor.id}] cannot consume [${resources}] resources. Only ${value} available.`);
    }

    return actorConfig.actor.setFlag(ZHELL.id, "crafting.resources", value - resources);
  }

  /* -------------------------------------------------- */

  /**
   * Create an item.
   * @param {foundry.documents.Actor} actor           The actor receiving the item.
   * @param {CraftingItemConfiguration} itemConfig    Item configuration.
   * @returns {Promise<foundry.documents.Item>}       A promise that resolves to the updated or created item.
   */
  static async create(actor, itemConfig) {
    itemConfig = foundry.utils.mergeObject({ quantity: 1 }, itemConfig);

    const existing = actor.items.find(i => {
      if (i.type !== itemConfig.item.type) return false;
      if (i._stats.compendiumSource === itemConfig.item.uuid) return true;
      if ((i.name === itemConfig.item.name) && (i.identiifer === itemConfig.item.identifier)) return true;
      return false;
    });

    if (existing) {
      const q = existing.system.quantity + itemConfig.quantity;
      return existing.update({ "system.quantity": q });
    }

    const keepId = !actor.items.has(itemConfig.item.id);
    const itemData = game.items.fromCompendium(itemConfig.item, { keepId, clearFolder: true });
    foundry.utils.setProperty(itemData, "system.quantity", itemConfig.quantity);
    return foundry.utils.getDocumentClass("Item").create(itemData, { parent: actor, keepId: true });
  }

  /* -------------------------------------------------- */

  /**
   * Initiate the flow to create an item and deduct resources.
   * @param {CraftingItemConfiguration} itemConfig      Item configuration.
   * @param {CraftingActorConfiguration} actorConfig    Actor configuration.
   * @returns {Promise<foundry.documents.Item|null>}    A promise that resolves to the updated or created item.
   */
  static async promptItemCreation(itemConfig, actorConfig) {
    const value = actorConfig.actor.getFlag(ZHELL.id, "crafting.resources") ?? 0;
    const resources = actorConfig.resources ?? 1;

    // Cannot consume more than is available.
    if ((resources > 0) && (resources > value)) {
      throw new Error(`Actor [${actorConfig.actor.id}] cannot consume [${resources}] resources. Only ${value} available.`);
    }

    // Cannot gain resources.
    if (resources < 0) {
      throw new Error("Cannot gain resources from crafting.");
    }

    const quantity = itemConfig.quantity ?? 1;

    const confirm = await foundry.applications.api.Dialog.confirm({
      window: { title: "ZHELL.CRAFTING.CONFIRM.title" },
      position: { width: 400 },
      content: `<p>${game.i18n.format("ZHELL.CRAFTING.CONFIRM.content", {
        quantity, resources, value,
        item: itemConfig.item.name,
      })}</p>`,
    });
    if (!confirm) return null;

    await CraftingMenu.consume(actorConfig);
    return CraftingMenu.create(actorConfig.actor, itemConfig);
  }
}
