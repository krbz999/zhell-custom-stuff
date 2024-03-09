export default class ActorExtension {
  // TODO: this is no longer needed as of v3.1, easy addition of a new spell prog type.
  static init() {
    foundry.utils.mergeObject(CONFIG.DND5E.spellProgression, {
      warden: "DND5E.SpellProgWarden"
    });

    CONFIG.DND5E.spellcastingTypes.warden = {
      label: "DND5E.SpellProgWarden",
      progression: {
        3: {max: 1, level: 1},
        4: {max: 2, level: 1},
        5: {max: 2, level: 1},
        6: {max: 2, level: 1},
        7: {max: 2, level: 2},
        8: {max: 2, level: 2},
        9: {max: 2, level: 2},
        10: {max: 2, level: 2},
        11: {max: 2, level: 2},
        12: {max: 2, level: 2},
        13: {max: 2, level: 3},
        14: {max: 2, level: 3},
        15: {max: 2, level: 3},
        16: {max: 2, level: 3},
        17: {max: 2, level: 3},
        18: {max: 2, level: 3},
        19: {max: 2, level: 4},
        20: {max: 2, level: 4}
      }
    };

    CONFIG.Actor.documentClass = class Actor5e extends CONFIG.Actor.documentClass {
      prepareDerivedData() {
        super.prepareDerivedData();
      }

      get babonus() {
        const babonus = game.modules.get("babonus")?.api;
        if (!babonus) return null;
        return babonus.getCollection(this);
      }

      /**********************************
       * SPELLCASTING PREPARATION.
       * FUCK IT.
       * (DOESN'T WORK WITH MC.)
       **********************************/

      static computeClassProgression(progression, cls, {actor, spellcasting, count = 1} = {}) {
        super.computeClassProgression(progression, cls, {actor, spellcasting, count});

        const type = cls.spellcasting.type;
        spellcasting = spellcasting ?? cls.spellcasting;

        if (type === "warden") this.computeWardenProgression(progression, actor, cls, spellcasting, count);
      }

      static computeWardenProgression(progression, actor, cls, spellcasting, count) {
        progression.warden ??= 0;
        progression.warden += spellcasting.levels;
      }

      static prepareSpellcastingSlots(spells, type, progression, {actor} = {}) {
        super.prepareSpellcastingSlots(spells, type, progression, {actor});
        if (type === "warden") this.prepareWardenSlots(spells, actor, progression);
      }

      static prepareWardenSlots(spells, actor, progression) {
        const override = Number.isNumeric(spells.pact.override) ? Math.max(parseInt(spells.pact.override), 0) : 0;
        if (override > 0) return;

        const level = Number.isNumeric(progression.warden) ? parseInt(progression.warden) : 0;
        if (level > 0) {
          const slots = CONFIG.DND5E.spellcastingTypes.warden.progression[level];
          spells.pact.max += slots.max;
          spells.pact.level = Math.max(spells.pact.level, slots.level);
          spells.pact.value = Math.clamped(spells.pact.value, 0, spells.pact.max);
        }
      }
    }
  }
}
