/**
 * Mark an actor as defeated when reaching 0 hp.
 * @param {InstanceType<foundry["documents"]["Actor"]>} actor   The actor.
 */
export default async function(actor) {
  if (ZHELL.settings.markDefeated(actor)) {
    await actor.toggleStatusEffect(CONFIG.specialStatusEffects.DEFEATED, { overlay: true });
  }
}
