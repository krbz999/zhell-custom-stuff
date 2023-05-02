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

  return new Dialog({
    title: "Mayhem!",
    content: `
    <p>When a player is reduced to zero hit points, or killed outright, the DM earns one point of inspiration.
    The points stack to a maximum of <strong>${max}</strong> points.</p>
    <p style="text-align:center">You currently have <strong>${value}</strong> points.</p>`,
    buttons: ["earn", "spend"].reduce((acc, key) => {
      acc[key] = {
        label: `${key.capitalize()} a point`,
        icon: `<i class="fa-solid fa-arrow-${(key === "earn") ? "up" : "down"}"></i>`,
        callback: message
      };
      return acc;
    }, {}),
    default: value < max ? "earn" : "spend"
  }, {id: "mayhem-dialog"}).render(true);


  async function message(html, event) {
    const btn = event.currentTarget.dataset.button;

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
    const content = `
    <div class="zhell-custom-stuff mayhem">
      <i class="fa-solid fa-bolt fa-shake"></i> Mayhem!
    </div>
    <p>${blurb}</p>
    <p style="text-align: center;">Current stack: <strong>${newValue}</strong></p>`;
    await ChatMessage.create({content});
    return game.user.setFlag("world", "mayhem.value", newValue);
  }
}
