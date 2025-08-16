/**
 * Make changes to the 5e system config.
 */
export default function systemChanges() {
  // Add to status conditions.
  CONFIG.DND5E.conditionTypes.reaction = {
    id: "reaction",
    name: "ZHELL.CONDITION.REACTION.NAME",
    img: "systems/dnd5e/icons/svg/activity/forward.svg",
    duration: { rounds: 1 },
    description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>",
  };
}
