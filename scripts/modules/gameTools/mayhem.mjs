export default async function mayhem() {
  // mayhem macro.
  // save mayhem dice on user in a flag.
  // max: number of players.
  // min: 0.

  if (!game.user.isGM) {
    ui.notifications.error("Mayhem is for GMs only!");
    return null;
  }

  const { spent = 5, max = 5 } = game.user.getFlag("world", "mayhem") ?? {};
  const value = Math.clamp(max - spent, 0, max);

  const dialogOptions = {
    window: {
      title: "Mayhem!",
      icon: "fa-solid fa-bolt",
    },
    buttons: [{
      action: "earn",
      label: "Earn a Point",
      icon: "fa-solid fa-arrow-up",
      default: !!spent,
    }, {
      action: "spend",
      label: "Spend a Point",
      icon: "fa-solid fa-arrow-down",
      default: !!value,
    }],
    position: {
      width: 400,
      height: "auto",
    },
    render: (event, html) => {
      html.querySelector(".form-footer").classList.add("flexcol");
      html.querySelector(".form-footer [data-action=earn]").disabled = !spent;
      html.querySelector(".form-footer [data-action=spend]").disabled = !value;
    },
    rejectClose: false,
    content: `
    <p>When a player is reduced to zero hit points, or killed outright, the DM earns one point of inspiration.
    The points stack to a maximum of <strong>${max}</strong> points.</p>
    <p>You currently have <strong>${value}</strong> points.</p>`,
  };

  const result = await foundry.applications.api.DialogV2.wait(dialogOptions);
  let update;
  let content;
  switch (result) {
    case "earn":
      update = { "flags.world.mayhem": { spent: spent - 1, max: max } };
      content = "The GM has earned 1 point of mayhem.";
      break;
    case "spend":
      update = { "flags.world.mayhem": { spent: spent + 1, max: max } };
      content = "The GM has spent 1 point of mayhem.";
      break;
    default:
      return;
  }

  await getDocumentClass("ChatMessage").create({ content: `<p>${content}</p>` });
  return game.user.update(update);
}
