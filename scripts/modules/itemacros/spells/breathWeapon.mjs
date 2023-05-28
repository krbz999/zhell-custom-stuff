import {MODULE} from "../../../const.mjs";
import {elementalDialog} from "../../customDialogs.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function BREATH_WEAPON(item, speaker, actor, token, character, event, args) {
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

  const breaths = {
    line: {
      acid: "jb2a.breath_weapons.acid.line.green",
      cold: "jb2a.breath_weapons.acid.line.blue",
      fire: "jb2a.breath_weapons.fire.line.orange",
      lightning: "jb2a.breath_weapons.lightning.line.purple",
      poison: "jb2a.breath_weapons.fire.line.purple"
    },
    cone: {
      acid: "jb2a.breath_weapons.fire.cone.green.02",
      cold: "jb2a.breath_weapons.cold.cone.blue",
      fire: "jb2a.breath_weapons.fire.cone.orange.02",
      lightning: "jb2a.breath_weapons.fire.cone.blue.02",
      poison: "jb2a.breath_weapons.poison.cone.green"
    }
  };

  const type = await elementalDialog({
    types: Object.keys(breaths.line),
    content: "Choose the damage type.",
    title: item.name
  });
  if (!type) return;

  const file = breaths[template][type];
  await item.setFlag(MODULE, "breathWeapon", {type: file, template});
  const target = {
    line: {value: 60, units: "ft", type: "line", width: 5},
    cone: {value: 30, units: "ft", type: "cone", width: ""}
  }[template];
  const clone = item.clone({"system.target": target}, {keepId: true});
  clone.prepareFinalAttributes();
  return clone.use({}, {"flags.dnd5e.itemData": clone.toObject()});
}
