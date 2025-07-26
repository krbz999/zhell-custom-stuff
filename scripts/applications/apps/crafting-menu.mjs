/** @import { CraftingItemConfiguration, CraftingActorConfiguration } from "../../_types.mjs" */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class CraftingMenu extends HandlebarsApplicationMixin(Application) {
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
