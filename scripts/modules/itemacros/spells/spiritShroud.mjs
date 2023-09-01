import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function SPIRIT_SHROUD(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN, DEPEND.VAE)) return item.use();

  const use = await item.use();
  if (!use) return;

  const buttons = [
    {icon: "snowflake", type: "cold"},
    {icon: "skull", type: "necrotic"},
    {icon: "holly-berry", type: "radiant"}
  ].reduce((acc, {icon, type}) => {
    acc[type] = {
      icon: `<i class="fa-solid fa-${icon}"></i>`,
      label: CONFIG.DND5E.damageTypes[type],
      callback: flagEffect
    };
    return acc;
  }, {});

  return new Dialog({
    title: item.name,
    content: "<p style='text-align:center'>Pick a damage type.</p>",
    buttons
  }).render(true);

  async function flagEffect(html, event) {
    const type = event.currentTarget.dataset.button;
    const effect = CN.isActorConcentratingOnItem(actor, item);
    const level = effect.flags[DEPEND.CN].data.castData.castLevel;
    const value = `+${Math.ceil(level / 2) - 1}d8[${type}]`;
    const mode = CONST.ACTIVE_EFFECT_MODES.ADD;
    const changes = effect.changes.concat([
      {key: "system.bonuses.mwak.damage", mode, value},
      {key: "system.bonuses.msak.damage", mode, value}
    ]);
    return effect.update({changes});
  }
}
