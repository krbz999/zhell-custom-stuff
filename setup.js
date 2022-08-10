import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.mjs";
import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { HandlebarHelpers, ZHELL_EFFECTS_PANEL } from "./scripts/modules/effect-panel-classes.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { ZHELL_ADDITIONS } from "./scripts/modules/game_additions.mjs";
import { ZHELL_REPLACEMENTS } from "./scripts/modules/game_replacements.mjs";
import { ZHELL_SHEET } from "./scripts/modules/sheet_edits.mjs";
import { ZHELL_COMBAT } from "./scripts/modules/combat_helpers.mjs";

Hooks.once("init", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
	api.register();
});
Hooks.once("setup", () => {
	// additions.
	ZHELL_ADDITIONS.add_equipment_types();
	ZHELL_ADDITIONS.add_divine();
	ZHELL_ADDITIONS.add_conditions();
	ZHELL_ADDITIONS.add_piety();

	// replacements.
	ZHELL_REPLACEMENTS.replace_consumable_types();
	ZHELL_REPLACEMENTS.replace_languages();
	ZHELL_REPLACEMENTS.replace_tools();
	ZHELL_REPLACEMENTS.replace_weapons();
	ZHELL_REPLACEMENTS.replace_status_effects();

	// rename currency labels; this shows up on the sheet.
	ZHELL_SHEET.rename_currency_labels();

});
Hooks.once("ready", () => {
	// disable short and long rest.
	Hooks.on("renderLongRestDialog", ZHELL_SHEET.disable_long_rest);
	Hooks.on("renderShortRestDialog", ZHELL_SHEET.disable_short_rest);
	
	// sheet edits.
	Hooks.on("renderActorSheet", ZHELL_SHEET.rename_rest_labels);
	Hooks.on("renderActorSheet", ZHELL_SHEET.remove_resources);
	Hooks.on("renderActorSheet", ZHELL_SHEET.remove_alignment);
	Hooks.on("renderActorSheet", ZHELL_SHEET.disable_initiative_button);
	Hooks.on("renderActorSheet", ZHELL_SHEET.create_forage_counter);
	Hooks.on("renderActorSheet", ZHELL_SHEET.set_hp_color);
	Hooks.on("renderActorSheet", ZHELL_SHEET.disable_exhaustion);
	Hooks.on("renderActorSheet", ZHELL_SHEET.collapsible_headers);
	
	// create dots for limited uses and spell slots.
	Hooks.on("renderActorSheet", ZHELL_SHEET.create_dots);

	// color magic items of uncommon or higher quality.
	Hooks.on("renderActorSheet", ZHELL_SHEET.color_magic_items);

	// make the attunement button an actual toggle.
	Hooks.on("renderActorSheet", ZHELL_SHEET.create_toggle_on_attunement_button);

	// make the trait and proficiency selectors less ugly.
	Hooks.on("renderTraitSelector", ZHELL_SHEET.pretty_trait_selector);

	// refresh colors.
	ZHELL_SHEET.refreshColors();

	// mark 0 hp combatants as defeated.
	if(game.user.isGM) Hooks.on("updateToken", ZHELL_COMBAT.mark_defeated_combatant);

	// display ammo when you make an attack, if the ammo has a save.
	Hooks.on("preCreateChatMessage", ZHELL_COMBAT.flag_attack_to_show_ammo_if_it_has_save);
	Hooks.on("createChatMessage", ZHELL_COMBAT.show_ammo_if_it_has_save);

	// setup effectsPanel handlebar helpers, hooks, and other rendering.
	new HandlebarHelpers().registerHelpers(); // init helper setup.
	ZHELL_EFFECTS_PANEL.effectsPanel.render(true); // init render.
	Hooks.on("collapseSidebar", (_, bool) => ZHELL_EFFECTS_PANEL.effectsPanel.handleExpand(bool));
	for(let hook of [
		"updateWorldTime", "createActiveEffect", "updateActiveEffect",
		"deleteActiveEffect", "controlToken", "preUpdateToken"
	]){
		Hooks.on(hook, () => ZHELL_EFFECTS_PANEL.effectsPanel.refresh());
	}
	
	// set up sockets.
	ZHELL_SOCKETS.loadTextureSocketOn(); // loadTextureForAll
	ZHELL_SOCKETS.routeTilesThroughGM(); // let players create tiles.
	
	// add 'view scene' to scene config headers.
	if(game.user.isGM){
		Hooks.on("getSceneConfigHeaderButtons", (app, array) => {
			const viewBtn = {
				class: "zhell-custom-stuff-view-scene",
				icon: "fas fa-eye",
				label: "View Scene",
				onclick: async () => await app.object.view()
			}
			array.unshift(viewBtn);
		});
	}

});
Hooks.once("canvasReady", () => {
	// create initial effects panel in the class. CanvasReady happens before Ready.
	ZHELL_EFFECTS_PANEL.createEffectsPanel();
});



/*Hooks.on("renderTokenHUD", (HUD, html, token) => {
	const effects = html[0].querySelectorAll("img.effect-control");
	for(let effect of effects){
		let label = document.createElement("label");
		label.classList.add("effect-control-label");
		label.innerText = effect.getAttribute("title");
		effect.insertAdjacentElement("afterEnd", label);
	}
});*/

