// function to create input field on active effect configs.
export function createEffectStatusIdField(sheet, html){
    const table = html[0].querySelector(".effect-change.effects-header.flexrow");
    const div = document.createElement("DIV");
    div.classList.add("zhell-effect-status-id");
    const id = sheet.object.getFlag("core", "statusId") ?? "";
    div.innerHTML = `<input type="text" name="flags.core.statusId" value="${id}" placeholder="Status Id...">`;
    table.before(div);
}
