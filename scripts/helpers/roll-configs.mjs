const fromConfig = config => {
  const item = config.subject.item;
  const actor = item.actor;
  return { item, actor, activity: config.subject };
};

const replaceFormulaData = (part, rollData) => {
  part = String(part);
  part = /@([a-z.0-9_-]+)/gi.test(part) ? foundry.dice.Roll.replaceFormulaData(part, rollData) : part;
  part = /@([a-z.0-9_-]+)/gi.test(part) ? foundry.dice.Roll.replaceFormulaData(part, rollData) : part;
  return part;
};

/* -------------------------------------------------- */

// export const elementalAdept = {
//   hook: "postBuildDamageRollConfig",
//   condition: (config, roll, index, options = {}) => {
//     const { item, actor } = fromConfig(config);
//     return actor.getFlag("dnd5e", "roll-configs.elemental-adept-fire")
//       && item && (item.type === "spell");
//   },
//   handler: (config, roll, index, options = {}) => {
//     // Fire damage rolls treat 1s as 2s.
//     const rgx = /(\d+)d(\d+)/g;
//     const isFire = options.formData // this is a bug and should only need to check `roll.options.type`
//       ? options.formData.get(`roll.${index}.damageType`) === "fire"
//       : roll.options.type === "fire";
//     if (!isFire) return;
//     roll.parts = roll.parts.map(part => part.replaceAll(rgx, match => `${match}min2`));
//   },
// };

/* -------------------------------------------------- */

export const greatWeaponMaster = {
  hook: "postBuildDamageRollConfig",
  condition: (config, roll, index, options = {}) => {
    const { item, actor } = fromConfig(config);
    return actor.getFlag("dnd5e", "roll-configs.great-weapon-master")
      && item && (item.type === "weapon") && item.system.properties.has("hvy")
      && (index === 0) && (!game.combat || (game.combat.combatant?.actor === actor));
  },
  handler: (config, roll, index, options = {}) => {
    // Add PB to damage.
    roll.parts.push("@prof");
  },
};

/* -------------------------------------------------- */

// export const piercer = {
//   hook: "postDamageRollConfiguration",
//   condition: (rolls, config, dialog, message) => {
//     const { actor } = fromConfig(config);
//     return actor.getFlag("dnd5e", "roll-configs.piercer");
//   },
//   handler: (rolls, config, dialog, message) => {
//     // Piercing damage crits add one more die.
//     for (const roll of rolls)
//       if ((roll.options.type === "piercing") && roll.isCritical)
//         for (const die of roll.dice) die.number++;
//   },
// };

/* -------------------------------------------------- */

export const greatWeaponFighting = {
  hook: "postBuildDamageRollConfig",
  condition: (config, roll, index, options = {}) => {
    const { activity, item, actor } = fromConfig(config);
    return actor.getFlag("dnd5e", "roll-configs.great-weapon-fighting")
      && item && (item.type === "weapon")
      && (activity.actionType === "mwak")
      && (
        ((config.attackMode === "twoHanded") && item.system.properties.has("ver"))
        || item.system.properties.has("two")
      );
  },
  handler: (config, roll, index, options = {}) => {
    // Any 1 or 2 is treated as a 3.
    const rgx = /(\d+)d(\d+)/g;
    const _rgx = /(\d+)d(\d+)min/g;
    roll.parts = roll.parts.map(part => {
      part = replaceFormulaData(part, roll.data);
      return _rgx.test(part) ? part : part.replaceAll(rgx, match => `${match}min3`);
    });
  },
};
