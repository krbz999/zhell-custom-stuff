/**
 * Add the 'Spent Reaction' status to an actor.
 * @param {Activity} activity     Activity being activated.
 * @param {object} usageConfig    Configuration data for the activation.
 * @param {object} results        Final details on the activation.
 */
export default async function spendReaction(activity) {
  if (activity.activation.type !== "reaction") return;
  const actor = activity.item.actor;
  if (!ZHELL.settings.trackReactions(actor)) return;
  if (!actor.inCombat) return;

  const combatant = game.combat.getCombatantsByActor(actor)[0];
  const ActiveEffect = getDocumentClass("ActiveEffect");
  const effect = await ActiveEffect.fromStatusEffect("reaction");
  effect.updateSource({
    description: game.i18n.format("ZHELL.CONDITION.REACTION.DESCRIPTION", { name: activity.item.name }),
    duration: { expiry: "turnStart" },
    start: { combatant, time: game.time.worldTime },
    flags: { [ZHELL.id]: { reaction: true } },
  });
  await ActiveEffect.create(effect.toObject(), { keepId: true, parent: actor });
}

Hooks.on("updateActiveEffect", (effect, changed, options, userId) => {
  if (game.user.id !== userId) return;
  if (changed.duration?.expired !== true) return;
  if (!effect.flags[ZHELL.id]?.reaction) return;
  effect.delete();
});
