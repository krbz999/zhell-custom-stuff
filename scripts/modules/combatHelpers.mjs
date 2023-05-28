export class CombatEnhancements {
  /**
   * Mark a non-player-owned and unlinked combatant's token as defeated when it reaches zero hit points.
   * @param {Actor} actor               The actor that was updated.
   * @param {object} updates            The update performed on the actor.
   * @returns {Promise<Combatant>}      The combatant that was updated.
   */
  static async _markDefeatedCombatant(actor, updates) {
    if (actor.hasPlayerOwner || !actor.inCombat) return;
    const hpUpdate = updates.system?.attributes?.hp?.value;
    if (!Number.isNumeric(hpUpdate) || !(hpUpdate <= 0)) return;
    const effect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    const combatant = game.combat.getCombatantByActor(actor);
    await combatant.token.toggleActiveEffect(effect, {overlay: true});
    return combatant.update({defeated: true});
  }

  /**
   * Display the chat card of an ammo item being fired from a weapon when that weapon makes
   * an attack roll, but only if the ammo has a saving throw associated with it.
   * @param {Item} weapon                 The item making the attack roll.
   * @param {D20Roll} roll                The roll result.
   * @param {object[]} ammoUpdate         The updates to consumed ammo item(s).
   * @returns {Promise<ChatMessage>}      The displayed chat message.
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
   * @returns {boolean}     Whether the effect is now on or off (always true).
   */
  static _spendReaction(item) {
    if (item.system.activation?.type !== "reaction") return;
    if (!game.combat) return;
    if (item.actor.statuses.has("reaction")) return;
    const combatant = game.combat.getCombatantByActor(item.actor);
    if (!combatant) return;
    const reaction = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === "reaction"));
    reaction.description = game.i18n.format("ZHELL.StatusConditionReactionDescription", {name: item.name});
    foundry.utils.setProperty(reaction, "flags.visual-active-effects.data.content", item.system.description.value);
    return combatant.token.toggleActiveEffect(reaction, {active: true});
  }

  /**
   * Recharge monster features with a d6 during combat. The script is only executed
   * if the combat is advanced forward in the turns or rounds.
   * @param {Combat} combat               The combat document being updated.
   * @param {object} update               The update object used to update the combat document.
   * @param {object} context              Object of update options.
   * @param {string} userId               The id of the user performing the update.
   * @returns {Promise<ChatMessage>}      The created chat message notification.
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
    return ChatMessage.create({
      content: `${actor.name}'s legendary actions were reset.`,
      whisper: [game.user.id]
    });
  }
}
