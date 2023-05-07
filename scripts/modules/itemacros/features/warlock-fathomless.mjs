import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const fathomless = {TENTACLE_OF_THE_DEEPS};

async function TENTACLE_OF_THE_DEEPS(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM, DEPEND.WG)) return item.use();

  const status = item.name.slugify({strict: true});
  const isActive = actor.effects.some(e => e.statuses.has(status));
  if (isActive) return item.displayCard();

  const use = await item.use();
  if (!use) return;

  const effectData = ItemMacroHelpers._constructGenericEffectData({item, types: ["redisplay", "attack", "damage"]});
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);
  const updates = {token: {name: `${actor.name.split(" ")[0]}'s Fathomless Tentacle`}};
  const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await ItemMacroHelpers._spawnHelper("Fathomless Tentacle", updates, {}, options);
  await actor.sheet?.maximize();
  if (!spawn) return effect.delete();
  return ItemMacroHelpers._addTokenDismissalToEffect(effect, spawn);
}
