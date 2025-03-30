export default function(sheet, html) {
  if (!game.settings.get(ZHELL.id, "dataEntryItemSheets")) return;
  const classes = ["zhell-data-entry"];

  if (sheet.activity) {
    classes.push("activity");
  } else {
    classes.push(sheet.document.type);
    html = html[0];
  }

  html = html.closest(".app, .application");
  html.classList.add(...classes);
}
