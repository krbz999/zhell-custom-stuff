import {DEPEND} from "../const.mjs";

export class CombatEnhancements {
  /**
   * Mark a non-player-owned and unlinked combatant's token as defeated when it reaches zero hit points.
   * @param {TokenDocument} tokenDoc      The token document that was updated.
   * @param {object} updates              The update performed on the token document.
   */
  static async _markDefeatedCombatant(tokenDoc, updates) {
    if (tokenDoc.actor.hasPlayerOwner || !tokenDoc.combatant) return;
    const hpUpdate = updates.actorData?.system?.attributes?.hp?.value;
    if (!Number.isNumeric(hpUpdate) || !(hpUpdate <= 0)) return;
    const effect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    await tokenDoc.object.toggleEffect(effect, {overlay: true});
    return tokenDoc.combatant.update({defeated: true});
  }

  /**
   * Display the chat card of an ammo item being fired from a weapon when that weapon makes
   * an attack roll, but only if the ammo has a saving throw associated with it.
   * @param {Item} weapon             The item making the attack roll.
   * @param {D20Roll} roll            The roll result.
   * @param {object[]} ammoUpdate     The updates to consumed ammo item(s).
   */
  static async _displaySavingThrowAmmo(weapon, roll, ammoUpdate) {
    if (!ammoUpdate.length) return;
    const ammoId = ammoUpdate[0]._id;
    const ammo = weapon.actor.items.get(ammoId);
    if (!ammo?.hasSave) return;
    return ammo.displayCard();
  }

  /**
   * Hook function to add the 'reaction' effect to an actor when using an item that requires a reaction.
   * The effect is altered to show the name of the item used and is removed at the start of the same actor's
   * turn. This hook only fires during combat and can be toggled to fire for GM, none, or players too.
   * @param {Item} item     The item that was used.
   */
  static _spendReaction(item) {
    if (item.system.activation?.type !== "reaction") return;
    if (!game.combat) return;
    const has = item.actor.effects.find(e => e.flags.core?.statusId === "reaction");
    if (has) return;
    const combatant = item.actor.token?.combatant ?? item.actor.getActiveTokens()[0]?.combatant;
    if (!combatant) return;
    const reaction = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === "reaction"));
    reaction.flags[DEPEND.VAE].data = {
      intro: "<p>" + game.i18n.format("ZHELL.StatusConditionReactionDescription", {name: item.name}) + "</p>",
      content: item.system.description.value
    };
    return combatant.token.toggleActiveEffect(reaction, {active: true});
  }

  /**
   * Recharge monster features with a d6 during combat. The script is only executed
   * if the combat is advanced forward in the turns or rounds.
   * @param {Combat} combat       The combat document being updated.
   * @param {object} update       The update object used to update the combat document.
   * @param {object} context      Object of update options.
   * @param {string} userId       The id of the user performing the update.
   */
  static async _rechargeMonsterFeatures(combat, update, context, userId) {
    if (!game.user.isGM || (context.direction !== 1)) return;
    const actor = combat.combatant?.actor;
    if (!actor) return;
    for (const item of actor.items) {
      const recharge = item.system.recharge;
      if (!recharge?.value || recharge?.charged) continue;
      await item.rollRecharge();
    }
    if ((actor.type !== "npc") || !(actor.system.resources.legact.max > 0)) return;
    await actor.update({"system.resources.legact.value": actor.system.resources.legact.max});
    await ChatMessage.create({
      content: `${actor.name}'s legendary actions were reset.`,
      whisper: [game.user.id]
    });
  }
}
