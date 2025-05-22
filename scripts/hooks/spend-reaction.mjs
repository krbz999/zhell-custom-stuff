/**
 * Add the 'Spent Reaction' status to an actor.
 * @param {Activity} activity                     Activity being activated.
 * @param {object} usageConfig  Configuration data for the activation.
 * @param {object} results          Final details on the activation.
 */
export default async function spendReaction(activity) {
  if (activity.activation.type !== "reaction") return;
  const actor = activity.item.actor;
  if (!ZHELL.settings.trackReactions(actor)) return;
  if (!actor.inCombat) return;
  const Cls = foundry.utils.getDocumentClass("ActiveEffect");
  const effect = await Cls.fromStatusEffect("reaction");
  effect.updateSource({
    description: game.i18n.format("ZHELL.CONDITION.REACTION.DESCRIPTION", {
      name: activity.item.name,
    }),
  });
  await Cls.create(effect.toObject(), { keepId: true, parent: actor });
}
