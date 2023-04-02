import {DEPEND, MODULE} from "../../../const.mjs";
import {_basicFormContent, _getDependencies} from "../../itemMacros.mjs";

export const murk = {SPREAD_THE_KNOWLEDGE, PAST_KNOWLEDGE};

/**
 * Initiate a dialog that lets the user select any number of spells they have available. The
 * spells must each be between level 1 and 5 and have a cast time of 1 action. The sum of the
 * spell levels must not exceed half the character level (rounded up). Scrolls are then created
 * from each of the selected spells and added to the actor's inventory.
 */
async function SPREAD_THE_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  // CONSTANTS
  const maxCombinedSpellLevel = Math.min(10, Math.ceil(actor.system.details.level / 2));
  const options = actor.itemTypes.spell.filter(s => {
    return Number(s.system.level).between(1, 5) && (s.system.activation?.type === "action");
  }).sort((a, b) => {
    return b.name.localeCompare(a.name);
  }).reduce((acc, spell) => {
    return acc + `<option value="${spell.id}">[${spell.system.level}] ${spell.name}</option>`;
  }, "<option value=''>&mdash; Choose a spell &mdash;</option>");
  const template = _basicFormContent({label: "Spell:", type: "select", options});

  const dialog = new Dialog({
    content: `
    <p style="text-align: center;" data-total="0" id="levelTrack">Total level: <strong>0 / ${maxCombinedSpellLevel}</strong></p>
    <button style="margin: 0;" name="add-new-row"><i class="fa-solid fa-plus"></i> Pick one more</button>
    <hr>
    <div name="murk-scroll-boon">${template}</div>`,
    title: "Murk Scrolls",
    buttons: {
      create: {
        icon: "<i class='fa-solid fa-scroll'></i>",
        label: "Create Scrolls",
        callback: async (html) => {
          const tracker = html[0].querySelector("#levelTrack");
          const total = Number(tracker.dataset.total);
          if (!total || total > maxCombinedSpellLevel) {
            ui.notifications.error("Invalid selection.");
            return dialog.render();
          }

          const scrollData = [];
          const path = "flags.concentrationnotifier.data.requiresConcentration";

          for (const {value} of html[0].querySelectorAll("select")) {
            if (!value) continue;
            const spell = actor.items.get(value);
            if (!spell) continue;
            const scroll = await Item.implementation.createScrollFromSpell(spell);
            const itemData = game.items.fromCompendium(scroll);
            foundry.utils.mergeObject(itemData.flags, spell.flags);
            if (spell.system.components.concentration) foundry.utils.setProperty(itemData, path, true);
            itemData.name = itemData.name.replace("Spell Scroll:", "Murk Scroll:");
            scrollData.push(itemData);
          }

          const use = await item.use({}, {configureDialog: false});
          if (!use) return;
          const add = await actor.createEmbeddedDocuments("Item", scrollData);
          return ChatMessage.create({speaker, content: `Created ${add.length} scrolls of Murk.`});
        }
      }
    },
    render: async (html) => {
      const tracker = html[0].querySelector("#levelTrack");
      const form = html[0].querySelector("[name='murk-scroll-boon']");
      html[0].querySelector("button[name='add-new-row']").addEventListener("click", function() {
        const div = document.createElement("DIV");
        div.innerHTML = template;
        form.append(...div.children);
        dialog.setPosition();
      });

      form.addEventListener("change", function() {
        const selects = html[0].querySelectorAll("select");
        const ids = Array.from(selects).map(i => i.value);
        const spells = ids.map(id => actor.items.get(id));
        const total = spells.reduce((acc, s) => {
          const level = s?.system.level ?? 0;
          return acc + Number(level);
        }, 0);
        tracker.innerHTML = `Total level: <strong>${total} / ${maxCombinedSpellLevel}</strong>`;
        tracker.setAttribute("data-total", total);
      });
    }
  }).render(true, {height: "auto"});
}

/**
 * Initiate a dialog to choose between necrotic and fire, then create an effect on the actor
 * with VAE buttons to utilize the temporary item added, allowing the actor to shot their beams.
 */
async function PAST_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();
  const use = await item.use();
  if (!use) return;

  return Dialog.wait({
    title: item.name,
    content: "<p>Choose the damage type of the energy bursts.</p>",
    buttons: {
      necrotic: {
        label: "Necrotic",
        icon: '<i class="fa-solid fa-skull"></i>',
        callback: () => _createEffectData("necrotic")
      },
      fire: {
        label: "Fire",
        icon: '<i class="fa-solid fa-fire"></i>',
        callback: () => _createEffectData("fire")
      }
    }
  });

  async function _createEffectData(type) {
    const effectData = [{
      label: item.name,
      icon: item.img,
      origin: item.uuid,
      duration: {seconds: 60},
      changes: [{key: "flags.dnd5e.concentrationBonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2"}],
      flags: {
        core: {statusId: item.name.slugify({strict: true})},
        "visual-active-effects.data": {
          forceInclude: true,
          intro: "<p>You have assumed the form of Yebraztos the Scrollkeeper.</p>",
          content: item.system.description.value
        },
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
    return new Sequence().effect().file(file).attachTo(token).scaleToObject(2).tieToDocuments(effect).persist().fadeIn(500).fadeOut(500).play();
  }
}
