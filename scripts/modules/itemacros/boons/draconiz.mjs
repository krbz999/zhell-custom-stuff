import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const draconiz = {SHOW_OF_FORCE, SIZE_UP};

/**
 * Turn the token to Large with an animation, creating an effect on the actor with an
 * attached Effect Macro to toggle the size and the other attributes.
 */
async function SHOW_OF_FORCE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.EM, DEPEND.VAE)) return item.use();

  const use = await item.use();
  if (!use) return;

  const onCreate = async function() {
    const easing = function(pt) {return 1 - cos((pt * Math.PI) / 2);}
    await Sequencer.Preloader.preload([
      "jb2a.token_border.circle.static.blue.004",
      "jb2a.lightning_strike.blue.5"
    ]);

    // lightning strikes
    await new Sequence()
      .effect().file("jb2a.lightning_strike.blue.5").atLocation(token)
      .effect().file("jb2a.lightning_strike.blue.5").atLocation(token).mirrorX()
      .wait(1000)
      .play({remote: true});

    await token.document.update({width: 2, height: 2}, {animation: {duration: 500, easing}});

    return new Sequence()
      .wait(500)
      .effect().file("jb2a.token_border.circle.static.blue.004")
      .fadeIn(500).attachTo(token).name("Show of Force").persist()
      .play({remote: true});
  }

  const onDelete = async function() {
    const easing = function(pt) {return 1 - cos((pt * Math.PI) / 2);}
    await Sequencer.EffectManager.endEffects({name: "Show of Force"});
    return token.document.update({height: 1, width: 1}, {animation: {duration: 500, easing}});
  }

  const onDisable = async function() {
    await effect.callMacro("onDelete");
    return effect.delete();
  }

  // when create effect, trigger sequence and mutation. When delete effect, remove mutation and end sequences.
  const effectData = [{
    icon: item.img,
    name: item.name,
    duration: {seconds: 60},
    origin: item.uuid,
    statuses: [item.name.slugify({strict: true})],
    description: "<p>Your size is increased to Large, your movement speed increases by 10 feet, you deal an additional <strong>1d4</strong> damage with melee weapons, and your melee weapon attacks are critical hits on a roll of 19 or 20.</p>",
    flags: {
      effectmacro: {
        onCreate: {script: `(${onCreate.toString()})()`},
        onDelete: {script: `(${onDelete.toString()})()`},
        onDisable: {script: `(${onDisable.toString()})()`}
      }
    },
    changes: [
      {key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 10},
      {key: "system.bonuses.mwak.damage", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4"},
      {key: "flags.dnd5e.weaponCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 19},
      {key: "system.traits.size", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "lg"},
    ]
  }];
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}

/**
 * Display a message for the user comparing Strength and Constitution with their target.
 */
async function SIZE_UP(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  const target = game.user.targets.first();
  if (!target?.actor) {
    return ui.notifications.warn("If you had a target, you'd know immediately.");
  }

  if (["vehicle", "group"].includes(target.actor.type)) {
    return ui.notifications.warn("You can only compare your abilities to that of another creature.");
  }

  const mine = actor.system.abilities;
  const theirs = target.actor.system.abilities;

  let content = "";

  for (const abi of ["str", "con"]) {
    const name = CONFIG.DND5E.abilities[abi];
    if (mine[abi].value === theirs[abi].value) content += `<p>Your ${name} scores are equal.</p>`;
    else if (mine[abi].value > theirs[abi].value) content += `<p>Your ${name} score is highest.</p>`;
    else content += `<p>Their ${name} score is highest.</p>`;
  }
  const whisper = ChatMessage.getWhisperRecipients("GM");
  return ChatMessage.create({content, speaker, whisper});
}
