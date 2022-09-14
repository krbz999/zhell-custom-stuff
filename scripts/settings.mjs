import { MODULE } from "./const.mjs";
import { ZHELL_SHEET } from "./modules/sheet_edits.mjs";

export function registerSettings() {
    _registerSettings();
    registerSettingsMenus();
}

function _registerSettings(){
    game.settings.register(MODULE, "toggleLR", {
        name: "Disable Long Rest",
        hint: "If checked, players cannot take a long rest.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
    game.settings.register(MODULE, "toggleSR", {
        name: "Disable Short Rest",
        hint: "If checked, players cannot take a short rest.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
    game.settings.register(MODULE, "foragingDC", {
        name: "Foraging DC",
        hint: "The current DC for foraging.",
        scope: "world",
        config: true,
        type: Number,
        default: 15
    });
    game.settings.register(MODULE, "markDefeatedCombatants", {
        name: "Mark Combatants Defeated",
        hint: "When combatants that are not owned by a player is reduced to 0 or less hp, mark them as defeated.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register(MODULE, "displaySavingThrowAmmo", {
        name: "Show Saving Throw Ammo",
        hint: "If ammunition has a saving throw, it will be displayed when a weapon makes an attack roll.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
}

class ReplacementsSubmenu extends FormApplication {
    constructor() {
        super({});
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            width: "550",
            height: "auto",
            template: `/modules/${MODULE}/templates/settings_replacements.hbs`,
            id: "zhell-settings-submenu-replacers",
            title: "Replacements",
            resizable: false
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html[0].querySelector("[name='submit']");
        const dialog = this;
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "replacementSettings", {
                replaceStatusEffects: html[0].querySelector("#replaceStatusEffects").checked,
                replaceLanguages: html[0].querySelector("#replaceLanguages").checked,
                replaceTools: html[0].querySelector("#replaceTools").checked,
                replaceWeapons: html[0].querySelector("#replaceWeapons").checked,
                replaceConsumableTypes: html[0].querySelector("#replaceConsumableTypes").checked
            });
            dialog.close();
        });
    }
    async _updateObject(...T){}
    async getData() {
        const source = game.settings.get(MODULE, "replacementSettings");
        const defaults = {
            replaceStatusEffects: true,
            replaceLanguages: true,
            replaceTools: true,
            replaceWeapons: true,
            replaceConsumableTypes: true
        }
        return foundry.utils.mergeObject(defaults, source);
    }
}

class AdditionsSubmenu extends FormApplication {
    constructor() {
        super({});
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            width: "550",
            height: "auto",
            template: `/modules/${MODULE}/templates/settings_additions.hbs`,
            id: "zhell-settings-submenu-additions",
            title: "Additions",
            resizable: false
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const dialog = this;
        const saveButton = html[0].querySelector("[name='submit']");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "additionSettings", {
                addConditions: html[0].querySelector("#addConditions").checked,
                addEquipmentTypes: html[0].querySelector("#addEquipmentTypes").checked,
                addPiety: html[0].querySelector("#addPiety").checked,
                addDivine: html[0].querySelector("#addDivine").checked
            });
            dialog.close();
        });
    }
    async _updateObject(...T){}
    async getData() {
        const source = game.settings.get(MODULE, "additionSettings");
        const defaults = {
            addConditions: true,
            addEquipmentTypes: true,
            addPiety: true,
            addDivine: true
        }
        
        return foundry.utils.mergeObject(defaults, source);
    }
}

