import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

/**
 * Searing Smite.
 * The next time you hit a creature with a melee weapon attack during the spell's duration,
 * your weapon flares with white-hot intensity, and the attack deals an extra 1d6 fire damage
 * to the target and causes the target to ignite in flames. At the start of each of its turns
 * until the spell ends, the target must make a Constitution saving throw. On a failed save,
 * it takes 1d6 fire damage. On a successful save, the spell ends. If the target or a creature
 * within 5 feet of it uses an action to put out the flames, or if some other effect douses the
 * flames (such as the target being submerged in water), the spell ends.
 *
 * At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the
 * initial extra damage dealt by the attack increases by 1d6 for each slot.
 */
async function SEARING_SMITE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB, DEPEND.EM, DEPEND.CN)) return item.use();
  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const concentration = await CN.waitForConcentrationStart(actor, {item});

  const babData = babonus.createBabonus({
    type: "damage",
    name: item.name,
    bonuses: {bonus: `${level}d6[fire]`},
    filters: {attackTypes: ["mwak"]}
  }).toObject();

  const onDamage = async function() {
    return babonus.toggleBonus(effect, effect.flags.effectmacro.babId, false);
  }

  const update = {
    [`flags.${DEPEND.BAB}.bonuses.${babData.id}`]: babData,
    [`flags.${DEPEND.EM}.babId`]: babData.id,
    [`flags.${DEPEND.EM}.dnd5e.rollDamage.script`]: `(${onDamage.toString()})()`
  };

  return concentration.update(update);
}

/**
 * Thunderous Smite.
 * The first time you hit with a melee weapon attack during this spell's duration, your weapon
 * rings with thunder that is audible within 300 feet of you, and the attack deals an extra 2d6
 * thunder damage to the target. Additionally, if the target is a creature, it must succeed on a
 * Strength saving throw or be pushed 10 feet away from you and knocked prone.
 */
async function THUNDEROUS_SMITE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM, DEPEND.CN)) return item.use();

  const use = await item.use();
  if (!use) return;
  const concentration = await CN.waitForConcentrationStart(actor, {item});
  const changes = foundry.utils.deepClone(concentration.changes);
  changes.push({
    key: "system.bonuses.mwak.damage",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+2d6[thunder]"
  });
  const onDamage = async function() {
    await CN.redisplayCard(actor);
    return effect.delete();
  }
  return concentration.update({
    changes,
    "flags.effectmacro.dnd5e.rollDamage.script": `(${onDamage.toString()})()`
  });
}

/**
 * Wrathful Smite.
 * The next time you hit with a melee weapon attack during this spell's duration, your attack
 * deals an extra 1d6 psychic damage. Additionally, if the target is a creature, it must make a
 * Wisdom saving throw or be frightened of you until the spell ends. As an action, the creature
 * can make a Wisdom check against your spell save DC to steel its resolve and end this spell.
 */
async function WRATHFUL_SMITE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.BAB, DEPEND.EM, DEPEND.CN)) return item.use();
  const use = await item.use();
  if (!use) return;

  const concentration = await CN.waitForConcentrationStart(actor, {item});
  const babData = babonus.createBabonus({
    type: "damage",
    name: item.name,
    bonuses: {bonus: "1d6[psychic]"},
    filters: {attackTypes: ["mwak"]}
  }).toObject();

  const onDamage = async function() {
    return babonus.toggleBonus(effect, effect.flags.effectmacro.babId, false);
  }

  const update = {
    [`flags.${DEPEND.BAB}.bonuses.${babData.id}`]: babData,
    [`flags.${DEPEND.EM}.babId`]: babData.id,
    [`flags.${DEPEND.EM}.dnd5e.rollDamage.script`]: `(${onDamage.toString()})()`
  };

  return concentration.update(update);
}

/**
 * TODO: Branding Smite.
 * The next time you hit a creature with a weapon attack before this spell ends, the weapon gleams
 * with astral radiance as you strike. The attack deals an extra 2d6 radiant damage to the target,
 * which becomes visible if it is invisible, and the target sheds dim light in a 5-foot radius and
 * cannot become invisible until the spell ends.
 *
 * At Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, the extra
 * damage increases by 1d6 for each slot level above 2nd.
 */

/**
 * TODO: Blinding Smite.
 * The next time you hit a creature with a melee weapon attack during this spell's duration,
 * your weapon flares with a bright light, and the attack deals an extra 3d8 radiant damage
 * to the target. Additionally, the target must succeed on a Constitution saving throw or be
 * blinded until the spell ends.
 * A creature blinded by this spell makes another Constitution saving throw at the end of each
 * of its turns. On a successful save, it is no longer blinded.
 */

/**
 * TODO: Staggering Smite.
 * The next time you hit a creature with a melee weapon attack during this spell's duration, your
 * weapon pierces both body and mind, and the attack deals an extra 4d6 psychic damage to the target.
 * The target must make a Wisdom saving throw. On a failed save, it has disadvantage on attack rolls
 * and ability checks, and cannot take reactions, until the end of its next turn.
 */

/**
 * TODO: Banishing Smite.
 * The next time you hit a creature with a weapon attack before this spell ends, your weapon crackles
 * with force, and the attack deals an extra 5d10 force damage to the target.
 * Additionally, if this attack reduces the target to 50 hit points or fewer, you banish it. If the target
 * is native to a different plane of existence than the one you are on, the target disappears, returning
 * to its home plane. If the target is native to the plane you are on, the creature vanishes into a harmless
 * demiplane. While there, the target is incapacitated. It remains there until the spell ends, at which
 * point the target reappears in the space it left or in the nearest unoccupied space if that space is occupied.
 */