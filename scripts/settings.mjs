import { ADDITION, COLOR, DEFEATED, DISPLAY_AMMO, FORAGING, MODULE, RARITY, REPLACEMENT, SHEET } from "./const.mjs";
import { refreshColors } from "./modules/sheet_edits.mjs";

export function registerSettings() {
    _registerSettings();
    registerSettingsMenus();
}

function _registerSettings(){
    game.settings.register(MODULE, FORAGING, {
        name: "Foraging DC",
        hint: "The current DC for foraging.",
        scope: "world",
        config: true,
        type: Number,
        default: 15
    });
    game.settings.register(MODULE, DEFEATED, {
        name: "Mark Combatants Defeated",
        hint: "When combatants that are not owned by a player is reduced to 0 or less hp, mark them as defeated.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register(MODULE, DISPLAY_AMMO, {
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
    async _updateObject(event, formData){
        return game.settings.set(MODULE, REPLACEMENT, formData);
    }
    async getData() {
        const source = game.settings.get(MODULE, REPLACEMENT);
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
    async _updateObject(event, formData){
        return game.settings.set(MODULE, ADDITION, formData);
    }
    async getData() {
        const source = game.settings.get(MODULE, ADDITION);
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
    async _updateObject(event, formData){
        return game.settings.set(MODULE, SHEET, formData);
    }
    async getData() {
        const source = game.settings.get(MODULE, SHEET);
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
    async _updateObject(event, formData){
        const set = await game.settings.set(MODULE, COLOR, formData);
        refreshColors();
        return set;
    }
    async getData() {
        const source = game.settings.get(MODULE, COLOR);
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
    async _updateObject(event, formData){
        const set = await game.settings.set(MODULE, RARITY, formData);
        refreshColors();
        return set;
    }
    async getData() {
        const source = game.settings.get(MODULE, RARITY);
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
    game.settings.register(MODULE, REPLACEMENT, {
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
        onChange: () => SettingsConfig.reloadConfirm({world: true})
    });
    game.settings.registerMenu(MODULE, REPLACEMENT, {
        name: "Replacements",
        hint: "A collection of replacements for core and system content.",
        label: "Replacement Settings",
        icon: "fas fa-atlas",
        type: ReplacementsSubmenu,
        restricted: true
    });
    
    // additions.
    game.settings.register(MODULE, ADDITION, {
        scope: "world",
        config: false,
        type: Object,
        default: {
            addConditions: true,
            addEquipmentTypes: true,
            addPiety: true,
            addDivine: true
        },
        onChange: () => SettingsConfig.reloadConfirm({world: true})
    });
    game.settings.registerMenu(MODULE, ADDITION, {
        name: "Additions",
        hint: "A collection of additions to dnd5e system content.",
        label: "Addition Settings",
        icon: "fas fa-atlas",
        type: AdditionsSubmenu,
        restricted: true
    });
    
    // sheet edits.
    game.settings.register(MODULE, SHEET, {
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
        onChange: () => SettingsConfig.reloadConfirm({world: true})
    });
    game.settings.registerMenu(MODULE, SHEET, {
        name: "Sheet Edits",
        hint: "A collection of edits, removals, and additions to the core dnd5e character sheets.",
        label: "Sheet Settings",
        icon: "fas fa-atlas",
        type: SheetSubmenu,
        restricted: true
    });
    
    // sheet color settings.
    game.settings.register(MODULE, COLOR, {
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
        onChange: () => refreshColors()
    });
    game.settings.registerMenu(MODULE, COLOR, {
        name: "Sheet Colors",
        hint: "Settings for the colors that are applied to the actor sheets.",
        label: "Sheet Color Settings",
        icon: "fas fa-paint-roller",
        type: ColorPickerSubmenu,
        restricted: false
    });
    
    // item rarity color settings.
    game.settings.register(MODULE, RARITY, {
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
        onChange: () => refreshColors()
    });
    game.settings.registerMenu(MODULE, RARITY, {
        name: "Rarity Colors",
        hint: "Settings for the colors that are applied to items on an actor sheet depending on rarity.",
        label: "Item Rarity Color Settings",
        icon: "fas fa-paint-roller",
        type: RarityColorsSubmenu,
        restricted: false
    });
}