class SheetSubmenu extends FormApplication {
    constructor() {
        super({});
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            width: "550",
            height: "auto",
            template: `/modules/${MODULE}/templates/settings_sheet.hbs`,
            id: "zhell-settings-submenu-sheet",
            title: "Sheet Adjustments",
            resizable: false
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const dialog = this;
        const saveButton = html[0].querySelector("[name='submit']");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "sheetSettings", {
                removeResources: html[0].querySelector("#removeResources").checked,
                removeAlignment: html[0].querySelector("#removeAlignment").checked,
                disableInitiativeButton: html[0].querySelector("#disableInitiativeButton").checked,
                createForaging: html[0].querySelector("#createForaging").checked,
                reformatTraitSelectors: html[0].querySelector("#reformatTraitSelectors").checked,
                collapsibleHeaders: html[0].querySelector("#collapsibleHeaders").checked
            });
            dialog.close();
        });
    }
    async _updateObject(...T){}
    async getData() {
        const source = game.settings.get(MODULE, "sheetSettings");
        const defaults = {
            removeResources: true,
            removeAlignment: true,
            disableInitiativeButton: true,
            createForaging: true,
            reformatTraitSelectors: true,
            collapsibleHeaders: true
        }
        
        return foundry.utils.mergeObject(defaults, source);
    }
}

class ColorPickerSubmenu extends FormApplication {
    constructor() {
        super({});
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            width: "550",
            height: "auto",
            template: `/modules/${MODULE}/templates/settings_colorpickers.hbs`,
            id: "zhell-settings-submenu-colorpickers",
            title: "Character Sheet Color Adjustments",
            resizable: false
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const dialog = this;
        const saveButton = html[0].querySelector("[name='submit']");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "colorSettings", {
                showLimitedUses: html[0].querySelector("#showLimitedUses").checked,
                showSpellSlots: html[0].querySelector("#showSpellSlots").checked,
                usesUnexpended: html[0].querySelector("#usesUnexpended").value,
                itemAttuned: html[0].querySelector("#itemAttuned").value,
                itemNotAttuned: html[0].querySelector("#itemNotAttuned").value,
                itemEquipped: html[0].querySelector("#itemEquipped").value,
                itemNotEquipped: html[0].querySelector("#itemNotEquipped").value,
                spellPrepared: html[0].querySelector("#spellPrepared").value,
                spellNotPrepared: html[0].querySelector("#spellNotPrepared").value,
                spellAlwaysPrepared: html[0].querySelector("#spellAlwaysPrepared").value,
                proficientNormal: html[0].querySelector("#proficientNormal").value,
                proficientHalf: html[0].querySelector("#proficientHalf").value,
                proficientTwice: html[0].querySelector("#proficientTwice").value
            });
            ZHELL_SHEET.refreshColors();
            dialog.close();
        });
    }
    async _updateObject(...T){}
    async getData() {
        const source = game.settings.get(MODULE, "colorSettings");
        const defaults = {
            showLimitedUses: false,
            showSpellSlots: false,
            usesUnexpended: "#ff2e2e",
            itemAttuned: "#21c050",
            itemNotAttuned: "#c2c2c2",
            itemEquipped: "#6dff38",
            itemNotEquipped: "#c2c2c2",
            spellPrepared: "#0000ff",
            spellNotPrepared: "#c2c2c2",
            spellAlwaysPrepared: "#ff0004",
            proficientNormal: "#228b22",
            proficientHalf: "#696969",
            proficientTwice: "#ff6347"
        }
        return foundry.utils.mergeObject(defaults, source);
    }
}

class RarityColorsSubmenu extends FormApplication {
    constructor(){
        super({});
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            width: "550",
            height: "auto",
            template: `/modules/${MODULE}/templates/settings_raritycolors.hbs`,
            id: "zhell-settings-submenu-raritycolors",
            title: "Item Rarity Color Adjustments",
            resizable: false
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const dialog = this;
        const saveButton = html[0].querySelector("[name='submit']");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "rarityColorSettings", {
                uncommon: html[0].querySelector("#uncommon").value,
                rare: html[0].querySelector("#rare").value,
                veryRare: html[0].querySelector("#veryRare").value,
                legendary: html[0].querySelector("#legendary").value,
                artifact: html[0].querySelector("#artifact").value
            });
            ZHELL_SHEET.refreshColors();
            dialog.close();
        });
    }
    async _updateObject(...T){}
    async getData() {
        const source = game.settings.get(MODULE, "rarityColorSettings");
        const defaults = {
            uncommon: "#008000",
            rare: "#0000ff",
            veryRare: "#800080",
            legendary: "#ffa500",
            artifact: "#d2691e"
        }
        return foundry.utils.mergeObject(defaults, source);
    }
}

