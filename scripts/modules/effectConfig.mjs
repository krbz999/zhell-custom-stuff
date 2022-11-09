// function to create input field on active effect configs.
export function createEffectStatusIdField(sheet, html) {
  const table = html[0].querySelector(".effect-change.effects-header.flexrow");
  const div = document.createElement("DIV");
  div.classList.add("zhell-effect-status-id");
  const id = sheet.object.getFlag("core", "statusId") ?? "";
  const intro = foundry.utils.getProperty(sheet.object.flags, "visual-active-effects.data.intro") ?? "";
  const content = foundry.utils.getProperty(sheet.object.flags, "visual-active-effects.data.content") ?? "";
  div.innerHTML = `
  <div class="form-group">
    <div class="form-fields">
      <input type="text" name="flags.core.statusId" value="${id}" placeholder="Status Id...">
    </div>
  </div>
  <div class="form-group">
    <div class="form-fields">
      <input type="text" name="flags.visual-active-effects.data.intro" value="${intro.trim()}" placeholder="Intro...">
    </div>
  </div>
  <div class="form-group">
    <div class="form-fields">
      <input type="text" name="flags.visual-active-effects.data.content" value="${content.trim()}" placeholder="Content...">
    </div>
  </div>`;
  table.before(div);
  sheet.setPosition();
}