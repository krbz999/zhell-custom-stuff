export default function(sheet) {
  if (!dnd5e.settings.pietyScore) return;
  const editable = sheet.isEditable && (sheet._mode === sheet.constructor.MODES.EDIT);

  const grp = sheet.element.ownerDocument.createElement("DIV");
  grp.classList.add("meter-group", "piety");

  const label = sheet.element.ownerDocument.createElement("DIV");
  label.classList.add("label", "roboto-condensed-upper");
  label.insertAdjacentHTML("beforeend", `<span>${_loc("DND5E.PIETY.Label")}</span`);
  if (editable) {
    const button = sheet.element.ownerDocument.createElement("BUTTON");
    button.type = "button";
    button.classList.add("config-button", "unbutton");
    button.dataset.action = "showConfiguration";
    button.dataset.config = "piety";
    button.dataset.tooltip = "";
    button.ariaLabel = _loc("DND5E.PIETY.Configure");
    button.insertAdjacentHTML("beforeend", `<i class="fa-solid fa-fw fa-cog" inert></i>`);
    label.insertAdjacentElement("Beforeend", button);
  }
  grp.insertAdjacentElement("beforeend", label);

  const buttonGroup = sheet.element.ownerDocument.createElement("DIV");
  buttonGroup.classList.add("button-group");
  buttonGroup.insertAdjacentHTML(
    "beforeend",
    `<button type="button" data-action="adjustPiety" data-delta="-1" class="icon fa-solid fa-minus config-button unbutton"></button>`,
  );
  buttonGroup.insertAdjacentHTML(
    "beforeend",
    `<span>${sheet.document.system.attributes.piety.value ?? "0"}</span>`,
  )
  buttonGroup.insertAdjacentHTML(
    "beforeend",
    `<button type="button" data-action="adjustPiety" data-delta="1" class="icon fa-solid fa-plus config-button unbutton"></button>`,
  );

  grp.insertAdjacentElement("beforeend", buttonGroup);
  sheet.element.querySelector(".sidebar .stats").insertAdjacentElement("beforeend", grp);
}
