import CraftingRecipesMenu from "../applications/apps/crafting-recipes-menu.mjs";

const { ArrayField, BooleanField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

export default class ModuleSettings {
  /**
   * Module settings configurations.
   * @type {Record<string, object>}
   */
  static CONFIGURATION = {
    trackReactions: {
      name: "TRACK_REACTIONS.NAME",
      hint: "TRACK_REACTIONS.HINT",
      scope: "world",
      config: true,
      type: new NumberField({
        initial: 1,
        choices: {
          0: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_NONE",
          1: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_GM_ONLY",
          2: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_ALL",
        },
      }),
      requiresReload: false,
    },
    craftingRecipesMenu: {
      name: "CRAFTING.NAME",
      hint: "CRAFTING.HINT",
      label: "CRAFTING.LABEL",
      icon: "fa-solid fa-volcano",
      type: CraftingRecipesMenu,
      restricted: true,
      menu: true,
    },
    craftingRecipes: {
      config: false,
      scope: "world",
      type: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ type: "Item", embedded: false, blank: false, required: true }),
        resources: new NumberField({ initial: 1, integer: true, min: 1, nullable: false }),
        quantity: new NumberField({ initial: 1, integer: true, min: 1, nullable: false }),
      })),
    },
  };

  /* -------------------------------------------------- */

  /**
   * Register settings.
   */
  register() {
    for (const [id, { name, hint, label, menu = false, ...config }] of Object.entries(ModuleSettings.CONFIGURATION)) {
      if (menu) {
        game.settings.registerMenu(ZHELL.id, id, {
          ...config,
          name: `ZHELL.SETTINGS.${name}`,
          hint: `ZHELL.SETTINGS.${hint}`,
          label: `ZHELL.SETTINGS.${label}`,
        });
      } else {
        game.settings.register(ZHELL.id, id, {
          ...config,
          name: config.config ? `ZHELL.SETTINGS.${name}` : undefined,
          hint: config.config ? `ZHELL.SETTINGS.${hint}` : undefined,
        });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Configured crafting recipes.
   * @type {{uuid: string, resources: number, quantity: number}[]}
   */
  get craftingRecipes() {
    return game.settings.get(ZHELL.id, "craftingRecipes");
  }

  /* -------------------------------------------------- */

  /**
   * Get fully configured and valid crafting recipes.
   * @returns {Promise<{item: foundry.documents.Item|object, resources: number, quantity: number}[]>}
   */
  async getCraftingRecipes() {
    const retrieve = async ({ uuid, resources, quantity }) => {
      const item = fromUuidSync(uuid);
      if (!item) return null;
      return { item, resources, quantity };
    };

    const recipes = [];
    for (const recipe of this.craftingRecipes) recipes.push(retrieve(recipe));
    return Promise.all(recipes).then(results => results.filter(_ => _));
  }

  /* -------------------------------------------------- */

  /**
   * Should reactions be tracked for this actor?
   * @param {Actor5e} actor   The actor.
   * @returns {boolean}
   */
  trackReactions(actor) {
    switch (game.settings.get(ZHELL.id, "trackReactions")) {
      case 0:
        return false;
      case 1:
        return !actor.hasPlayerOwner;
      case 2:
        return true;
    }
  }
}
