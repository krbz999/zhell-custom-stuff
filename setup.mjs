import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { refreshColors, ZHELL_SHEET } from "./scripts/modules/sheet_edits.mjs";
import { ZHELL_COMBAT, _replaceTokenHUD, _setupCustomButtons, _setupGroupSaves } from "./scripts/modules/combatHelpers.mjs";
import {
  ZHELL_ANIMATIONS,
  _classesPageListeners,
  _equipmentPageListeners,
  _initD20,
  _rotateTokensOnMovement,
  _sequencerSetup,
  _setupCollapsibles
} from "./scripts/modules/animations.mjs";
import { _craftingCharacterFlag } from "./scripts/modules/crafting.mjs";
import { _sceneHeaderView, _setUpGameChanges, _visionModes } from "./scripts/modules/gameChanges.mjs";
import { _addFlavorListenerToDamageRolls, _appendDataToDamageRolls } from "./scripts/modules/dm_tool.mjs";

Hooks.once("init", registerSettings);
Hooks.once("init", api.register);
Hooks.once("init", _visionModes);
Hooks.once("setup", _setUpGameChanges);
Hooks.once("setup", _craftingCharacterFlag);
Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", _sequencerSetup);
Hooks.once("ready", refreshColors);
Hooks.once("ready", ZHELL_SOCKETS.loadTextureSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.routeTilesThroughGM);
Hooks.once("ready", ZHELL_SOCKETS.awardLoot);
Hooks.once("ready", _setupCollapsibles);
Hooks.once("ready", _setupCustomButtons);

Hooks.on("renderActorSheet", ZHELL_SHEET);
Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);
Hooks.on("renderJournalPageSheet", _classesPageListeners);
Hooks.on("renderJournalPageSheet", _equipmentPageListeners);
Hooks.on("preUpdateToken", _rotateTokensOnMovement);
Hooks.on("renderTokenHUD", _replaceTokenHUD);
Hooks.on("dnd5e.preRollDamage", _appendDataToDamageRolls);


Hooks.once("ready", () => {
  if (game.user.isGM) {
    Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
    Hooks.on("getSceneConfigHeaderButtons", _sceneHeaderView);
    Hooks.on("renderChatMessage", _setupGroupSaves);
    Hooks.on("renderChatMessage", _addFlavorListenerToDamageRolls);
  }

  // hook for various actions are performed to display animations.
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
