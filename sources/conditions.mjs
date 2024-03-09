export const STATUS_EFFECTS = [
  {
    id: "reaction",
    name: "ZHELL.StatusConditionReaction",
    icon: "assets/images/conditions/reaction.webp",
    duration: {rounds: 1},
    description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>"
  },
  {
    id: "rimed",
    name: "ZHELL.StatusConditionRimed",
    icon: "icons/magic/water/barrier-ice-water-cube.webp",
    description: "<p>Your movement speed has been reduced by 10 feet.</p>",
    changes: [{key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -10}]
  },
  {
    id: "targeted",
    name: "ZHELL.StatusConditionTargeted",
    icon: "icons/svg/target.svg",
    description: "<p>Generic effect.</p>"
  }
];
