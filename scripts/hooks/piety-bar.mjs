export default async function(sheet) {
  if (!ZHELL.settings.pietyScore) return;

  const template = "modules/zhell-custom-stuff/templates/sheets/actor/piety.hbs";

  const piety = sheet.actor.getFlag(ZHELL.id, "piety") ?? { value: 0 };
  const max = ZHELL.config.pietyThresholds.find(t => t > piety.value) ?? piety.value;

  const context = {
    piety,
    pct: Math.clamp(Math.round(piety.value / max * 100), 0, 100),
    editable: sheet.isEditable && (sheet._mode === sheet.constructor.MODES.EDIT),
  };

  const htmlString = await foundry.applications.handlebars.renderTemplate(template, context);
  const html = foundry.utils.parseHTML(htmlString);

  const meter = html.querySelector(".meter[role='meter']:has(> input)");
  meter.addEventListener("click", event => toggleMeter(event, true));

  const input = meter.querySelector(":scope > input");
  input.addEventListener("blur", event => toggleMeter(event, false));
  input.addEventListener("focus", event => input.select());
  input.addEventListener("change", event => dnd5e.utils.parseInputDelta(input, sheet.actor));

  sheet.element.querySelector(".sidebar .card .stats:not(:has(.piety)")?.insertAdjacentElement("beforeend", html);
}

/* -------------------------------------------------- */

/**
 * Toggle editing piety.
 * @param {PointerEvent} event    The triggering event.
 * @param {boolean} edit          Whether to toggle to the edit state.
 */
function toggleMeter(event, edit) {
  const target = event.currentTarget.closest("[role=\"meter\"]");
  if (event.target.nodeName === "BUTTON") return;
  const label = target.querySelector(":scope > .label");
  const input = target.querySelector(":scope > input");
  label.hidden = edit;
  input.hidden = !edit;
  if (edit) input.focus();
}
