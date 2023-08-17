import {DEPEND, MODULE} from "../../../const.mjs";
import {MurkScroller} from "../../applications/murkScroller.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const murk = {SPREAD_THE_KNOWLEDGE, PAST_KNOWLEDGE};

/**
 * Initiate a dialog that lets the user select any number of spells they have available. The
 * spells must each be between level 1 and 5 and have a cast time of 1 action. The sum of the
 * spell levels must not exceed half the character level (rounded up). Scrolls are then created
 * from each of the selected spells and added to the actor's inventory.
 */
async function SPREAD_THE_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  const itemIds = await MurkScroller.wait({actor});
  if (!itemIds) return;

  const use = await item.use({}, {configureDialog: false});
  if (!use) return;

  const itemData = await Promise.all(itemIds.map(id => createMurkScroll(id)));
  const scrolls = await actor.createEmbeddedDocuments("Item", itemData);
  const list = scrolls.reduce((acc, s) => acc + `<li>${s.link}</li>`, "<ul>") + "</ul>";
  return ChatMessage.create({
    speaker,
    content: `${actor.name} created ${scrolls.length} scrolls of Murk. ${list}`
  });

  /**
   * Helper function to create item data for a spell scroll.
   * @param {string} itemId         The id of the actor's item copying onto a scroll.
   * @returns {Promise<object>}     A promise that resolves into item data.
   */
  async function createMurkScroll(itemId) {
    const item = actor.items.get(itemId);
    const data = {flags: item.flags, name: `Murk Scroll: ${item.name}`};
    const scroll = await Item.implementation.createScrollFromSpell(item, data);
    return game.items.fromCompendium(scroll, {addFlags: false});
  }
}

/**
 * Initiate a dialog to choose between necrotic and fire, then create an effect on the actor
 * with VAE buttons to utilize the temporary item added, allowing the actor to shot their beams.
 */
async function PAST_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();
  const use = await item.use();
  if (!use) return;

  return new Dialog({
    title: item.name,
    content: "<p>Choose the damage type of the energy bursts.</p>",
    buttons: {
      necrotic: {
        label: "Necrotic",
        icon: '<i class="fa-solid fa-skull"></i>',
        callback: _createEffectData
      },
      fire: {
        label: "Fire",
        icon: '<i class="fa-solid fa-fire"></i>',
        callback: _createEffectData
      }
    }
  }).render(true);

  async function _createEffectData(html, event) {
    const type = event.currentTarget.dataset.button;
    const effectData = [{
      name: item.name,
      icon: item.img,
      origin: item.uuid,
      duration: {seconds: 60},
      changes: [{key: "flags.dnd5e.concentrationBonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2"}],
      statuses: [item.name.slugify({strict: true})],
      description: "You have assumed the form of Yebraztos the Scrollkeeper.",
      flags: {
        "visual-active-effects.data": {forceInclude: true, content: item.system.description.value},
        [MODULE]: {
          itemData: {
            name: "Energy Burst",
            type: "feat",
            img: "icons/magic/fire/beam-jet-stream-embers.webp",
            system: {
              description: {value: item.system.description.value},
              activation: {type: "bonus", cost: 1},
              duration: {units: "inst"},
              target: {value: 1, type: "creature"},
              range: {value: 60, units: "ft"},
              ability: "wis",
              actionType: "rsak",
              damage: {parts: [["2d8 + @mod", type]]}
            }
          },
          types: ["use", "attack", "damage"]
        }
      }
    }];
    const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);
    const color = {necrotic: "purple", fire: "orange"}[type];
    const file = `jb2a.token_border.circle.spinning.${color}.006`;
    return new Sequence()
      .effect().file(file).attachTo(token).scaleToObject(2).tieToDocuments(effect).persist().fadeIn(500).fadeOut(500)
      .play({remote: true});
  }
}
