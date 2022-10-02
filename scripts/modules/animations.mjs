export class ZHELL_ANIMATIONS {
  static onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if (!uuid) return;

    const item = fromUuidSync(uuid);
    if (!item) return;

    // BREATH WEAPON.
    const type = item.getFlag("world", "breath-weapon.type");
    if (type) {
      new Sequence().effect()
        .file(type)
        .atLocation(templateDoc)
        .stretchTo(templateDoc)
        .play();
    }
  }

  static collapsibleSetup() {
    document.addEventListener("click", (event) => {
      const t = event.target.closest(".zhell-collapsible-header");
      if (!t) return;
      t.closest(".zhell-collapsible").classList.toggle("active");
    });
  }
}
