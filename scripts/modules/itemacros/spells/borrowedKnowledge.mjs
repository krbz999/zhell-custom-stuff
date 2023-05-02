import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function BORROWED_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  const options = Object.entries(actor.system.skills).reduce((acc, [id, {value}]) => {
    if (value > 0) return acc;
    const name = CONFIG.DND5E.skills[id].label;
    return acc + `<option value="${id}">${name}</option>`;
  }, "");

  const skl = await Dialog.prompt({
    title: item.name,
    rejectClose: false,
    label: "Cast",
    content: ItemMacroHelpers._basicFormContent({label: "Choose a skill:", type: "select", options}),
    callback: (html) => html[0].querySelector("select").value
  });
  if (!skl) return;

  const has = actor.effects.find(e => e.statuses.has(item.name.slugify({strict: true})));
  if (has) await has.delete();

  return actor.createEmbeddedDocuments("ActiveEffect", [{
    name: item.name,
    icon: item.img,
    duration: ItemMacroHelpers._getItemDuration(item),
    changes: [{key: `system.skills.${skl}.value`, mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 1}],
    statuses: [item.name.slugify({strict: true})],
    description: `You have proficiency in the ${CONFIG.DND5E.skills[skl].label} skill.`,
    "flags.visual-active-effects.data.content": item.system.description.value
  }]);
}
