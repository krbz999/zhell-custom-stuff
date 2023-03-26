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

  return Dialog.wait({title, buttons, content}, {classes: ["dialog", "elemental"]});
}

export async function columnDialog({title, content, buttons, render}) {
  return Dialog.wait({
    title, content, buttons, render, close: () => false
  }, {
    classes: ["dialog", "column-dialog"]
  });
}
