import { DEFEATED, DISPLAY_AMMO, MODULE } from "../const.mjs";

export class ZHELL_COMBAT {

  // hooks on updateToken
  static markDefeatedCombatant = async (tokenDoc, updates) => {
    if (!game.settings.get(MODULE, DEFEATED)) return;
    if (tokenDoc.actor.hasPlayerOwner) return;
    if (!tokenDoc.combatant) return;
    const hpUpdate = foundry.utils.getProperty(updates, "actorData.system.attributes.hp.value");
    if (hpUpdate === undefined || hpUpdate > 0) return;
    const effect = CONFIG.statusEffects.find(e => e.id === "dead");
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
