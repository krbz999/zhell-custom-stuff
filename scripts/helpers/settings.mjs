const { BooleanField, NumberField } = foundry.data.fields;

export default class ModuleSettings {
  /**
   * Module settings configurations.
   * @type {Record<string, object>}
   */
  static CONFIGURATION = {
    foragingDC: {
      name: "FORAGING_DC.NAME",
      hint: "FORAGING_DC.HINT",
      scope: "world",
      config: true,
      type: new NumberField({
        initial: 15,
      }),
      requiresReload: false,
    },
    markDefeatedCombatants: {
      name: "MARK_DEFEATED.NAME",
      hint: "MARK_DEFEATED.HINT",
      scope: "world",
      config: true,
      type: new BooleanField({
        initial: true,
      }),
      requiresReload: false,
    },
    trackReactions: {
      name: "TRACK_REACTIONS.NAME",
      hint: "TRACK_REACTIONS.HINT",
      scope: "world",
      config: true,
      type: new NumberField({
        initial: 1,
        choices: {
          0: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_NONE",
          1: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_GM_ONLY",
          2: "ZHELL.SETTINGS.TRACK_REACTIONS.CHOICE_ALL",
        },
      }),
      requiresReload: false,
    },
    dataEntry: {
      name: "DATA_ENTRY.NAME",
      hint: "DATA_ENTRY.HINT",
      scope: "world",
      config: true,
      type: new BooleanField({
        initial: false,
      }),
      requiresReload: false,
    },
  };

  /* -------------------------------------------------- */

  /**
   * Register settings.
   */
  register() {
    for (const [id, { name, hint, ...config }] of Object.entries(ModuleSettings.CONFIGURATION)) {
      game.settings.register(ZHELL.id, id, {
        ...config,
        name: `ZHELL.SETTINGS.${name}`,
        hint: `ZHELL.SETTINGS.${hint}`,
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Should npc combatants be marked defeated when reaching 0 hp?
   */
  get markDefeatedCombatants() {
    return game.settings.get(ZHELL.id, "markDefeatedCombatants");
  }

  /* -------------------------------------------------- */

  trackReactions(actor) {
    switch (game.settings.get(ZHELL.id, "trackReactions")) {
      case 0:
        return false;
      case 1:
        return !actor.hasPlayerOwner;
      case 2:
        return true;
    }
  }
}
