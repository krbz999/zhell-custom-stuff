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
  button.dataset.tooltip = "";
  button.ariaLabel = game.i18n.localize("ZHELL.CRAFTING.MENU.tooltipOpen");
  if (!sheet.isEditable) button.disabled = true;

  button.insertAdjacentHTML("beforeend", "<i class=\"fa-solid fa-volcano\" inert></i>");
  button.addEventListener("click", event => {
    const button = event.currentTarget;
    button.disabled = true;
    const application = new ZHELL.applications.apps.CraftingMenu({ document: sheet.document });
    application.render({ force: true }).then(() => button.disabled = false);
  });
  buttons.insertAdjacentElement("beforeend", button);
}
