import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const paladin = {DIVINE_SMITE, LAY_ON_HANDS};

async function DIVINE_SMITE(item, speaker, actor, token, character, event, args) {
  const options = ItemMacroHelpers._constructSpellSlotOptions(actor);
  if (!options.length) {
    ui.notifications.warn("You have no spell slots remaining.");
    return;
  }
  const content = `
  <form>
    <div class="form-group">
      <label>Spell Slot:</label>
      <div class="form-fields">
        <select id="divine-smite-slot" autofocus>${options}</select>
        <input type="checkbox" id="divine-smite-extra">
        <label for="divine-smite-extra" style="white-space: nowrap;">Extra die</label>
      </div>
    </div>
  </form>`;

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      smite: {
        label: "Smite!",
        icon: "<i class='fa-solid fa-gavel'></i>",
        callback: rollDamage
      }
    }
  }).render(true);

  async function rollDamage(html, event) {
    const slot = html[0].querySelector("#divine-smite-slot").value;
    const extra = html[0].querySelector("#divine-smite-extra").checked;
    const level = slot === "pact" ? actor.system.spells["pact"].level : Number(slot.at(-1));
    const dice = Math.min(5, 1 + level) + (extra ? 1 : 0);
    const formula = `${dice}d8`;

    const roll = await new Item.implementation({
      type: "feat",
      name: item.name,
      system: {damage: {parts: [[formula, "radiant"]]}}
    }, {parent: actor}).rollDamage({event});
    if (!roll) return;
    const value = actor.system.spells[slot].value - 1;
    return actor.update({[`system.spells.${slot}.value`]: value});
  }
}

async function LAY_ON_HANDS(item, speaker, actor, token, character, event, args) {
  const value = item.system.uses.value;
  if (!value) {
    ui.notifications.warn(game.i18n.format("DND5E.ItemNoUses", {name: item.name}));
    return;
  }

  const range = HandlebarsHelpers.rangePicker({
    hash: {min: 1, max: value, value: 1, step: 1, name: item.name.slugify({strict: true})}
  });

  const content = `
  ${item.system.description.value}
  <form>
    <div class="form-group">
      <label>Hit points to restore:</label>
      <div class="form-fields">${range}</div>
    </div>
  </form>`;

  const buttons = {
    heal: {
      icon: "<i class='fa-solid fa-hand-holding-heart'></i>",
      label: "Heal! (<span data-attr='lay'>1+</span>)",
      callback: heal
    },
    cure: {
      icon: "<i class='fa-solid fa-virus'></i>",
      label: "Cure! (5)",
      callback: cure
    }
  }
  if (value < 5) delete buttons.cure;

  return new Dialog({
    title: item.name,
    content,
    buttons,
    render: (html) => {
      const range = html[0].querySelector("input");
      const target = html[0].querySelector(".range-value");
      const button = range.closest(".window-content").querySelector("[data-attr='lay']");
      range.addEventListener("change", function(event) {
        target.innerText = event.currentTarget.value;
        button.innerText = event.currentTarget.value;
      });
    }
  }).render(true);

  async function heal(html) {
    const number = Number(html[0].querySelector("input").value);
    await new Roll(`${number}`).toMessage({speaker, flavor: item.name});
    return item.update({"system.uses.value": value - number});
  }

  async function cure() {
    await ChatMessage.create({speaker, content: `${actor.name} cures a disease or poison.`});
    return item.update({"system.uses.value": value - 5});
  }
}
