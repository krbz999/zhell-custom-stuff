import { MODULE } from "../const.mjs";

export class ZHELL_ADDITIONS {
    
    static addEquipmentTypes = () => {
        if ( !game.settings.get(MODULE, "additionSettings").addEquipmentTypes ) return;
        
        const toAdd = { wand: "Wand" };
        foundry.utils.mergeObject(CONFIG.DND5E.equipmentTypes, toAdd);
        foundry.utils.mergeObject(CONFIG.DND5E.miscEquipmentTypes, toAdd);
    }
    
    static addDivine = () => {
        if ( !game.settings.get(MODULE, "additionSettings").addDivine ) return;

        const toAdd = { divine: "Divine" };
        foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, toAdd);
    }
    
    static addConditions = () => {
        if ( !game.settings.get(MODULE, "additionSettings").addConditions ) return;

        const toAdd = { turned: "Turned" };
        foundry.utils.mergeObject(CONFIG.DND5E.conditionTypes, toAdd);
    }
    
    static addPiety = () => {
        if ( !game.settings.get(MODULE, "additionSettings").addPiety ) return;

        CONFIG.DND5E.abilities["pty"] = "Piety";
        CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
    }
}
