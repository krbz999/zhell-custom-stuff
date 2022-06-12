import { MODULE_NAME, SETTING_NAMES } from "./const.mjs";

export function registerSettings() {
	_registerSettings();
}

function _registerSettings(){
	
	game.settings.register(MODULE_NAME, SETTING_NAMES.REPLACE_STATUS_EFFECTS, {
		name: "Replace Status Effects",
		hint: "Replace the status effects on the token hud.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REPLACE_LANGUAGES, {
		name: "Replace Languages",
		hint: "A total replace of all default languages, but using same keys if available. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REPLACE_TOOLS, {
		name: "Replace Tools",
		hint: "A total replace of all default tools, but using same keys if available. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REPLACE_WEAPONS, {
		name: "Replace Weapons",
		hint: "A total replace of all default weapons, but using same keys if available. Also gets rid of firearm-specific weapon attributes. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REPLACE_CONSUMABLE_TYPES, {
		name: "Replace Consumable Types",
		hint: "A replacement of the current consumable types, using original keys if available. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.ADD_CONDITIONS, {
		name: "Add New Conditions",
		hint: "An addition to current available conditions. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.ADD_EQUIPMENT_TYPES, {
		name: "Add New Equipment Types",
		hint: "An addition to current available equipment types. Not armor. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.ABILITY_SCORES, {
		name: "Add new Ability Scores",
		hint: "Adds Piety as a new ability score. Requires reload.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.ADD_SPELL_SCHOOL, {
		name: "Add Spell School",
		hint: "Add 'Divine' as a spell school.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	
	game.settings.register(MODULE_NAME, SETTING_NAMES.MINOR_SHEET_EDITS, {
		name: "Minor Sheet Edits",
		hint: "A collection of small edits to the base dnd5e character sheet.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REMOVE_ALIGNMENT, {
		name: "Remove Alignment",
		hint: "Remove the Alignment field on the character sheets.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REMOVE_INITIATIVE, {
		name: "Remove Initiative",
		hint: "Remove the functionality of the Initiative button on the character sheets.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.REMOVE_RESOURCES, {
		name: "Remove Resources",
		hint: "Removes the resources from character sheets.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.SHEET_UNLOCKER, {
		name: "Create Lock/Unlock Button",
		hint: "Replace the currency converter with a lock/unlock button.",
		scope: "client",
		config: true,
		type: Boolean,
		default: false
	});
	
	game.settings.register(MODULE_NAME, SETTING_NAMES.TOGGLE_LR, {
		name: "Toggle Long Rest",
		hint: "Toggle LR on or off.",
		scope: "world",
		config: false,
		type: Boolean,
		default: false
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.TOGGLE_SR, {
		name: "Toggle Short Rest",
		hint: "Toggle SR on or off.",
		scope: "world",
		config: false,
		type: Boolean,
		default: false
	});
	
	game.settings.register(MODULE_NAME, SETTING_NAMES.MATERIA_MEDICA_COUNTER, {
		name: "Enable Materia Medica Counter",
		hint: "Create a counter on the character sheet to store the value of materials.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_NAME, SETTING_NAMES.FORAGE_DC, {
		name: "Foraging DC",
		hint: "The current DC for foraging.",
		scope: "world",
		config: false,
		type: Number,
		default: 15
	});
}