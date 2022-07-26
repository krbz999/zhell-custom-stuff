import { MODULE_NAME } from "../const.mjs";

export class ZHELL_COMBAT {
    
    static mark_defeated_combatant = async (tokenDoc, updates) => {
		if(!game.settings.get(MODULE_NAME, "markDefeatedCombatants")) return;
		if(tokenDoc.actor.hasPlayerOwner) return;
		if(!tokenDoc.combatant) return;
		const hpUpdate = foundry.utils.getProperty(updates, "actorData.data.attributes.hp.value");
		if(hpUpdate === undefined || hpUpdate > 0) return;
		const effect = CONFIG.statusEffects.find(i => i.id === "dead");
		await tokenDoc.object.toggleEffect(effect, {overlay: true});
		await tokenDoc.combatant.update({defeated: true});
	}
	
	static flag_attack_to_show_ammo_if_it_has_save = (message, messageData, context, userId) => {
		if(!game.settings.get(MODULE_NAME, "displaySavingThrowAmmo")) return;
		
		// must be an attack roll.
		if(foundry.utils.getProperty(messageData, "flags.dnd5e.roll.type") !== "attack") return;
		
		// get the item id.
		const itemId = foundry.utils.getProperty(messageData, "flags.dnd5e.roll.itemId");
		if(!itemId) return;
		
		// get the actor.
		const actorId = foundry.utils.getProperty(messageData, "speaker.actor");
		const actor = game.actors.get(actorId);
		if(!actor) return;
		
		// attempt to find the item.
		const item = actor.items.get(itemId);
		if(!item) return;
		
		// find ammo on the actor.
		const consume = foundry.utils.getProperty(item, "data.data.consume");
		if(!consume) return;
		const {amount, target: ammoId, type} = consume;
		if(!ammoId || type !== "ammo") return;
		const ammo = actor.items.get(ammoId);
		if(!ammo) return;
		
		// does ammo have save?
		const ammoHasSave = foundry.utils.getProperty(ammo, "data.data.save.ability");
		if(!ammoHasSave) return;
		
		// display ammo.
		context["display-ammo"] = {display: true, userId, actorId, ammoId}
	}

	static show_ammo_if_it_has_save = async (message, context, userId) => {
		if(!game.settings.get(MODULE_NAME, "displaySavingThrowAmmo")) return;
		
		// display ammo?
		if(!foundry.utils.getProperty(context, "display-ammo.display")) return;
		
		// only for the user.
		if(foundry.utils.getProperty(context, "display-ammo.userId") !== userId) return;
		
		// get ids.
		const {actorId, ammoId} = foundry.utils.getProperty(context, "display-ammo");
		
		// display ammo card.
		return game.actors.get(actorId).items.get(ammoId).displayCard();
	}

	
}
