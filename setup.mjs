import {registerSettings} from "./scripts/settings.mjs";
import {api} from "./scripts/api.mjs";
import {ZHELL_SOCKETS} from "./scripts/modules/sockets.mjs";
import {
  ZHELL_COMBAT,
  _rechargeMonsterFeatures,
  _replaceTokenHUD,
  _setupGroupSaves,
  _visualActiveEffectsCreateEffectButtons
} from "./scripts/modules/combatHelpers.mjs";
import {
  ZHELL_ANIMATIONS,
  _equipmentPageListeners,
  _initD20,
  _rotateTokensOnMovement,
  _sequencerSetup,
  _setupCollapsibles
} from "./scripts/modules/animations.mjs";
import {
  _addContextMenuOptions,
  _dropActorFolder,
  _itemStatusCondition,
  _miscAdjustments,
  _preCreateActiveEffect,
  _preCreateScene,
  _restItemDeletion,
  _sceneHeaderView,
  _setUpGameChanges,
  _visionModes
} from "./scripts/modules/gameChanges.mjs";
import {
  _addFlavorListenerToDamageRolls,
  _appendDataToDamageRolls
} from "./scripts/modules/dm_tool.mjs";
import {DEPEND, MODULE} from "./scripts/const.mjs";
import {EXHAUSTION} from "./scripts/modules/zhell_functions.mjs";
import {_craftingCharacterFlag} from "./scripts/modules/applications/materiaMedica.mjs";
import {refreshColors, _performSheetEdits} from "./scripts/modules/applications/sheetEdits.mjs";

Hooks.once("init", registerSettings);
Hooks.once("init", api.register);
Hooks.once("init", _visionModes);
Hooks.once("setup", _setUpGameChanges);
Hooks.once("setup", _craftingCharacterFlag);
Hooks.once("setup", _miscAdjustments);
Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", _sequencerSetup);
Hooks.once("ready", refreshColors);
Hooks.once("ready", ZHELL_SOCKETS.socketsOn);
Hooks.on("dropCanvasData", ZHELL_SOCKETS._onDropData);
Hooks.once("ready", _setupCollapsibles);

Hooks.on("renderItemSheet", _itemStatusCondition);
Hooks.on("renderActorSheet", _performSheetEdits);
Hooks.on("renderJournalPageSheet", _equipmentPageListeners);
Hooks.on("preUpdateToken", _rotateTokensOnMovement);
Hooks.on("renderTokenHUD", _replaceTokenHUD);
Hooks.on("dnd5e.preRollDamage", _appendDataToDamageRolls);
Hooks.on("dnd5e.restCompleted", _restItemDeletion);
Hooks.on("dnd5e.restCompleted", EXHAUSTION._longRestExhaustionReduction);
Hooks.on("dnd5e.getItemContextOptions", _addContextMenuOptions);
Hooks.on("preCreateActiveEffect", _preCreateActiveEffect);
Hooks.on("updateCombat", _rechargeMonsterFeatures);

Hooks.once("ready", function() {
  const reactionSetting = game.settings.get(MODULE, "trackReactions");
  if (((reactionSetting === "gm") && game.user.isGM) || (reactionSetting === "all")) {
    Hooks.on("dnd5e.useItem", ZHELL_COMBAT.spendReaction);
  }

  if (game.settings.get(MODULE, "displaySavingThrowAmmo")) {
    Hooks.on("dnd5e.rollAttack", ZHELL_COMBAT.displaySavingThrowAmmo);
  }

  if (game.user.isGM) {
    if (game.settings.get(MODULE, "markDefeatedCombatants")) {
      Hooks.on("updateToken", ZHELL_COMBAT.markDefeatedCombatant);
    }
    Hooks.on("getSceneConfigHeaderButtons", _sceneHeaderView);
    Hooks.on("renderChatMessage", _setupGroupSaves);
    Hooks.on("renderChatMessage", _addFlavorListenerToDamageRolls);
    Hooks.on("dropCanvasData", _dropActorFolder);
    Hooks.on("preCreateScene", _preCreateScene);
  }

  if (game.modules.get(DEPEND.VAE)?.active) {
    Hooks.on("visual-active-effects.createEffectButtons", _visualActiveEffectsCreateEffectButtons);
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
