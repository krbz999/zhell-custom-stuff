import { DEFEATED, DISPLAY_AMMO, MODULE } from "../const.mjs";

export class ZHELL_COMBAT {

  // hooks on updateToken
  static markDefeatedCombatant = async (tokenDoc, updates) => {
    if (!game.settings.get(MODULE, DEFEATED)) return;
    if (tokenDoc.actor.hasPlayerOwner) return;
    if (!tokenDoc.combatant) return;
    const hpUpdate = foundry.utils.getProperty(updates, "actorData.system.attributes.hp.value");
    if (hpUpdate === undefined || hpUpdate > 0) return;
    const effect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    await tokenDoc.object.toggleEffect(effect, { overlay: true });
    return tokenDoc.combatant.update({ defeated: true });
  }

  // hooks on dnd5e.rollAttack
  static displaySavingThrowAmmo = async (weapon, roll, ammoUpdate) => {
    if (!game.settings.get(MODULE, DISPLAY_AMMO)) return;
    if (!ammoUpdate.length) return;
    const ammoId = ammoUpdate[0]._id;
    const ammo = weapon.actor.items.get(ammoId);
    if (!ammo?.hasSave) return;
    return ammo.displayCard();
  }
}

Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
  const innerHTML = Object.values(tokenData.statusEffects).reduce((acc, { id, title, src, isActive, isOverlay }) => {
    return acc + `
    <div src="${src}" class="status-effect effect-control ${isActive ? 'active' : ''} ${isOverlay ? 'overlay' : ''}" data-status-id="${id}">
      <img class="status-effect-img" src="${src}">
      <div class="status-effect-label">${title}</div>
    </div>`;
  }, "");
  const panel = html[0].querySelector(".status-effects");
  panel.innerHTML = innerHTML;
});

Hooks.on("renderChatMessage", function(message, html) {
  if (!game.user.isGM) return;
  const saveButton = html[0].querySelector("button[data-action='save']");
  if (!saveButton) return;
  const [_, __, ___, tar] = saveButton.innerText.trim().split(" ");
  const abilityId = saveButton.dataset.ability;
  if (!tar || !abilityId) return;

  const BUTTON = document.createElement("BUTTON");
  BUTTON.innerHTML = "[ Group Saving Throw ]";
  saveButton.after(BUTTON);
  BUTTON.addEventListener("click", (e) => rollSaves(e, abilityId, Number(tar)));
});

async function rollSaves(event, abilityId, targetValue) {
  const tokens = canvas.tokens.controlled;
  const failed = [];
  for (const token of tokens) {
    const roll = await token.actor.rollAbilitySave(abilityId, { targetValue, event });
    if (!roll) continue;
    if (roll.total < targetValue) failed.push(token);
  }
  canvas.tokens.releaseAll();
  failed.forEach(t => t.control({ releaseOthers: false }));
  return game.user.updateTokenTargets(failed.map(t => t.id));
}
