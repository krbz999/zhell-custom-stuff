import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.mjs";
import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { ZHELLHOOKS } from "./scripts/zhell-custom-stuff.mjs";
import { HandlebarHelpers } from "./scripts/effect-panel-classes.mjs";

Hooks.once("init", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
	api.register();
});
Hooks.once("setup", () => {
	// additions.
	ZHELLHOOKS.add_equipment_types();
	ZHELLHOOKS.add_divine();
	ZHELLHOOKS.add_conditions();
	ZHELLHOOKS.add_piety();

	// replacements.
	ZHELLHOOKS.replace_consumable_types();
	ZHELLHOOKS.replace_languages();
	ZHELLHOOKS.replace_tools();
	ZHELLHOOKS.replace_weapons();
	ZHELLHOOKS.replace_status_effects();
});
Hooks.once("ready", () => {
	// disable short and long rest.
	Hooks.on("renderLongRestDialog", ZHELLHOOKS.disable_long_rest);
	Hooks.on("renderShortRestDialog", ZHELLHOOKS.disable_short_rest);
	
	// sheet edits.
	Hooks.on("renderActorSheet5e", ZHELLHOOKS.rename_rest_labels);
	Hooks.on("renderActorSheet5e", ZHELLHOOKS.remove_resources);
	Hooks.on("renderActorSheet5e", ZHELLHOOKS.remove_alignment);
	Hooks.on("renderActorSheet5e", ZHELLHOOKS.disable_initiative_button);
	Hooks.on("renderActorSheet5e", ZHELLHOOKS.create_forage_counter);

	// create dots for limited uses and spell slots.
	Hooks.on("renderActorSheet", ZHELLHOOKS.create_dots);

	// color magic items of uncommon or higher quality.
	Hooks.on("renderActorSheet", ZHELLHOOKS.color_magic_items);

	// mark 0 hp combatants as defeated.
	if(game.user.isGM) Hooks.on("updateToken", ZHELLHOOKS.mark_defeated_combatant);

	// display ammo when you make an attack, if the ammo has a save.
	Hooks.on("preCreateChatMessage", ZHELLHOOKS.flag_attack_to_show_ammo_if_it_has_save);
	Hooks.on("createChatMessage", ZHELLHOOKS.show_ammo_if_it_has_save);

	// make the attunement button an actual toggle.
	Hooks.on("renderActorSheet", ZHELLHOOKS.create_toggle_on_attunement_button);

	// refresh colors.
	ZHELLHOOKS.refreshColors();
	
	// setup effectsPanel handlebar helpers, hooks, and other rendering.
	new HandlebarHelpers().registerHelpers(); // init helper setup.
	ZHELLHOOKS.effectsPanel.render(true); // init render.
	Hooks.on("collapseSidebar", (_, bool) => ZHELLHOOKS.effectsPanel.handleExpand(bool));
	for(let hook of ["updateWorldTime", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect", "controlToken", "preUpdateToken"]){
		Hooks.on(hook, () => ZHELLHOOKS.effectsPanel.refresh());
	}

});
Hooks.once("canvasReady", () => {
	ZHELLHOOKS.createEffectsPanel();
});

