import {MurkScroller} from "../../applications/murkScroller.mjs";

export const murk = {SPREAD_THE_KNOWLEDGE};

/**
 * Initiate a dialog that lets the user select any number of spells they have available. The
 * spells must each be between level 1 and 5 and have a cast time of 1 action. The sum of the
 * spell levels must not exceed half the character level (rounded up). Scrolls are then created
 * from each of the selected spells and added to the actor's inventory.
 */
async function SPREAD_THE_KNOWLEDGE(item) {
  const itemIds = await MurkScroller.wait({actor: item.actor});
  if (!itemIds) return;

  const use = await item.use();
  if (!use) return;

  const itemData = await Promise.all(itemIds.map(id => createMurkScroll(id)));
  const scrolls = await item.actor.createEmbeddedDocuments("Item", itemData);
  const list = scrolls.reduce((acc, s) => acc + `<li>${s.link}</li>`, "<ul>") + "</ul>";
  return ChatMessage.create({
    speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
    content: `${item.actor.name} created ${scrolls.length} scrolls of Murk. ${list}`
  });

  /**
   * Helper function to create item data for a spell scroll.
   * @param {string} itemId         The id of the actor's item copying onto a scroll.
   * @returns {Promise<object>}     A promise that resolves into item data.
   */
  async function createMurkScroll(itemId) {
    const item = item.actor.items.get(itemId);
    const data = {flags: item.flags, name: `Murk Scroll: ${item.name}`};
    const scroll = await Item.implementation.createScrollFromSpell(item, data);
    return game.items.fromCompendium(scroll, {addFlags: false});
  }
}
