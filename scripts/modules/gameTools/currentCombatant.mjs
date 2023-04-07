export async function currentCombatant() {
  // close all sheets.
  Object.values(ui.windows).filter(w => {
    return w.document?.documentName.includes("Actor");
  }).forEach(w => w.minimize());

  const current = game.combat.combatant.token;
  const sheet = current.actor.sheet;

  // render current combatant.
  if (sheet.rendered) sheet.maximize();
  else sheet.render(true, {top: 0, left: 0});

  // select and pan to current combatant.
  current.object.control();
  return canvas.animatePan({...current.object.center, duration: 1000});
}
