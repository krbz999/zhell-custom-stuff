import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { ZHELL_ADDITIONS, _sceneHeaderView } from "./scripts/modules/game_additions.mjs";
import { ZHELL_REPLACEMENTS } from "./scripts/modules/game_replacements.mjs";
import { refreshColors, ZHELL_SHEET, ZHELL_TRAITS } from "./scripts/modules/sheet_edits.mjs";
import { ZHELL_COMBAT } from "./scripts/modules/combat_helpers.mjs";
import {
  ZHELL_ANIMATIONS,
  _classesPageListeners,
  _equipmentPageListeners,
  _initD20,
  _rotateTokensOnMovement,
  _sequencerSetup
} from "./scripts/modules/animations.mjs";

Hooks.once("init", registerSettings);
Hooks.once("init", api.register);
Hooks.once("setup", ZHELL_ADDITIONS);
Hooks.once("setup", ZHELL_REPLACEMENTS);
Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", _sequencerSetup);
Hooks.once("ready", refreshColors);
Hooks.once("ready", ZHELL_SOCKETS.loadTextureSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.routeTilesThroughGM);
Hooks.once("ready", ZHELL_SOCKETS.awardLoot);

Hooks.on("renderActorSheet", ZHELL_SHEET);
Hooks.on("renderTraitSelector", ZHELL_TRAITS);
Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);
Hooks.on("renderJournalPageSheet", _classesPageListeners);
Hooks.on("renderJournalPageSheet", _equipmentPageListeners);
Hooks.on("preUpdateToken", _rotateTokensOnMovement);


Hooks.once("ready", () => {
  if (game.user.isGM) {
    Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
    Hooks.on("getSceneConfigHeaderButtons", _sceneHeaderView);
  }

  // hook for when measured templates are created to display animation.
  const canAnimate = [
    "sequencer", "jb2a_patreon"
  ].every(id => !!game.modules.get(id)?.active);
  if (canAnimate) {
    Hooks.on("createMeasuredTemplate", ZHELL_ANIMATIONS.onCreateMeasuredTemplate);
    Hooks.on("dnd5e.useItem", ZHELL_ANIMATIONS.onItemUse);
    Hooks.on("dnd5e.rollAttack", ZHELL_ANIMATIONS.onItemRollAttack);
    Hooks.on("dnd5e.rollDamage", ZHELL_ANIMATIONS.onItemRollDamage);
    Hooks.on("dnd5e.rollSkill", ZHELL_ANIMATIONS.onRollSkill);
  }
});
