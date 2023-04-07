export async function advanceTime(s = null) {
  const content = `
  <p style="text-align: center;">
    Advance time by a number of seconds.
  </p>
  <form class="dnd5e">
  <div class="form-group">
    <label>Seconds:</label>
    <div class="form-fields">
      <input type="number" autofocus ${s ? `value="${s}"` : ""}>
    </div>
  </div>
  </form>`;
  const time = await Dialog.prompt({
    title: "Advance Time",
    content,
    label: "Advance!",
    rejectClose: false,
    callback: async (html) => html[0].querySelector("input").valueAsNumber
  });
  if (!time) return;

  ui.notifications.info(`Advanced time by ${time} seconds.`);
  return game.time.advance(time);
}
