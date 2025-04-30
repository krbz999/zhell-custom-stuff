/**
 * Add css classes to item or activity sheets.
 * @param {Application} sheet   The item or activity sheet.
 * @param {HTMLElement} html    The sheet element.
 */
export default function dataEntry(sheet, html) {
  if (!ZHELL.settings.dataEntry) return;
  const classes = ["zhell-data-entry"];

  const isActivity = !!sheet.activity;

  if (isActivity) classes.push("activity");
  else classes.push(sheet.document.type);

  html.closest(".application").classList.add(...classes);

  if (!isActivity) {
    for (const d of ["effects", "advancement", "activities"]) {
      const tab = html.querySelector(`[data-application-part="${d}"]`);
      if (!tab) continue;

      const button = foundry.utils.parseHTML(`
      <button type="button" aria-label="Create" class="fake create-child gold-button always-interactive">
        <i class="fas fa-plus" inert></i>
      </button>`);

      button.addEventListener("click", () => createChild.call(sheet, d));
      tab.insertAdjacentElement("afterbegin", button);
      tab.classList.add(`tab-${d}`);
    }
  }
}

/**
 * Create a child document.
 * @this {Application}
 * @param {string} tab    Type of child.
 * @returns {Promise}
 */
function createChild(tab) {
  if (tab === "activities") {
    return dnd5e.documents.activity.UtilityActivity.createDialog({}, {
      parent: this.item,
      types: Object.entries(CONFIG.DND5E.activityTypes).filter(([, { configurable }]) => {
        return configurable !== false;
      }).map(([k]) => k),
    });
  }

  if (tab === "advancement") {
    return dnd5e.documents.advancement.Advancement.createDialog({}, { parent: this.item });
  }

  if (tab === "effects") {
    return ActiveEffect.implementation.create({
      name: this.document.name,
      img: this.document.img,
      origin: this.document.uuid,
    }, { parent: this.document, renderSheet: true });
  }
}
