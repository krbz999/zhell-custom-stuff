export default class ActorExtension {
  static init() {
    CONFIG.DND5E.spellProgression.warden = "DND5E.SpellProgWarden";
    CONFIG.DND5E.spellcastingTypes.warden = {
      label: "DND5E.SpellProgWarden",
      img: "icons/magic/nature/leaf-rune-glow-green.webp",
      shortRest: true,
      progression: {
        3: {slots: 1, level: 1},
        4: {slots: 2, level: 1},
        7: {slots: 2, level: 2},
        13: {slots: 2, level: 3},
        14: {slots: 2, level: 4}
      }
    };
    CONFIG.DND5E.spellPreparationModes.warden = {
      label: "DND5E.SpellProgWarden",
      upcast: true,
      order: 0.75,
      cantrips: true,
      prepares: false
    };

    Hooks.on("dnd5e.computeWardenProgression", ActorExtension.computeWardenProgression);
    Hooks.on("dnd5e.prepareWardenSlots", ActorExtension.prepareWardenSlots);
    Hooks.on("dnd5e.buildWardenSpellcastingTable", ActorExtension.buildSpellcastingTable);
  }

  static computeWardenProgression(progression, actor, cls, spellcasting, count) {
    progression.warden ??= 0;
    progression.warden += spellcasting.levels;
  }
  static prepareWardenSlots(spells, actor, progression) {
    const table = CONFIG.DND5E.spellcastingTypes.warden.progression;
    Actor.implementation.prepareAltSlots(spells, actor, progression, "warden", table);
  }
  static buildSpellcastingTable(table, item, spellcasting) {
    const spells = {warden: {}};
    table.headers = [[
      {content: game.i18n.localize("JOURNALENTRYPAGE.DND5E.Class.SpellSlots")},
      {content: game.i18n.localize("JOURNALENTRYPAGE.DND5E.Class.SpellSlotLevel")}
    ]];
    table.cols = [{class: "spellcasting", span: 2}];

    // Loop through each level, gathering "Spell Slots" & "Slot Level" for each one
    for (const level of Array.fromRange(CONFIG.DND5E.maxLevel, 1)) {
      const progression = {warden: 0};
      spellcasting.levels = level;
      Actor.implementation.computeClassProgression(progression, item, {spellcasting});
      Actor.implementation.prepareSpellcastingSlots(spells, "warden", progression);
      table.rows.push([
        {class: "spell-slots", content: `${spells.warden.max}`},
        {class: "slot-level", content: spells.warden.level.ordinalString()}
      ]);
    }
  }
}
