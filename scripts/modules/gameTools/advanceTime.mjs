export async function advanceTime(s = null) {
  const content = `
  <p style="text-align: center;">Advance time by a number of seconds.</p>
  <form class="dnd5e">
    <div class="form-group">
      <label>Seconds:</label>
      <div class="form-fields">
        <input type="text" autofocus ${s ? `value="${s}"` : ""}>
      </div>
    </div>
  </form>`;
  const time = await Dialog.prompt({
    title: "Advance Time",
    content,
    label: "Advance!",
    rejectClose: false,
    callback: async (html) => html[0].querySelector("input").value,
  });
  if (!time || !Roll.validate(time)) return;
  const data = canvas.tokens.controlled[0]?.actor?.getRollData() ?? {};
  const { total } = await new Roll(time, data).evaluate();

  ui.notifications.info(`Advanced time by ${total} seconds.`);
  return game.time.advance(total);
}
