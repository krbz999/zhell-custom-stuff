export default class CraftingRecipesMenu extends dnd5e.applications.api.Application5e {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    tag: "form",
    id: "crafting-settings-menu",
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
      handler: CraftingRecipesMenu.#handler,
    },
    position: {
      width: 600,
      height: "auto",
    },
    actions: {
      removeRecipe: CraftingRecipesMenu.#removeRecipe,
    },
    window: {
      title: "ZHELL.CRAFTING.RECIPES.title",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    recipes: {
      template: "modules/zhell-custom-stuff/templates/apps/crafting-recipes-menu/recipes.hbs",
      classes: ["scrollable"],
      scrollable: [".recipes-list"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const ctx = context.ctx = {
      recipes: [],
      value: ZHELL.settings.craftingRecipes,
      fields: game.settings.settings.get(`${ZHELL.id}.craftingRecipes`).type.element.fields,
      labels: {
        resources: game.i18n.localize("ZHELL.CRAFTING.RECIPES.itemResources"),
        quantity: game.i18n.localize("ZHELL.CRAFTING.RECIPES.itemQuantity"),
      },
    };

    for (const { uuid, resources, quantity } of ctx.value) {
      const item = fromUuidSync(uuid);
      if (!item) continue;
      ctx.recipes.push({ uuid, resources, quantity });
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    new foundry.applications.ux.DragDrop.implementation({
      dropSelector: ".drop-area, li .content-link",
      callbacks: {
        drop: CraftingRecipesMenu.#drop.bind(this),
      },
    }).bind(this.element);
  }

  /* -------------------------------------------------- */

  /**
   * Handle drop events.
   * @this {CraftingRecipesMenu}
   * @param {DragEvent} event
   */
  static async #drop(event) {
    const { uuid, type } = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (type !== "Item") return;

    const target = event.target;

    const item = await fromUuid(uuid);
    if (item.isEmbedded || !("quantity" in item.system)) return;

    const value = ZHELL.settings.craftingRecipes;
    if (target.classList.contains("content-link")) {
      value[target.closest("[data-idx]").dataset.idx].uuid = uuid;
    } else {
      value.push({ uuid, quantity: item.system.quantity, resources: 1 });
    }

    game.settings.set(ZHELL.id, "craftingRecipes", value).then(() => this.render());
  }

  /* -------------------------------------------------- */

  /**
   * Remove a recipe.
   * @param {PointerEvent} event          The initiating click event.
   * @param {HTMLButtonElement} target    The button that defined the [data-action].
   */
  static #removeRecipe(event, target) {
    const value = ZHELL.settings.craftingRecipes;
    value.splice(Number(target.closest("[data-idx]").dataset.idx), 1);
    game.settings.set(ZHELL.id, "craftingRecipes", value).then(() => this.render());
  }

  /* -------------------------------------------------- */

  /**
   * Handle form submission.
   * @param {Event} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static #handler(event, form, formData) {
    const value = Object.values(foundry.utils.expandObject(formData.object));
    game.settings.set(ZHELL.id, "craftingRecipes", value).then(() => this.render());
  }
}
