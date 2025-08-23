export default async function advanceTime() {
  // DAY, HOUR, MINUTE, WEEK, YEAR
  const convert = type => ui.visualActiveEffects.constructor[`SECONDS_PER_${type}`] ?? 1;
  const fields = [];
  const makeFg = (label, input) => fields.push(foundry.applications.fields.createFormGroup({ label, input }));

  let input = foundry.applications.fields.createNumberInput({
    min: 0, integer: true, value: 0, placeholder: 0, nullable: false, name: "amount",
  });
  makeFg("Amount", input);
  input = foundry.applications.fields.createSelectInput({
    name: "type", options: Object.entries({
      SECOND: "Seconds",
      MINUTE: "Minutes",
      HOUR: "Hours",
      DAY: "Days",
      WEEK: "Weeks",
      YEAR: "Years",
    }).map(([value, label]) => ({ value, label })),
  });
  makeFg("Type", input);

  const result = await foundry.applications.api.Dialog.input({
    content: fields.map(field => field.outerHTML).join(""),
    window: { title: "Advance Time" },
    position: { width: 400 },
  });
  if (!result) return;

  const seconds = result.amount * convert(result.type);
  await game.time.advance(seconds);
  ui.notifications.success(`Advanced time by ${seconds} seconds.`);
}
