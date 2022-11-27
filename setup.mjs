import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { ZHELL_ADDITIONS } from "./scripts/modules/game_additions.mjs";
import { ZHELL_REPLACEMENTS } from "./scripts/modules/game_replacements.mjs";
import { refreshColors, ZHELL_SHEET, ZHELL_TRAITS } from "./scripts/modules/sheet_edits.mjs";
import { ZHELL_COMBAT } from "./scripts/modules/combat_helpers.mjs";
import { MODULE } from "./scripts/const.mjs";
import { ZHELL_ANIMATIONS, _initD20 } from "./scripts/modules/animations.mjs";
import { database } from "./sources/animations.mjs";

Hooks.once("init", () => {
  console.log("ZHELL | Initializing Zhell's Custom Stuff");
  registerSettings();
  api.register();
});

Hooks.once("setup", () => {
  ZHELL_ADDITIONS();
  ZHELL_REPLACEMENTS();
});

Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", () => {
  Sequencer.Database.registerEntries("zhell", database);
})

Hooks.once("ready", () => {
  Hooks.on("renderActorSheet", ZHELL_SHEET);
  Hooks.on("renderTraitSelector", ZHELL_TRAITS);
  refreshColors();

  // mark 0 hp combatants as defeated.
  if (game.user.isGM) {
    Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
  }

  // display ammo when you make an attack, if the ammo has a save.
  Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);

  // set up sockets.
  ZHELL_SOCKETS.loadTextureSocketOn(); // loadTextureForAll
  ZHELL_SOCKETS.routeTilesThroughGM(); // let players create tiles.
  ZHELL_SOCKETS.awardLoot(); // award loot UI.

  // hook for when measured templates are created to display animation.
  const canAnimate = ["sequencer", "jb2a_patreon"].every(id => !!game.modules.get(id)?.active);
  if (canAnimate) {
    Hooks.on("createMeasuredTemplate", ZHELL_ANIMATIONS.onCreateMeasuredTemplate);
    Hooks.on("dnd5e.useItem", ZHELL_ANIMATIONS.onItemUse);
    Hooks.on("dnd5e.rollAttack", ZHELL_ANIMATIONS.onItemRollAttack);
    Hooks.on("dnd5e.rollDamage", ZHELL_ANIMATIONS.onItemRollDamage);
  }
  ZHELL_ANIMATIONS.collapsibleSetup();

  // add 'view scene' to scene config headers.
  if (game.user.isGM) {
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