const registerSettingsMenus = function () {
    // replacements.
    game.settings.register(MODULE, "replacementSettings", {
        scope: "world",
        config: false,
        type: Object,
        default: {
            replaceStatusEffects: true,
            replaceLanguages: true,
            replaceTools: true,
            replaceWeapons: true,
            replaceConsumableTypes: true
        },
        onChange: foundry.utils.debouncedReload
    });
    game.settings.registerMenu(MODULE, "replacementSettings", {
        name: "Replacements",
        hint: "A collection of replacements for core and system content.",
        label: "Replacement Settings",
        icon: "fas fa-atlas",
        type: ReplacementsSubmenu,
        restricted: true
    });
    
    // additions.
    game.settings.register(MODULE, "additionSettings", {
        scope: "world",
        config: false,
        type: Object,
        default: {
            addConditions: true,
            addEquipmentTypes: true,
            addPiety: true,
            addDivine: true
        },
        onChange: foundry.utils.debouncedReload
    });
    game.settings.registerMenu(MODULE, "additionSettings", {
        name: "Additions",
        hint: "A collection of additions to dnd5e system content.",
        label: "Addition Settings",
        icon: "fas fa-atlas",
        type: AdditionsSubmenu,
        restricted: true
    });
    
    // sheet edits.
    game.settings.register(MODULE, "sheetSettings", {
        scope: "world",
        config: false,
        type: Object,
        default: {
            removeResources: true,
            removeAlignment: true,
            disableInitiativeButton: true,
            createForaging: true,
            reformatTraitSelectors: true,
            collapsibleHeaders: true
        },
        onChange: foundry.utils.debouncedReload
    });
    game.settings.registerMenu(MODULE, "sheetSettings", {
        name: "Sheet Edits",
        hint: "A collection of edits, removals, and additions to the core dnd5e character sheets.",
        label: "Sheet Settings",
        icon: "fas fa-atlas",
        type: SheetSubmenu,
        restricted: true
    });
    
    // sheet color settings.
    game.settings.register(MODULE, "colorSettings", {
        scope: "client",
        config: false,
        type: Object,
        default: {
            showLimitedUses: false,
            showSpellSlots: false,
            usesUnexpended: "#ff2e2e",
            itemAttuned: "#21c050",
            itemNotAttuned: "#c2c2c2",
            itemEquipped: "#6dff38",
            itemNotEquipped: "#c2c2c2",
            spellPrepared: "#0000ff",
            spellNotPrepared: "#c2c2c2",
            spellAlwaysPrepared: "#ff0004",
            proficientNormal: "#228b22",
            proficientHalf: "#696969",
            proficientTwice: "#ff6347"
        },
        onChange: () => ZHELL_SHEET.refreshColors()
    });
    game.settings.registerMenu(MODULE, "colorSettings", {
        name: "Sheet Colors",
        hint: "Settings for the colors that are applied to the actor sheets.",
        label: "Sheet Color Settings",
        icon: "fas fa-paint-roller",
        type: ColorPickerSubmenu,
        restricted: false
    });
    
    // item rarity color settings.
    game.settings.register(MODULE, "rarityColorSettings", {
        scope: "client",
        config: false,
        type: Object,
        default: {
            uncommon: "#008000",
            rare: "#0000ff",
            veryRare: "#800080",
            legendary: "#ffa500",
            artifact: "#d2691e"
        },
        onChange: () => ZHELL_SHEET.refreshColors()
    });
    game.settings.registerMenu(MODULE, "rarityColorSettings", {
        name: "Rarity Colors",
        hint: "Settings for the colors that are applied to items on an actor sheet depending on rarity.",
        label: "Item Rarity Color Settings",
        icon: "fas fa-paint-roller",
        type: RarityColorsSubmenu,
        restricted: false
    });
}
