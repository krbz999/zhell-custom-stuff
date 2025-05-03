export default async function currentCombatant({
  controlCurrent = true, panToCurrent = true, maximizeCurrent = true, minimizeOthers = true,
} = {}) {
  const combat = game.combat;
  if (!combat) {
    ui.notifications.warn("No current combat!");
    return;
  }

  const current = game.combat.combatant.token;
  if (!current) {
    ui.notifications.warn("No current combatant!");
    return;
  }

  // Minimize all sheets except those that point to the current combatant's actor.
  for (const application of foundry.applications.instances.values()) {
    if (!application.hasFrame) continue;
    if (application.document === current.actor) {
      if (!maximizeCurrent) continue;
      if (application.rendered) application.maximize();
      else application.render({ force: true });
    } else {
      if (!minimizeOthers) continue;
      application.minimize();
    }
  }

  // Select and pan to current combatant.
  if (controlCurrent) current.object?.control({ releaseOthers: true });
  if (panToCurrent && current.object) canvas.animatePan({ ...current.object.center, duration: 1000 });
  return current;
}
