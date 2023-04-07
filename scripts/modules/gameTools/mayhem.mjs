export async function mayhem() {
  // mayhem macro.
  // save mayhem dice on user in a flag.
  // max: number of players.
  // min: 0.

  if (!game.user.isGM) {
    ui.notifications.error("Mayhem is for GMs only!");
    return null;
  }

  const value = game.user.flags.world?.mayhem?.value ?? 0;
  const max = 5;

  new Dialog({
    title: "Mayhem!",
    content: `
    <p>When a player is reduced to zero hit points, or killed outright, the DM earns one point of inspiration.
    The points stack to a maximum of <strong>${max}</strong> points.</p>
    <p style="text-align:center">You currently have <strong>${value}</strong> points.</p>
    <hr>`,
    buttons: ["earn", "spend"].reduce((acc, key) => {
      acc[key] = {
        label: `${key.capitalize()} a point`,
        icon: `<i class="fa-solid fa-arrow-${key === "earn" ? "up" : "down"}"></i>`,
        callback: message
      };
      return acc;
    }, {}),
    default: value < max ? "earn" : "spend"
  }).render(true);


  async function message(html, event) {
    const btn = event.target.dataset.button;

    const add = {earn: 1, spend: -1}[btn];
    const newValue = Math.clamped(value + add, 0, max);
    if (value === newValue) {
      const info = {
        earn: "You cannot earn more points.",
        spend: "You have no points to spend."
      }[btn];
      ui.notifications.info(info);
      return null;
    }
    const blurb = {
      earn: "The GM has gained one point of inspiration.",
      spend: "The GM has spent one point of inspiration."
    }[btn];
    const style0 = "text-align: center; border-radius: 20px;";
    const style1 = `font-size: 60px; padding: 20px 0 0 0; ${style0} margin: 10px 0 0 0; border-top: solid;`;
    const style2 = `font-size: 80px; padding: 0 0 20px 0; ${style0} margin: 0 0 10px 0; border-bottom: solid; font-family: 'Modesto Condensed';`;
    const content = `
    <p style="${style1}"><i class="fa-solid fa-bolt"></i></p>
    <p style="${style2}">Mayhem!</p>
    <hr>
    <p>${blurb}</p>
    <p>Current stack: <strong>${newValue}</strong></p>`;
    await ChatMessage.create({content});
    return game.user.setFlag("world", "mayhem.value", newValue);
  }
}
