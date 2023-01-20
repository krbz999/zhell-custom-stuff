import { registerSettings } from "./scripts/settings.mjs";
import { api } from "./scripts/api.mjs";
import { ZHELL_SOCKETS } from "./scripts/modules/sockets.mjs";
import { refreshColors, ZHELL_SHEET } from "./scripts/modules/sheet_edits.mjs";
import {
  ZHELL_COMBAT,
  _replaceTokenHUD,
  _setupCustomButtons,
  _setupGroupSaves
} from "./scripts/modules/combatHelpers.mjs";
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
import { _restItemDeletion, _sceneHeaderView, _setUpGameChanges, _visionModes } from "./scripts/modules/gameChanges.mjs";
import { _addFlavorListenerToDamageRolls, _appendDataToDamageRolls } from "./scripts/modules/dm_tool.mjs";
import { DEFEATED, DEPEND, DISPLAY_AMMO, MODULE, TRACK_REACTIONS } from "./scripts/const.mjs";

Hooks.once("init", registerSettings);
Hooks.once("init", api.register);
Hooks.once("init", _visionModes);
Hooks.once("setup", _setUpGameChanges);
Hooks.once("setup", _craftingCharacterFlag);
Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", _sequencerSetup);
Hooks.once("ready", refreshColors);
Hooks.once("ready", ZHELL_SOCKETS.loadTextureForAllSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.createTilesSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.awardLootSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.updateTokensSocketOn);
Hooks.once("ready", ZHELL_SOCKETS.grantItemsSocketOn);
Hooks.once("ready", _setupCollapsibles);
Hooks.once("ready", _setupCustomButtons);

Hooks.on("renderActorSheet", ZHELL_SHEET);
Hooks.on("renderJournalPageSheet", _classesPageListeners);
Hooks.on("renderJournalPageSheet", _equipmentPageListeners);
Hooks.on("preUpdateToken", _rotateTokensOnMovement);
Hooks.on("renderTokenHUD", _replaceTokenHUD);
Hooks.on("dnd5e.preRollDamage", _appendDataToDamageRolls);
Hooks.on("dnd5e.restCompleted", _restItemDeletion);


Hooks.once("ready", function() {
  const reactionSetting = game.settings.get(MODULE, TRACK_REACTIONS);
  if ((reactionSetting === "gm" && game.user.isGM) || reactionSetting === "all") {
    Hooks.on("dnd5e.useItem", ZHELL_COMBAT.spendReaction);
  }

  if (game.settings.get(MODULE, DISPLAY_AMMO)) {
    Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);
  }

  if (game.user.isGM) {
    if (game.settings.get(MODULE, DEFEATED)) {
      Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
    }
    Hooks.on("getSceneConfigHeaderButtons", _sceneHeaderView);
    Hooks.on("renderChatMessage", _setupGroupSaves);
    Hooks.on("renderChatMessage", _addFlavorListenerToDamageRolls);
  }

  // hook for various actions are performed to display animations.
  const canAnimate = [
    DEPEND.SEQ, DEPEND.JB2A
  ].every(id => !!game.modules.get(id)?.active);
  if (canAnimate) {
    Hooks.on("createMeasuredTemplate", ZHELL_ANIMATIONS.onCreateMeasuredTemplate);
    Hooks.on("dnd5e.useItem", ZHELL_ANIMATIONS.onItemUse);
    Hooks.on("dnd5e.rollAttack", ZHELL_ANIMATIONS.onItemRollAttack);
    Hooks.on("dnd5e.rollDamage", ZHELL_ANIMATIONS.onItemRollDamage);
    Hooks.on("dnd5e.rollSkill", ZHELL_ANIMATIONS.onRollSkill);
  }
});
