import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const misc = {HARNESS_DIVINE_POWER};

async function HARNESS_DIVINE_POWER(item, speaker, actor, token, character, event, args) {
  const maxLevel = Math.ceil(actor.getRollData().attributes.prof / 2);
  const options = ItemMacroHelpers._constructSpellSlotOptions(actor, {missing: true, maxLevel});

  if (!options.length) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return;
  }

  const uses = item.system.uses.value;
  if (!uses) {
    ui.notifications.warn("You have no uses left of Harness Divine Power.");
    return;
  }

  const resourceItem = actor.items.get(item.system.consume.target);
  const resource = resourceItem.system.uses.value;
  if (!resource) {
    ui.notifications.warn("You have no uses left of Channel Divinity.");
    return;
  }

  const content = ItemMacroHelpers._basicFormContent({label: "Spell Slot:", type: "select", options});

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      run: {
        icon: "<i class='fa-solid fa-hand-sparkles'></i>",
        label: "Recover",
        callback: harness
      }
    }
  }).render(true);

  async function harness(html) {
    const key = html[0].querySelector("select").value;
    const path = `system.spells.${key}.value`;
    await actor.update({[path]: foundry.utils.getProperty(actor, path) + 1});
    await actor.updateEmbeddedDocuments("Item", [
      {_id: resourceItem.id, "system.uses.value": resource - 1},
      {_id: item.id, "system.uses.value": uses - 1}
    ]);
    return ChatMessage.create({speaker, content: `${actor.name} recovered a spell slot using ${item.name}.`});
  }
}
