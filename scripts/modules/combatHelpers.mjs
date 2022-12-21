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
    if (!ammoUpdate.length) return;
    if (!game.settings.get(MODULE, DISPLAY_AMMO)) return;
    const ammoId = ammoUpdate[0]._id;
    const ammo = weapon.actor.items.get(ammoId);
    if (!ammo?.hasSave) return;
    return ammo.displayCard();
  }
}

export function _replaceTokenHUD(hud, html, tokenData){
  const innerHTML = Object.values(tokenData.statusEffects).reduce((acc, { id, title, src, isActive, isOverlay }) => {
    const clss = "status-effect effect-control";
    const atts = (isActive ? "active" : "") + " " + (isOverlay ? "overlay" : "");
    return acc + `
    <div src="${src}" class="${clss} ${atts}" data-status-id="${id}">
      <img class="status-effect-img" src="${src}">
      <div class="status-effect-label">${title}</div>
    </div>`;
  }, "");
  html[0].querySelector(".status-effects").innerHTML = innerHTML;
}

export function _setupGroupSaves(message, html) {
  html[0].querySelectorAll("button[data-action='save']").forEach(saveButton => {
    const [_, __, ___, tar] = saveButton.innerText.trim().split(" ");
    const abilityId = saveButton.dataset.ability;
    if (!tar || !abilityId) return;

    saveButton.addEventListener("click", (e) => {
      const alt = e.ctrlKey && e.shiftKey;
      if (!alt) return;
      e.stopPropagation();
      return rollSaves(abilityId, Number(tar));
    });
  });
}

async function rollSaves(abilityId, targetValue) {
  const tokens = canvas.tokens.controlled;
  if (!tokens.length) return;
  const failed = [];
  for (const token of tokens) {
    const roll = await token.actor.rollAbilitySave(abilityId, { targetValue });
    if (!roll) continue;
    if (roll.total < targetValue) failed.push(token);
  }
  canvas.tokens.releaseAll();
  failed.forEach(t => t.control({ releaseOthers: false }));
  return game.user.updateTokenTargets(failed.map(t => t.id));
}

export function _setupCustomButtons() {
  document.addEventListener("click", async function(event) {
    const button = event.target.closest(".zhell-custom-buttons a");
    if (!button) return;
    const uuid = button.closest("[data-effect-uuid")?.dataset.effectUuid;
    if (!uuid) return;
    const effect = await fromUuid(uuid);
    const itemData = effect.getFlag(MODULE, "itemData");
    if (!itemData) return;
    const item = new Item.implementation(itemData, { parent: effect.parent });
    if (button.dataset.type === "use") return item.use({}, { "flags.dnd5e.itemData": itemData });
    if (button.dataset.type === "redisplay") return _redisplayItem(item, button.dataset.level, itemData);
    else if (button.dataset.type === "attack") return item.rollAttack({ event });
    else if (button.dataset.type === "damage") return item.rollDamage({ event });
    else if (button.dataset.type === "template") return dnd5e.canvas.AbilityTemplate.fromItem(item).drawPreview();
  });
}

// display (use) an item at a given level. For spells only.
export function _redisplayItem(item, level, itemData = {}) {
  const clone = item.clone({ "system.level": level }, { keepId: true });
  clone.prepareFinalAttributes();
  return clone.use({
    createMeasuredTemplate: false,
    consumeQuantity: false,
    consumeRecharge: false,
    consumeResource: false,
    consumeSpellLevel: false,
    consumeSpellSlot: false,
    consumeUsage: false
  }, { configureDialog: false, "flags.dnd5e.itemData": itemData });
}
