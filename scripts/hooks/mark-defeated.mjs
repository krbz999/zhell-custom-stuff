/**
 * Mark an actor as defeated when reaching 0 hp.
 * @param {InstanceType<foundry["documents"]["Actor"]>} actor   The actor.
 */
export default async function(actor) {
  if (!ZHELL.settings.markDefeatedCombatants) return;
  if (!game.user.isActiveGM) return;
  if (actor.hasPlayerOwner || !actor.inCombat) return;
  if (actor.system.attributes.hp.pct > 0) return;

  const id = CONFIG.specialStatusEffects.DEFEATED;
  if (actor.statuses.has(id)) return;
  await actor.toggleStatusEffect(id, { overlay: true });
}
