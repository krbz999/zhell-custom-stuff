import {registerSettings} from "./scripts/settings.mjs";
import {api} from "./scripts/api.mjs";
import {SocketsHandler} from "./scripts/modules/sockets.mjs";
import {CombatEnhancements} from "./scripts/modules/combatHelpers.mjs";
import {
  AnimationsHandler,
  _equipmentPageListeners,
  _initD20,
  _setupCollapsibles
} from "./scripts/modules/animations.mjs";
import {GameChangesHandler} from "./scripts/modules/gameChanges.mjs";
import {DEPEND, MODULE} from "./scripts/const.mjs";
import {ExhaustionHandler} from "./scripts/modules/zhell_functions.mjs";
import {MateriaMedica} from "./scripts/modules/applications/materiaMedica.mjs";
import {SheetEdits} from "./scripts/modules/applications/sheetEdits.mjs";
import {DamageApplicator} from "./scripts/modules/applications/damageApplicator.mjs";
import {sceneControls} from "./scripts/modules/sceneControls.mjs";

Hooks.once("init", registerSettings);
Hooks.once("init", api.register);
Hooks.once("init", GameChangesHandler._visionModes);
Hooks.once("setup", GameChangesHandler._setUpGameChanges);
Hooks.once("setup", MateriaMedica.setUpCharacterFlag);
Hooks.once("setup", GameChangesHandler._miscAdjustments);
Hooks.once("diceSoNiceReady", _initD20);
Hooks.once("sequencerReady", AnimationsHandler._sequencerSetup);
Hooks.once("ready", SheetEdits.refreshColors);
Hooks.once("ready", SocketsHandler.socketsOn);
Hooks.on("dropCanvasData", SocketsHandler._onDropData);
Hooks.once("ready", _setupCollapsibles);

Hooks.on("renderItemSheet", GameChangesHandler._itemStatusCondition);
Hooks.on("renderActorSheet", SheetEdits._performSheetEdits);
Hooks.on("renderJournalPageSheet", _equipmentPageListeners);
Hooks.on("preUpdateToken", GameChangesHandler._rotateTokensOnMovement);
Hooks.on("renderTokenHUD", GameChangesHandler._replaceTokenHUD);
Hooks.on("dnd5e.restCompleted", GameChangesHandler._restItemDeletion);
Hooks.on("dnd5e.restCompleted", ExhaustionHandler._longRestExhaustionReduction);
Hooks.on("dnd5e.getItemContextOptions", GameChangesHandler._addContextMenuOptions);
Hooks.on("preCreateActiveEffect", GameChangesHandler._preCreateActiveEffect);
Hooks.on("updateCombat", CombatEnhancements._rechargeMonsterFeatures);
Hooks.on("renderChatMessage", DamageApplicator._appendToDamageRolls);
Hooks.on("dnd5e.preRollDamage", DamageApplicator._appendDamageRollData);
Hooks.on("preCreateChatMessage", DamageApplicator._appendMoreDamageRollData);
Hooks.on("getSceneControlButtons", sceneControls);

Hooks.once("ready", function() {
  const reactionSetting = game.settings.get(MODULE, "trackReactions");
  if (((reactionSetting === "gm") && game.user.isGM) || (reactionSetting === "all")) {
    Hooks.on("dnd5e.useItem", CombatEnhancements._spendReaction);
  }

  if (game.settings.get(MODULE, "displaySavingThrowAmmo")) {
    Hooks.on("dnd5e.rollAttack", CombatEnhancements._displaySavingThrowAmmo);
  }

  if (game.user.isGM) {
    if (game.settings.get(MODULE, "markDefeatedCombatants")) {
      Hooks.on("updateActor", CombatEnhancements._markDefeatedCombatant);
    }
    Hooks.on("getSceneConfigHeaderButtons", GameChangesHandler._sceneHeaderView);
    Hooks.on("dropCanvasData", GameChangesHandler._dropActorFolder);
    Hooks.on("preCreateScene", GameChangesHandler._preCreateScene);
  }

  if (game.modules.get(DEPEND.VAE)?.active) {
    Hooks.on("visual-active-effects.createEffectButtons", GameChangesHandler._visualActiveEffectsCreateEffectButtons);
  }

  // hook for various actions are performed to display animations.
  const canAnimate = [DEPEND.SEQ, DEPEND.JB2A].every(id => !!game.modules.get(id)?.active);
  if (canAnimate) {
    Hooks.on("createMeasuredTemplate", AnimationsHandler.onCreateMeasuredTemplate);
    Hooks.on("dnd5e.useItem", AnimationsHandler.onItemUse);
    Hooks.on("dnd5e.rollAttack", AnimationsHandler.onItemRollAttack);
    Hooks.on("dnd5e.rollDamage", AnimationsHandler.onItemRollDamage);
    Hooks.on("dnd5e.rollSkill", AnimationsHandler.onRollSkill);
  }
});
