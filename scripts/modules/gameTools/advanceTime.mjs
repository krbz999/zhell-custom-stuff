const { NumberField } = foundry.data.fields;

export default async function advanceTime(s = 60) {
  const html = new NumberField({
    label: "Seconds",
    hint: "Advance time by a number of seconds.",
    nullable: false,
    integer: true,
    positive: true,
  }).toFormGroup({}, { autofocus: true, name: "seconds", value: s }).outerHTML;

  const seconds = await foundry.applications.api.DialogV2.prompt({
    content: `<fieldset>${html}</fieldset>`,
    window: {
      title: "Advance Time",
      icon: "fa-solid fa-clock",
    },
    position: {
      width: 400,
      height: "auto",
    },
    rejectClose: false,
    ok: {
      callback: (event, button) => new FormDataExtended(button.form).object.seconds,
      label: "Advance",
      icon: "fa-solid fa-clock",
    },
  });
  if (!seconds) return;

  const result = await game.time.advance(seconds);
  ui.notifications.info(`Advanced time by ${seconds} seconds.`);
  return result;
}
