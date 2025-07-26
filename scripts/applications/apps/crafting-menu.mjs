/** @import { CraftingItemConfiguration, CraftingActorConfiguration } from "../../_types.mjs" */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class CraftingMenu extends HandlebarsApplicationMixin(Application) {
  /* -------------------------------------------------- */
  /*   API                                              */
  /* -------------------------------------------------- */

  /**
   * Consume or receive an amount of resources.
   * @param {foundry.documents.Actor} actor         The actor.
   * @param {number} resources                      The amount to consume. Can be negative.
   * @returns {Promise<foundry.documents.Actor>}    A promise that resolves to the updated actor.
   */
  static async consume(actor, resources) {
    const value = actor.getFlag(ZHELL.id, "crafting.resources") ?? 0;

    // Cannot consume more than is available.
    if ((resources > 0) && (resources > value)) {
      throw new Error(`Actor [${actor.id}] cannot consume [${resources}] resources. Only ${value} available.`);
    }

    return actor.setFlag(ZHELL.id, "crafting.resources", value - resources);
  }

  /* -------------------------------------------------- */

  /**
   * Create and item and deduct resources. It is the responsibility of the caller to ensure
   * that the actor has the required resources available.
   * @param {CraftingItemConfiguration} itemConfig      Item configuration.
   * @param {CraftingActorConfiguration} actorConfig    Actor configuration.
   * @returns {Promise<foundry.documents.Item>}         A promise that resolves to the updated or created item.
   */
  static async craftItem(itemConfig, actorConfig) {
    itemConfig = foundry.utils.mergeObject({ quantity: 1 }, itemConfig);
    actorConfig = foundry.utils.mergeObject({ resources: 1 }, actorConfig);

    await CraftingMenu.consume(actorConfig.actor, actorConfig.resources);
    const existing = actorConfig.actor.items.find(i => {
      if (i.type !== itemConfig.item.type) return false;
      if (i._stats.compendiumSource === itemConfig.item.uuid) return true;
      if ((i.name === itemConfig.item.name) && (i.identiifer === itemConfig.item.identifier)) return true;
      return false;
    });

    if (existing) {
      const q = existing.system.quantity + itemConfig.quantity;
      return existing.update({ "system.quantity": q });
    }

    const keepId = !actorConfig.actor.items.has(itemConfig.item.id);
    const itemData = game.items.fromCompendium(itemConfig.item, { keepId, clearFolder: true });
    foundry.utils.setProperty(itemData, "system.quantity", itemConfig.quantity);
    return foundry.utils.getDocumentClass("Item").create(itemData, { parent: actorConfig.actor, keepId: true });
  }
}
