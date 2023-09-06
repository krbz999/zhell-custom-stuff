import ModuleSettings from "./scripts/settings.mjs";
import {SocketsHandler} from "./scripts/modules/sockets.mjs";
import {CombatEnhancements} from "./scripts/modules/combatHelpers.mjs";
import {AnimationsHandler} from "./scripts/modules/animations.mjs";
import {GameChangesHandler} from "./scripts/modules/gameChanges.mjs";
import {MODULE} from "./scripts/const.mjs";
import {MateriaMedica} from "./scripts/modules/applications/materiaMedica.mjs";
import {SheetEdits} from "./scripts/modules/applications/sheetEdits.mjs";
import {DamageApplicator} from "./scripts/modules/applications/damageApplicator.mjs";
import {sceneControls} from "./scripts/modules/sceneControls.mjs";
import {ExhaustionHandler} from "./scripts/modules/exhaustion.mjs";
import {BossBar} from "./scripts/modules/applications/bossBar.mjs";
import {ContestRoll} from "./scripts/modules/applications/contest-roll.mjs";
import ActorSheet5eCharacter from "./scripts/modules/documents/character-sheet.mjs";
import ActorExtension from "./scripts/modules/documents/character.mjs";
import PublicAPI from "./scripts/modules/publicAPI.mjs";
import {ItemMacro} from "./scripts/modules/itemMacros.mjs";

Hooks.once("init", ModuleSettings.init);
Hooks.once("init", PublicAPI.init);
Hooks.once("init", GameChangesHandler._initGameChanges);
Hooks.once("setup", GameChangesHandler._setupGameChanges);
Hooks.once("setup", MateriaMedica.setUpCharacterFlag);
Hooks.once("setup", ExhaustionHandler._appendActorMethods);
Hooks.once("diceSoNiceReady", AnimationsHandler._initD20);
Hooks.once("sequencerReady", AnimationsHandler._sequencerSetup);
Hooks.once("ready", SheetEdits.refreshColors);
Hooks.once("ready", SocketsHandler.socketsOn);
Hooks.on("dropCanvasData", SocketsHandler._onDropData);

Hooks.on("renderItemSheet", GameChangesHandler._itemStatusCondition);
Hooks.on("renderActorSheet", SheetEdits._performSheetEdits);
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
Hooks.on("canvasReady", GameChangesHandler._addNoteListeners);

Hooks.on("updateScene", BossBar._renderBossBarOnSceneUpdate);
Hooks.on("canvasReady", BossBar._renderBossBarOnReady);

Hooks.once("ready", function() {
  const reactionSetting = game.settings.get(MODULE, "trackReactions");
  if (((reactionSetting === 1) && game.user.isGM) || (reactionSetting === 2)) {
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

  if (game.modules.get("visual-active-effects")?.active) {
    Hooks.on("visual-active-effects.createEffectButtons", GameChangesHandler._visualActiveEffectsCreateEffectButtons);
  }

  // hook for various actions are performed to display animations.
  const canAnimate = ["sequencer", "jb2a_patreon"].every(id => !!game.modules.get(id)?.active);
  if (canAnimate) {
    Hooks.on("createMeasuredTemplate", AnimationsHandler.onCreateMeasuredTemplate);
    Hooks.on("dnd5e.useItem", AnimationsHandler.onItemUse);
    Hooks.on("dnd5e.rollAttack", AnimationsHandler.onItemRollAttack);
    Hooks.on("dnd5e.rollDamage", AnimationsHandler.onItemRollDamage);
    Hooks.on("dnd5e.rollSkill", AnimationsHandler.onRollSkill);
  }
});

Hooks.once("ready", ContestRoll.setupSockets);
Hooks.once("init", ActorExtension.init);
Hooks.once("init", ActorSheet5eCharacter.init);
Hooks.on("applyActiveEffect", GameChangesHandler.evaluateArmorClassBonus);
Hooks.once("init", ItemMacro.init);
