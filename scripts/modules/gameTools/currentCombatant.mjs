export async function currentCombatant() {
  const combat = game.combat;
  if (!combat) return ui.notifications.warn("No current combat!");

  const current = game.combat.combatant.token;
  if (!current) return ui.notifications.warn("No current combatant!");

  // close all sheets.
  Object.values(ui.windows).filter(w => {
    return w.document?.documentName.includes("Actor");
  }).forEach(w => w.minimize());

  // render current combatant.
  const sheet = current.actor.sheet;
  if (sheet.rendered) sheet.maximize();
  else sheet.render(true, {top: 0, left: 0});

  // select and pan to current combatant.
  current.object.control();
  return canvas.animatePan({...current.object.center, duration: 1000});
}
