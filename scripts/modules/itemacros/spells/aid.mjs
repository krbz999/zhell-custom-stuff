import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function AID(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG, DEPEND.EM, DEPEND.VAE)) return item.use();

  const targets = game.user.targets;
  if (!targets.size.between(1, 3)) {
    ui.notifications.warn("You need to have between 1 and 3 targets.");
    return null;
  }

  const use = await item.use();
  if (!use) return;

  const spellLevel = ItemMacroHelpers._getSpellLevel(use);

  async function onCreate() {
    const level = effect.flags.effectmacro.data.spellLevel;
    const value = 5 * (level - 1);
    return actor.applyDamage(value, -1);
  }

  const effectData = {
    label: item.name,
    icon: item.img,
    duration: ItemMacroHelpers._getItemDuration(item),
    changes: [{key: "system.attributes.hp.tempmax", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 5 * (spellLevel - 1)}],
    "flags.core.statusId": item.name.slugify({strict: true}),
    "flags.visual-active-effects.data.intro": `<p>Your hit point maximum is increased by ${5 * (spellLevel - 1)}.</p>`,
    "flags.effectmacro.data.spellLevel": spellLevel,
    "flags.effectmacro.onCreate.script": `(${onCreate.toString()})()`
  };

  const updates = {embedded: {ActiveEffect: {[effectData.label]: effectData}}};
  const options = {
    permanent: true,
    description: `${actor.name} is casting ${item.name} on you.`,
    comparisonKeys: {ActiveEffect: "label"}
  };

  ui.notifications.info("Granting hit points to your targets!");
  for (const target of targets) warpgate.mutate(target.document, updates, {}, options);
}
