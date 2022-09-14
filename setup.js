import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { createEffectTextField, HandlebarHelpers, ZHELL_EFFECTS_PANEL } from "./scripts/modules/effect-panel-classes.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { ZHELL_ADDITIONS } from "./scripts/modules/game_additions.mjs";
import { ZHELL_REPLACEMENTS } from "./scripts/modules/game_replacements.mjs";
import { ZHELL_SHEET } from "./scripts/modules/sheet_edits.mjs";
import { ZHELL_COMBAT } from "./scripts/modules/combat_helpers.mjs";
import { MODULE } from "./scripts/const.mjs";

Hooks.once("init", () => {
    console.log("ZHELL | Initializing Zhell's Custom Stuff");
    registerSettings();
    api.register();
});
Hooks.once("setup", () => {
    // additions.
    ZHELL_ADDITIONS.addEquipmentTypes();
    ZHELL_ADDITIONS.addDivine();
    ZHELL_ADDITIONS.addConditions();
    ZHELL_ADDITIONS.addPiety();

    // replacements.
    ZHELL_REPLACEMENTS.replaceConsumableTypes();
    ZHELL_REPLACEMENTS.replaceLanguages();
    ZHELL_REPLACEMENTS.replaceTools();
    ZHELL_REPLACEMENTS.replaceWeapons();
    ZHELL_REPLACEMENTS.replaceStatusEffects();

});
Hooks.once("ready", () => {
    // disable short and long rest.
    Hooks.on("dnd5e.preLongRest", ZHELL_SHEET.disableLongRest);
    Hooks.on("dnd5e.preShortRest", ZHELL_SHEET.disableShortRest);
    
    // sheet edits.
    Hooks.on("renderActorSheet", ZHELL_SHEET.removeResources);
    Hooks.on("renderActorSheet", ZHELL_SHEET.removeAlignment);
    Hooks.on("renderActorSheet", ZHELL_SHEET.disableInitiativeButton);
    Hooks.on("renderActorSheet", ZHELL_SHEET.createForaging);
    Hooks.on("renderActorSheet", ZHELL_SHEET.setHealthColor);
    Hooks.on("renderActorSheet", ZHELL_SHEET.disable_exhaustion);
    Hooks.on("renderActorSheet", ZHELL_SHEET.collapsibleHeaders);
    
    // create dots for limited uses and spell slots.
    Hooks.on("renderActorSheet", ZHELL_SHEET.createDots);

    // color magic items of uncommon or higher quality.
    Hooks.on("renderActorSheet", ZHELL_SHEET.colorMagicItems);

    // make the attunement button an actual toggle.
    Hooks.on("renderActorSheet", ZHELL_SHEET.attunementButtonToggle);

    // make the trait and proficiency selectors less ugly.
    Hooks.on("renderTraitSelector", ZHELL_SHEET.reformatTraitSelectors);

    // refresh colors.
    ZHELL_SHEET.refreshColors();

    // mark 0 hp combatants as defeated.
    if ( game.user.isGM ){
        Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
        Hooks.on("renderActiveEffectConfig", createEffectTextField);
    }

    // display ammo when you make an attack, if the ammo has a save.
    Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);

    // setup effectsPanel handlebar helpers, hooks, and other rendering.
    new HandlebarHelpers().registerHelpers(); // init helper setup.
    ZHELL_EFFECTS_PANEL.effectsPanel.render(true); // init render.
    Hooks.on("collapseSidebar", (_, bool) => ZHELL_EFFECTS_PANEL.effectsPanel.handleExpand(bool));
    for( const hook of [
        "updateWorldTime", "createActiveEffect", "updateActiveEffect",
        "deleteActiveEffect", "controlToken", "preUpdateToken"
    ] ) {
        Hooks.on(hook, () => ZHELL_EFFECTS_PANEL.effectsPanel.refresh());
    }
    
    // set up sockets.
    ZHELL_SOCKETS.loadTextureSocketOn(); // loadTextureForAll
    ZHELL_SOCKETS.routeTilesThroughGM(); // let players create tiles.
    
    // add 'view scene' to scene config headers.
    if ( game.user.isGM ) {
        Hooks.on("getSceneConfigHeaderButtons", (app, array) => {
            const viewBtn = {
                class: `${MODULE}-view-scene`,
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
