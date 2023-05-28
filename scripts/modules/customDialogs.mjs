import {MODULE} from "../const.mjs";

/**
 * Wrapper for an async dialog that stacks a set of buttons vertically, themed for the elements.
 * @param {string[]} types      The different damage types.
 * @param {string} content      The content of the dialog.
 * @param {string} title        The title for the dialog.
 * @returns {Promise<*>}        Whatever is returned from the respective button clicked.
 */
export async function elementalDialog({types = [], content, title}) {
  const icon = {
    acid: "flask",
    cold: "snowflake",
    fire: "fire",
    lightning: "bolt",
    thunder: "cloud",
    poison: "skull"
  };

  const buttons = types.reduce((acc, type) => {
    acc[type] = {
      icon: `<i class="fa-solid fa-${icon[type]}"></i>`,
      label: CONFIG.DND5E.damageTypes[type],
      callback: () => type
    }
    return acc;
  }, {});

  return Dialog.wait({title, buttons, content}, {classes: [MODULE, "dialog", "elemental"]});
}
