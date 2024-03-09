export const items = {
  AMULET_OF_EQUILLIBRIUM
};

async function AMULET_OF_EQUILLIBRIUM(item) {
  const {value} = item.system.uses;
  if (!value) {
    ui.notifications.warn("You have no uses remaining on the amulet.");
    return;
  }

  const optionsA = Array.fromRange(value, 1).reduce((acc, e) => acc + `<option value="${e}">${e}`, "");
  const optionsB = Array.fromRange(5, 2).reduce((acc, e) => acc + `<option value="d${e * 2}">d${e * 2}</option>`, "");
  const optionsC = ["cold", "fire", "lightning"].reduce((acc, e) => {
    return acc + `<option value="${e}">${CONFIG.DND5E.damageTypes[e].label}</option>`;
  }, "");
  const content = `
  <p>Select what you are rerolling.</p>
  <form class="dnd5e">
    <div class="form-group">
      <div class="form-fields">
        <select name="number">${optionsA}</select>
        <select name="faces">${optionsB}</select>
        <select name="type">${optionsC}</select>
      </div>
    </div>
  </form>`;

  return Dialog.prompt({
    title: item.name,
    content,
    rejectClose: false,
    label: "Roll",
    callback: async (html, event) => {
      const {number, faces, type} = new FormDataExtended(html[0].querySelector("form")).object;
      await item.update({"system.uses.value": value - Number(number)});
      const clone = item.clone({"system.damage.parts": [[`${number}${faces}`, type]]}, {keepId: true});
      clone.prepareData();
      clone.prepareFinalAttributes();
      return clone.rollDamage({event});
    }
  });
}
