/**
 * Inject a button to open the crafting UI on a character sheet.
 * @param {CharacterActorSheet} sheet
 * @param {HTMLFormElement} element
 * @param {object} context
 */
export default async function(sheet, element, context) {
  const buttons = element.querySelector(".sheet-header-buttons");
  if (buttons.querySelector(".crafting")) return;

  const button = document.createElement("BUTTON");
  button.type = "button";
  button.classList.add("crafting", "gold-button");
  button.dataset.action = "openCraftingMenu";
  button.dataset.tooltip = "";
  button.ariaLabel = game.i18n.format("ZHELL.CRAFTING.MENU.tooltipOpen", {
    resources: sheet.document.getFlag(ZHELL.id, "crafting.resources") ?? 0,
  });
  if (!sheet.isEditable) button.disabled = true;

  button.insertAdjacentHTML("beforeend", "<i class=\"fa-solid fa-volcano\" inert></i>");
  buttons.insertAdjacentElement("beforeend", button);
}
