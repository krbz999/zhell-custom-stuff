import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function FLAMING_SPHERE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG, DEPEND.CN, DEPEND.EM)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return CN.redisplayCard(actor, item);

  const use = await item.use();
  if (!use) return;

  const updates = {token: {name: `${actor.name.split(" ")[0]}'s Flaming Sphere`}};
  const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await ItemMacroHelpers._spawnHelper("Flaming Sphere", updates, {}, options);
  await actor.sheet?.maximize();
  const effect = CN.isActorConcentratingOnItem(actor, item);
  if (!spawn) return effect.delete();
  return ItemMacroHelpers._addTokenDismissalToEffect(effect, spawn);
}
