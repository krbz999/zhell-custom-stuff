export const wizard = {ARCANE_RECOVERY};

async function ARCANE_RECOVERY(item, speaker, actor, token, character, event, args) {
  const maxSum = Math.ceil(actor.classes.wizard.system.levels / 2);

  // bail out if you can't use this item again.
  const available = item.system.uses.value > 0;
  if (!available) {
    ui.notifications.warn("DND5E.AbilityUseUnavailableHint", {localize: true});
    return;
  }

  // creating the form.
  const levels = Object.entries(actor.system.spells).reduce((acc, [key, values]) => {
    const level = key === "pact" ? values.level : Number(key.at(-1));
    if (!level.between(1, 6) || values.max < 1) return acc;
    const slots = Array.fromRange(values.max).reduce((ac, n) => {
      const cd = (n < values.value) ? "checked disabled" : "";
      return ac + `<input type="checkbox" data-key="${key}" data-level="${level}" ${cd}>`
    }, "");
    const label = key === "pact" ? "Pact Slots" : game.i18n.localize("DND5E.SpellLevel" + level);
    return acc + `<div class="form-group"><label>${label}</label><div class="form-fields">${slots}</div></div>`;
  }, "");

  if (!levels.length) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  let spent = 0;

  const dialog = new Dialog({
    title: item.name,
    content: `
    <p name="header">Recovering spell slots: <strong>${spent}</strong> / ${maxSum}.</p>
    <form>${levels}</form>`,
    buttons: {
      recover: {
        icon: '<i class="fa-solid fa-hand-sparkles"></i>',
        label: "Recover",
        callback: recover
      }
    },
    render: listeners
  }).render(true);

  async function listeners(html) {
    const head = html[0].querySelector("[name=header]");
    html[0].querySelectorAll("[type=checkbox]").forEach(n => n.addEventListener("change", function(event) {
      const {checked, dataset} = event.currentTarget;
      spent = checked ? (spent + Number(dataset.level)) : spent - Number(dataset.level);
      const hint = `Recovering spell slots: <strong>${spent}</strong> / ${maxSum}`;
      head.innerHTML = hint;
    }));
  }

  async function recover(html) {
    if (!spent.between(1, maxSum)) {
      ui.notifications.warn("Invalid number of slots to recover.");
      spent = 0;
      return dialog.render(true);
    }

    const inputs = html[0].querySelectorAll("input:not(:disabled):checked");
    const update = actor.toObject().system.spells;
    for (const input of inputs) update[input.dataset.key].value++;
    await actor.update({"system.spells": update});
    return ChatMessage.create({speaker, content: `${actor.name} recovered spell slots using ${item.name}`});
  }
}
