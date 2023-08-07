import {SlotRecoverer} from "../../applications/slotRecoverer.mjs";

export const wizard = {ARCANE_RECOVERY};

async function ARCANE_RECOVERY(item, speaker, actor, token, character, event, args) {
  const config = {maxValue: Math.ceil(actor.classes.wizard.system.levels / 2), maxLevel: 6};
  const missing = SlotRecoverer.missingSlots(actor, config);
  if (!missing) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return null;
  }
  const use = await item.use();
  if (!use) return null;
  return new SlotRecoverer(actor, config).render(true);
}
