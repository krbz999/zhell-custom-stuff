const { BooleanField, NumberField } = foundry.data.fields;

export default class ModuleSettings {
  /**
   * Module settings configurations.
   * @type {Record<string, object>}
   */
  static CONFIGURATION = {
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
    havilonCalendar: {
      name: "HAVILON_CALENDAR.NAME",
      hint: "HAVILON_CALENDAR.HINT",
      scope: "world",
      config: true,
      type: new BooleanField({
        initial: true,
      }),
      requiresReload: true,
    },
    pietyScore: {
      name: "PIETY.NAME",
      hint: "PIETY.HINT",
      scope: "world",
      config: true,
      type: new BooleanField({
        initial: false,
      }),
      requiresReload: true,
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
   * Should item and activity sheets be butchered?
   * @type {boolean}
   */
  get dataEntry() {
    return game.settings.get(ZHELL.id, "dataEntry");
  }

  /* -------------------------------------------------- */

  /**
   * Use the Havilonian calendar?
   * @type {boolean}
   */
  get havilonCalendar() {
    return game.settings.get(ZHELL.id, "havilonCalendar");
  }

  /* -------------------------------------------------- */

  /**
   * Should npc combatants be marked defeated when reaching 0 hp?
   * @type {boolean}
   */
  get markDefeatedCombatants() {
    return game.settings.get(ZHELL.id, "markDefeatedCombatants");
  }

  /* -------------------------------------------------- */

  /**
   * Is the piety score enabled?
   * @type {boolean}
   */
  get pietyScore() {
    return game.settings.get(ZHELL.id, "pietyScore");
  }

  /* -------------------------------------------------- */

  /**
   * Should reactions be tracked for this actor?
   * @param {Actor5e} actor   The actor.
   * @returns {boolean}
   */
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

  /* -------------------------------------------------- */

  /**
   * Should this actor be marked defeated?
   * @param {Actor5e} actor   The actor.
   * @returns {boolean}
   */
  markDefeated(actor) {
    if (!this.markDefeatedCombatants) return false;
    if (!game.user.isActiveGM) return false;
    if (actor.hasPlayerOwner || !actor.inCombat) return false;
    if (actor.system.attributes.hp.pct > 0) return false;
    return !actor.statuses.has(CONFIG.specialStatusEffects.DEFEATED);
  }
}
