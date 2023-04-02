import {DEPEND} from "../../../const.mjs";
import {_addTokenDismissalToEffect, _constructGenericEffectData, _getDependencies, _spawnHelper} from "../../itemMacros.mjs";

export const fathomless = {TENTACLE_OF_THE_DEEPS};

async function TENTACLE_OF_THE_DEEPS(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.WG)) return item.use();
  const isActive = actor.effects.find(e => {
    return e.flags.core?.statusId === item.name.slugify({strict: true});
  });
  if (isActive) return item.displayCard();

  const use = await item.use();
  if (!use) return;
  const effectData = _constructGenericEffectData({item});
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);
  const updates = {token: {name: `${actor.name.split(" ")[0]}'s Fathomless Tentacle`}};
  const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await _spawnHelper("Fathomless Tentacle", updates, {}, options);
  await actor.sheet?.maximize();
  if (!spawn) return effect.delete();
  return _addTokenDismissalToEffect(effect, spawn);
}
