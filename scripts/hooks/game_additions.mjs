import { MODULE_NAME } from "../const.mjs";

export class ZHELL_ADDITIONS {
    
    static add_equipment_types = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_equipment_types) return;
		CONFIG.DND5E.equipmentTypes["wand"] = "Wand";
		CONFIG.DND5E.miscEquipmentTypes["wand"] = "Wand";
	}
	
	static add_divine = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_divine) return;
		CONFIG.DND5E.spellSchools["divine"] = "Divine";
	}
	
	static add_conditions = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_conditions) return;
		CONFIG.DND5E.conditionTypes["turned"] = "Turned";
	}
	
	static add_piety = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_piety) return;
		CONFIG.DND5E.abilities["pty"] = "Piety";
		CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
	}
	
}
