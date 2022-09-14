// BREATH WEAPON.
Hooks.on("createMeasuredTemplate", (templateDoc, _, userId) => {
    if ( userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if ( !uuid ) return;

    const item = fromUuidSync(uuid);
    if ( !item ) return;

    const type = item.getFlag("world", "breath-weapon.type");
    if ( !type ) return;

    new Sequence().effect().file(type).atLocation(templateDoc).stretchTo(templateDoc).play();
});
