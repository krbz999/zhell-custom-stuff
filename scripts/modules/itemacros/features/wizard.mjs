import {SlotRecoverer} from "../../applications/slotRecoverer.mjs";

export const wizard = {ARCANE_RECOVERY};

async function ARCANE_RECOVERY(item) {
  const config = {maxValue: Math.ceil(item.actor.classes.wizard.system.levels / 2), maxLevel: 6};
  const missing = SlotRecoverer.missingSlots(item.actor, config);
  if (!missing) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return null;
  }
  const use = await item.use();
  if (!use) return null;
  return new SlotRecoverer(item.actor, config).render(true);
}
