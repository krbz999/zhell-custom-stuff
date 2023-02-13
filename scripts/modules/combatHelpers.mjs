import { MODULE } from "../const.mjs";

export class ZHELL_COMBAT {

  // hooks on updateToken
  static async markDefeatedCombatant(tokenDoc, updates) {
    if (tokenDoc.actor.hasPlayerOwner) return;
    if (!tokenDoc.combatant) return;
    const hpUpdate = foundry.utils.getProperty(updates, "actorData.system.attributes.hp.value");
    if (hpUpdate === undefined || hpUpdate > 0) return;
    const effect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    await tokenDoc.object.toggleEffect(effect, { overlay: true });
    return tokenDoc.combatant.update({ defeated: true });
  }

  // hooks on dnd5e.rollAttack
  static async displaySavingThrowAmmo(weapon, roll, ammoUpdate) {
    if (!ammoUpdate.length) return;
    const ammoId = ammoUpdate[0]._id;
    const ammo = weapon.actor.items.get(ammoId);
    if (!ammo?.hasSave) return;
    return ammo.displayCard();
  }

  // hooks on dnd5e.useItem
  static spendReaction(item) {
    if (item.system.activation?.type !== "reaction") return;
    if (!game.combat) return;
    const has = item.parent.effects.find(e => e.flags.core?.statusId === "reaction");
    if (has) return;
    const combatant = item.parent.token?.combatant ?? item.parent.getActiveTokens()[0]?.combatant;
    if (!combatant) return;
    const reaction = CONFIG.statusEffects.find(e => e.id === "reaction");
    return combatant.token.toggleActiveEffect(reaction, { active: true });
  }
}

export function _replaceTokenHUD(hud, html, tokenData) {
  const sorting = CONFIG.statusEffects.reduce((acc, e) => {
    acc[e.id] = e.sort;
    return acc;
  }, {});
  const innerHTML = Object.values(tokenData.statusEffects).sort((a, b) => {
    return sorting[a.id] - sorting[b.id];
  }).reduce((acc, eff) => {
    const condition = CONFIG.statusEffects.find(e => e.id === eff.id) ?? {};
    const clss = "status-effect effect-control";
    const atts = (eff.isActive ? "active" : "") + " " + (eff.isOverlay ? "overlay" : "");
    const tooltip = foundry.utils.getProperty(condition, "flags.visual-active-effects.data.intro") ?? "";
    return acc + `
    <div src="${eff.src}" class="${clss} ${atts}" data-status-id="${eff.id}" data-tooltip="${tooltip}">
      <img class="status-effect-img" src="${eff.src}">
      <div class="status-effect-label">${eff.title}</div>
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
    const itemData = effect.flags[MODULE]?.itemData;
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
