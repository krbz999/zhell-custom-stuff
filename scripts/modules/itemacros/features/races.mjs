export const races = {RELENTLESS_ENDURANCE, DWARVEN_FORTITUDE};

async function RELENTLESS_ENDURANCE(item, speaker, actor, token, character, event, args) {
  if (actor.system.attributes.hp.value > 0) {
    ui.notifications.warn("You have not been reduced to zero hit points.");
    return;
  }
  const use = await item.use();
  if (!use) return;
  return actor.update({"system.attributes.hp.value": 1}, {dhp: 1});
}

async function DWARVEN_FORTITUDE(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;
  return actor.rollHitDie(undefined, {dialog: false});
}
