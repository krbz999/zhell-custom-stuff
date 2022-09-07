import { MODULE } from "../const.mjs";

export class ZHELL_COMBAT {
    
    static mark_defeated_combatant = async (tokenDoc, updates) => {
        if ( !game.settings.get(MODULE, "markDefeatedCombatants") ) return;
        if ( tokenDoc.actor.hasPlayerOwner ) return;
        if ( !tokenDoc.combatant ) return;
        const hpUpdate = foundry.utils.getProperty(updates, "actorData.system.attributes.hp.value");
        if ( hpUpdate === undefined || hpUpdate > 0 ) return;
        const effect = CONFIG.statusEffects.find(i => i.id === "dead");
        await tokenDoc.object.toggleEffect(effect, {overlay: true});
        await tokenDoc.combatant.update({defeated: true});
    }

    static show_ammo_if_it_has_save = async (weapon, roll, ammoUpdate) => {
        if ( !game.settings.get(MODULE, "displaySavingThrowAmmo") ) return;
        if ( !ammoUpdate.length ) return;
        const ammoId = ammoUpdate[0]._id;
        const ammo = weapon.actor.items.get(ammoId);
        if ( ammo.hasSave ) return ammo.displayCard();
        return;
    }
}
