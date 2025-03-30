export class GameChangesHandler {
  // Hooks on init.
  static init() {
    GameChangesHandler._configChanges();
  }

  static _configChanges() {
    // Adjust ability scores.
    CONFIG.DND5E.abilities.pty = {
      abbreviation: "pty",
      defaults: { vehicle: 0, npc: 1, character: 1 },
      fullKey: "piety",
      label: "ZHELL.ABILITY.PIETY",
      reference: "",
      type: "mental",
      improvement: false,
    };

    // Add to status conditions.
    CONFIG.DND5E.conditionTypes.reaction = {
      id: "reaction",
      name: "ZHELL.CONDITION.REACTION.NAME",
      img: "assets/images/conditions/reaction.webp",
      duration: { rounds: 1 },
      description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>",
    };
  }
}
