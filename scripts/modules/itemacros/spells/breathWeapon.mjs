import {elementalDialog} from "../../customDialogs.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function BREATH_WEAPON(item) {
  const options = [["cone", "Cone (30ft)"], ["line", "Line (60ft)"]].reduce((acc, e) => {
    return acc + `<option value="${e[0]}">${e[1]}</option>`;
  }, "");
  const template = await Dialog.prompt({
    title: item.name,
    content: ItemMacroHelpers._basicFormContent({label: "Template Type:", type: "select", options}),
    rejectClose: false,
    label: "Continue",
    callback: (html) => html[0].querySelector("select").value
  });
  if (!template) return;

  const breaths = ["acid", "cold", "fire", "lightning", "poison"];

  const type = await elementalDialog({
    types: breaths,
    content: "Choose the damage type.",
    title: item.name
  });
  if (!type) return;
  const target = {
    line: {value: 60, units: "ft", type: "line", width: 5},
    cone: {value: 30, units: "ft", type: "cone", width: ""}
  }[template];
  const clone = item.clone({"system.target": target}, {keepId: true});
  clone.prepareData();
  clone.prepareFinalAttributes();
  return clone.use({}, {"flags.dnd5e.itemData": clone.toObject()});
}
