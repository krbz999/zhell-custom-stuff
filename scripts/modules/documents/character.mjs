export default class ActorExtension {
  // TODO: this is no longer needed as of v3.1, easy addition of a new spell prog type.
  static init() {
    CONFIG.DND5E.spellProgression.warden = "DND5E.SpellProgWarden";

    CONFIG.DND5E.spellcastingTypes.warden = {
      label: "DND5E.SpellProgWarden",
      progression: {
        3: {slots: 1, level: 1},
        4: {slots: 2, level: 1},
        5: {slots: 2, level: 1},
        6: {slots: 2, level: 1},
        7: {slots: 2, level: 2},
        8: {slots: 2, level: 2},
        9: {slots: 2, level: 2},
        10: {slots: 2, level: 2},
        11: {slots: 2, level: 2},
        12: {slots: 2, level: 2},
        13: {slots: 2, level: 3},
        14: {slots: 2, level: 3},
        15: {slots: 2, level: 3},
        16: {slots: 2, level: 3},
        17: {slots: 2, level: 3},
        18: {slots: 2, level: 3},
        19: {slots: 2, level: 4},
        20: {slots: 2, level: 4}
      }
    };

    CONFIG.DND5E.spellPreparationModes.warden = {
      label: "DND5E.SpellProgWarden",
      upcast: true,
      order: 0.75,
      cantrips: true
    };

    Hooks.on("dnd5e.computeWardenProgression", ActorExtension.computeWardenProgression);
    Hooks.on("dnd5e.prepareWardenSlots", ActorExtension.prepareWardenSlots);
    Hooks.on("dnd5e.preRestCompleted", ActorExtension.preRestCompleted);
  }

  static computeWardenProgression(progression, actor, cls, spellcasting, count) {
    progression.warden ??= 0;
    progression.warden += cls.system.levels;
  }
  static prepareWardenSlots(spells, actor, progression) {
    let wardenLevel = Math.clamped(progression.warden, 0, CONFIG.DND5E.maxLevel);
    spells.warden ??= {};
    const override = Number.isNumeric(spells.warden.override) ? parseInt(spells.warden.override) : null;

    if ((wardenLevel === 0) && (actor.type === "npc") && (override !== null)) {
      wardenLevel = actor.system.details.spellLevel;
    }

    const [, wardenConfig] =
      Object.entries(CONFIG.DND5E.spellcastingTypes.warden.progression)
        .reverse()
        .find(([l]) => Number(l) <= wardenLevel) ?? [];
    if (wardenConfig) {
      spells.warden.level = wardenConfig.level;
      if (override === null) spells.warden.max = wardenConfig.slots;
      else spells.warden.max = Math.max(override, 1);
      spells.warden.value = Math.min(spells.warden.value || 0, spells.warden.max);
    } else {
      spells.warden.max = override || 0;
      spells.warden.level = spells.warden.max > 0 ? 1 : 0;
    }
  }
  static preRestCompleted(actor, {longRest, updateData}) {
    if (longRest) return;
    const warden = actor.system.spells?.warden;
    if (!warden || !warden.max) return;
    updateData["system.spells.warden.value"] = warden.max;
  }
}
