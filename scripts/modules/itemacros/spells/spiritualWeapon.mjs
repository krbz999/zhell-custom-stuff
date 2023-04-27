import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function SPIRITUAL_WEAPON(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM, DEPEND.WG)) return item.use();

  const isActive = actor.effects.find(e => {
    return e.flags.core?.statusId === item.name.slugify({strict: true});
  });
  if (isActive) {
    ui.notifications.warn("You already have a weapon summoned!");
    return null;
  }

  const use = await item.use();
  if (!use) return;

  const updates = {token: {name: `${actor.name.split(" ")[0]}'s Spiritual Weapon`}}
  const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

  // then spawn the actor:
  await actor.sheet.minimize();
  const p = ItemMacroHelpers.drawCircle(token, item.system.range.value);
  const [spawn] = await ItemMacroHelpers._spawnHelper("Spiritual Weapon", updates, {}, options);
  await actor.sheet.maximize();
  canvas.app.stage.removeChild(p);
  if (!spawn) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const effectData = ItemMacroHelpers._constructGenericEffectData({item, level, types: ["redisplay", "attack", "damage"]});
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);
  return ItemMacroHelpers._addTokenDismissalToEffect(effect, spawn);
}
