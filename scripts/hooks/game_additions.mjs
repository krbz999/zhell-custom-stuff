import { MODULE_NAME } from "../const.mjs";

export class ZHELL_ADDITIONS {
    
    static add_equipment_types = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_equipment_types) return;
		
		const toAdd = {wand: "Wand"};
		foundry.utils.mergeObject(CONFIG.DND5E.equipmentTypes, toAdd);
		foundry.utils.mergeObject(CONFIG.DND5E.miscEquipmentTypes, toAdd);
	}
	
	static add_divine = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_divine) return;

		const toAdd = {divine: "Divine"};
		foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, toAdd);
	}
	
	static add_conditions = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_conditions) return;

		const toAdd = {turned: "Turned"};
		foundry.utils.mergeObject(CONFIG.DND5E.conditionTypes, toAdd);
	}
	
	static add_piety = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_piety) return;
		
		CONFIG.DND5E.abilities["pty"] = "Piety";
		CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
	}
	
}
