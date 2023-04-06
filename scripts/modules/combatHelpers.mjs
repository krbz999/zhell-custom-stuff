import {MODULE} from "../const.mjs";

export class ZHELL_COMBAT {

  // hooks on updateToken
  static async markDefeatedCombatant(tokenDoc, updates) {
    if (tokenDoc.actor.hasPlayerOwner) return;
    if (!tokenDoc.combatant) return;
    const hpUpdate = foundry.utils.getProperty(updates, "actorData.system.attributes.hp.value");
    if (hpUpdate === undefined || hpUpdate > 0) return;
    const effect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    await tokenDoc.object.toggleEffect(effect, {overlay: true});
    return tokenDoc.combatant.update({defeated: true});
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
    const reaction = foundry.utils.duplicate(CONFIG.statusEffects.find(e => e.id === "reaction"));
    reaction["flags.visual-active-effects.data"] = {
      intro: "<p>" + game.i18n.format("ZHELL.StatusConditionReactionDescription", {name: item.name}) + "</p>",
      content: item.system.description.value
    };
    return combatant.token.toggleActiveEffect(reaction, {active: true});
  }
}

/**
 * Hook function to replace the token HUD condition selector with a new one
 * that has images and labels, as well as tooltips.
 * @param {TokenHUD} hud          The token HUD.
 * @param {HTML} html             The element of the HUD.
 * @param {object} tokenData      The data of the token related to the HUD.
 */
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

/**
 * Inject buttons into VAE effects.
 * @param {ActiveEffect} effect     The active effect being rendered.
 * @param {object[]} buttons        The array of buttons on this effect.
 */
export function _visualActiveEffectsCreateEffectButtons(effect, buttons) {
  // Item data and type must be added in the effect by this module.
  const {itemData, types} = effect.flags[MODULE] ?? {};
  if (!itemData || !types) return;

  // Use the item embedded.
  if (types.includes("use")) {
    buttons.push({
      label: `${itemData.name} (Use)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        item.prepareFinalAttributes();
        return item.use({}, {"flags.dnd5e.itemData": itemData});
      }
    });
  }

  // Redisplay the item embedded.
  if (types.includes("redisplay")) {
    buttons.push({
      label: `${itemData.name} (Chat)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        item.prepareFinalAttributes();
        return item.displayCard();
      }
    });
  }

  // Make an attack roll with the item embedded.
  if (types.includes("attack")) {
    buttons.push({
      label: `${itemData.name} (Attack)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        return item.rollAttack({event});
      }
    });
  }

  // Make a damage roll with the item embedded.
  if (types.includes("damage")) {
    buttons.push({
      label: `${itemData.name} (Damage)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        return item.rollDamage({event});
      }
    });
  }

  // Make a healing roll with the item embedded.
  if (types.includes("healing")) {
    buttons.push({
      label: `${itemData.name} (Healing)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        return item.rollDamage({event});
      }
    });
  }

  // Create a measured template from the item embedded.
  if (types.includes("template")) {
    buttons.push({
      label: `${itemData.name} (Template)`,
      callback: () => {
        const item = new Item.implementation(itemData, {parent: effect.parent});
        return dnd5e.canvas.AbilityTemplate.fromItem(item).drawPreview();
      }
    });
  }
}

/**
 * Recharge monster features with a d6 during combat. The script is only executed
 * if the combat is advanced forward in the turns or rounds.
 * @param {Combat} combat       The combat document being updated.
 * @param {object} update       The update object used to update the combat document.
 * @param {object} context      Object of update options.
 * @param {string} userId       The id of the user performing the update.
 */
export async function _rechargeMonsterFeatures(combat, update, context, userId) {
  if (!game.user.isGM || (context.direction !== 1)) return;
  const actor = combat.combatant.actor;
  for (const item of actor.items) {
    const recharge = item.system.recharge;
    if (!recharge?.value || recharge?.charged) continue;
    await item.rollRecharge();
  }
  const max = actor.system.resources.legact.max;
  if (max > 0) {
    await actor.update({"system.resources.legact.value": max});
    await ChatMessage.create({
      content: `${actor.name}'s legendary actions were reset`,
      whisper: [game.user.id]
    });
  }
}
