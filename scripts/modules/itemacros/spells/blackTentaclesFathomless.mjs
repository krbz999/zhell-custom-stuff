export async function FATHOMLESS_EVARDS_BLACK_TENTACLES(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;
  return actor.applyTempHP(actor.classes.warlock.system.levels);
}
