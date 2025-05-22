/**
 * Pan to a current combatant.
 * @param {object} [options={}]
 * @param {boolean} [options.controlCurrent=true]     Control the token of the current combatant?
 * @param {boolean} [options.panToCurrent=true]       Pan to the token of the current combatant?
 * @param {boolean} [options.maximizeCurrent=true]    Render and maximize the sheet of the current combatant's actor?
 * @param {boolean} [options.minimizeOthers=true]     Minimize all other actor sheets?
 * @returns {Promise<foundry.documents.Combatant>}    A promise that resolves to the current combatant.
 */
export default async function currentCombatant(options = {}) {
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

  options = foundry.utils.mergeObject({
    controlCurrent: true,
    panToCurrent: true,
    maximizeCurrent: true,
    minimizeOthers: true,
  }, options, { enforceTypes: true });

  // Minimize all sheets except those that point to the current combatant's actor.
  for (const application of foundry.applications.instances.values()) {
    if (!foundry.utils.isSubclass(application.constructor, foundry.applications.sheets.ActorSheet)) continue;

    if (application.document === current.actor) {
      if (!options.maximizeCurrent) continue;
      if (application.rendered) application.maximize();
      else application.render({ force: true });
    } else {
      if (!options.minimizeOthers) continue;
      application.minimize();
    }
  }

  // Select and pan to current combatant.
  if (options.controlCurrent) current.object?.control({ releaseOthers: true });
  if (options.panToCurrent && current.object) canvas.animatePan({ ...current.object.center, duration: 1000 });
  return current;
}
