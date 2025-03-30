export default async function currentCombatant() {
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

  const minimize = (application) => {
    if ((application.document?.documentName === "Actor") && (application.document !== current.actor)) {
      application.minimize();
    }
  };

  // Close all sheets.
  for (const application of foundry.applications.instances.values()) minimize(application);
  for (const application of Object.values(ui.windows)) minimize(application);

  // Render current combatant.
  const sheet = current.actor.sheet;
  if (sheet.rendered) sheet.maximize();
  else sheet.render(true);

  // Select and pan to current combatant.
  current.object.control({ releaseOthers: true });
  canvas.animatePan({ ...current.object.center, duration: 1000 });
  return current;
}
