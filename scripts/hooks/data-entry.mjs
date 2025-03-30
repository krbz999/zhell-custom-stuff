/**
 * Add css classes to item or activity sheets.
 * @param {Application|ApplicationV2} sheet   The item or activity sheet.
 * @param {HTMLElement|jQuery} html           The sheet element.
 */
export default function dataEntry(sheet, html) {
  if (!ZHELL.settings.dataEntry) return;
  const classes = ["zhell-data-entry"];

  if (sheet.activity) {
    classes.push("activity");
  } else {
    classes.push(sheet.document.type);
    html = html[0];
  }

  html.closest(".app, .application").classList.add(...classes);
}
