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
        const saveButton = html[0].offsetParent.querySelector(".zhell-settings-save");
        const dialog = this;
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "replacementSettings", {
                replace_status_effects: html[0].querySelector(".zhell-replace-status-effects").checked,
                replace_languages: html[0].querySelector(".zhell-replace-languages").checked,
                replace_tools: html[0].querySelector(".zhell-replace-tools").checked,
                replace_weapons: html[0].querySelector(".zhell-replace-weapons").checked,
                replace_consumable_types: html[0].querySelector(".zhell-replace-consumable-types").checked
            });
            dialog.close();
        });
    }
    async getData() {
        const source = game.settings.get(MODULE, "replacementSettings");
        const defaults = {
            replace_status_effects: true,
            replace_languages: true,
            replace_tools: true,
            replace_weapons: true,
            replace_consumable_types: true
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
        const saveButton = html[0].offsetParent.querySelector(".zhell-settings-save");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "additionSettings", {
                add_conditions: html[0].querySelector(".zhell-add-conditions").checked,
                add_equipment_types: html[0].querySelector(".zhell-add-equipment-types").checked,
                add_piety: html[0].querySelector(".zhell-add-piety").checked,
                add_divine: html[0].querySelector(".zhell-add-divine").checked
            });
            dialog.close();
        });
    }
    async getData() {
        const source = game.settings.get(MODULE, "additionSettings");
        const defaults = {
            add_conditions: true,
            add_equipment_types: true,
            add_piety: true,
            add_divine: true
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
        const saveButton = html[0].offsetParent.querySelector(".zhell-settings-save");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "sheetSettings", {
                remove_resources: html[0].querySelector(".zhell-remove-resources").checked,
                remove_alignment: html[0].querySelector(".zhell-remove-alignment").checked,
                disable_initiative_button: html[0].querySelector(".zhell-disable-initiative-button").checked,
                create_forage_counter: html[0].querySelector(".zhell-create-forage-counter").checked,
                pretty_trait_selector: html[0].querySelector(".zhell-pretty-trait-selector").checked,
                collapsible_headers: html[0].querySelector(".zhell-collapsible-headers").checked
            });
            dialog.close();
        });
    }
    async getData() {
        const source = game.settings.get(MODULE, "sheetSettings");
        const defaults = {
            remove_resources: true,
            remove_alignment: true,
            disable_initiative_button: true,
            create_forage_counter: true,
            pretty_trait_selector: true,
            collapsible_headers: true
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
        const saveButton = html[0].offsetParent.querySelector(".zhell-settings-save");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "colorSettings", {
                limited_use_dots: html[0].querySelector(".zhell-limited-use-dots").checked,
                spell_slot_dots: html[0].querySelector(".zhell-spell-slot-dots").checked,
                color_full: html[0].querySelector(".zhell-color-full").value,
                color_attuned: html[0].querySelector(".zhell-color-attuned").value,
                color_not_attuned: html[0].querySelector(".zhell-color-not-attuned").value,
                color_equipped: html[0].querySelector(".zhell-color-equipped").value,
                color_not_equipped: html[0].querySelector(".zhell-color-not-equipped").value,
                color_prepared: html[0].querySelector(".zhell-color-prepared").value,
                color_not_prepared: html[0].querySelector(".zhell-color-not-prepared").value,
                color_always_prepared: html[0].querySelector(".zhell-color-always-prepared").value,
                color_proficient: html[0].querySelector(".zhell-color-proficient").value,
                color_half_proficient: html[0].querySelector(".zhell-color-half-proficient").value,
                color_twice_proficient: html[0].querySelector(".zhell-color-twice-proficient").value
            });
            ZHELL_SHEET.refreshColors();
            dialog.close();
        });
    }
    async getData() {
        const source = game.settings.get(MODULE, "colorSettings");
        const defaults = {
            limited_use_dots: false,
            spell_slot_dots: false,
            color_full: "#ff2e2e",
            color_attuned: "#21c050",
            color_not_attuned: "#c2c2c2",
            color_equipped: "#6dff38",
            color_not_equipped: "#c2c2c2",
            color_prepared: "#0000ff",
            color_not_prepared: "#c2c2c2",
            color_always_prepared: "#ff0004",
            color_proficient: "#228b22",
            color_half_proficient: "#696969",
            color_twice_proficient: "#ff6347"
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
        const saveButton = html[0].offsetParent.querySelector(".zhell-settings-save");
        saveButton.addEventListener("click", async function(){
            await game.settings.set(MODULE, "rarityColorSettings", {
                uncommon: html[0].querySelector(".zhell-color-uncommon").value,
                rare: html[0].querySelector(".zhell-color-rare").value,
                very_rare: html[0].querySelector(".zhell-color-very-rare").value,
                legendary: html[0].querySelector(".zhell-color-legendary").value,
                artifact: html[0].querySelector(".zhell-color-artifact").value
            });
            ZHELL_SHEET.refreshColors();
            dialog.close();
        });
    }
    async getData() {
        const source = game.settings.get(MODULE, "rarityColorSettings");
        const defaults = {
            uncommon: "#008000",
            rare: "#0000ff",
            very_rare: "#800080",
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
            replace_status_effects: true,
            replace_languages: true,
            replace_tools: true,
            replace_weapons: true,
            replace_consumable_types: true
        },
        onChange: () => window.location.reload()
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
            add_conditions: true,
            add_equipment_types: true,
            add_piety: true,
            add_divine: true
        },
        onChange: () => window.location.reload()
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
            remove_resources: true,
            remove_alignment: true,
            disable_initiative_button: true,
            create_forage_counter: true,
            pretty_trait_selector: true,
            collapsible_headers: true
        }
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
            limited_use_dots: false,
            spell_slot_dots: false,
            color_full: "#ff2e2e",
            color_attuned: "#21c050",
            color_not_attuned: "#c2c2c2",
            color_equipped: "#6dff38",
            color_not_equipped: "#c2c2c2",
            color_prepared: "#0000ff",
            color_not_prepared: "#c2c2c2",
            color_always_prepared: "#ff0004",
            color_proficient: "#228b22",
            color_half_proficient: "#696969",
            color_twice_proficient: "#ff6347"
        }
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
            very_rare: "#800080",
            legendary: "#ffa500",
            artifact: "#d2691e"
        }
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
