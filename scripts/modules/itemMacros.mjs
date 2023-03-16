import {DEPEND, MODULE} from "../const.mjs";
import {drawCircle} from "./animations.mjs";
import {ITEMACRO_BOONS} from "./itemacros/boons.mjs";
import {ITEMACRO_FEATURES} from "./itemacros/features.mjs";
import {ITEMACRO_ITEMS} from "./itemacros/items.mjs";
import {ITEMACRO_SPELLS} from "./itemacros/spells.mjs";

// item, speaker, actor, token, character, event, args
export const ITEMACRO = {
  ...ITEMACRO_ITEMS,
  ...ITEMACRO_BOONS,
  ...ITEMACRO_FEATURES,
  ...ITEMACRO_SPELLS
};

/**
 * Helper function to verify that all module dependencies
 * are installed and active for a particular item macro.
 * Returns true or false.
 */
export function _getDependencies(...moduleIds) {
  let abi = true;
  for (const id of moduleIds) {
    if (!game.modules.get(id)?.active) {
      //console.warn(`Missing module for Item Macro: '${id}'.`);
      ui.notifications.warn(`Missing module for Item Macro: '${id}'.`);
      abi = false;
    }
  }
  return abi;
}

/**
 * Helper function to return a string of options for each spell slot
 * level for which you have slots available, including pact slots.
 * Optionally instead levels for which you have expended spell slots.
 * Optionally with a maximum level.
 * Returns a string (possibly of length 0).
 */
export function _constructSpellSlotOptions(actor, {missing = false, maxLevel = Infinity} = {}) {
  return Object.entries(actor.system.spells).reduce((acc, [key, data]) => {
    if ((missing && (data.value >= data.max)) || (!missing && (data.value <= 0))) return acc;
    if ((data.level > maxLevel) || (key.at(-1) > maxLevel)) return acc;
    const label = game.i18n.format(`DND5E.SpellLevel${key === "pact" ? "Pact" : "Slot"}`, {
      level: key === "pact" ? data.level : game.i18n.localize(`DND5E.SpellLevel${key.at(-1)}`),
      n: `${data.value}/${data.max}`
    });
    return acc + `<option value="${key}">${label}</option>`;
  }, "");
}

/**
 * Helper function to construct an effect that creates light on a token when the effect is created,
 * and reverts the light when the effect is deleted or disabled (deleting the effect on disable, too).
 * Returns an array of effect data.
 */
export function _constructLightEffectData({item, lightData, intro, flags}) {
  const config = lightData ?? {dim: 40, bright: 20};

  const onCreate = async function() {
    const config = effect.flags.effectmacro?.lightConfig ?? {};
    return token?.document.update({light: config});
  }

  const onDelete = async function() {
    const config = effect.flags.effectmacro?.lightConfig ?? {};
    const prototype = await actor.getTokenDocument();
    const protoData = foundry.utils.flattenObject(prototype.light);
    for (const key of Object.keys(protoData)) {
      if (foundry.utils.getProperty(config, key) === undefined) {
        delete protoData[key];
      }
    }
    return token?.document.update({light: protoData});
  }

  const onDisable = async function() {
    await effect.callMacro("onDelete");
    return effect.delete();
  }

  const {value, units} = item.system.duration ?? {};

  return [{
    icon: item.img,
    label: item.name,
    origin: item.uuid,
    duration: {seconds: (value ? value : 1) * (units === "minute" ? 60 : units === "hour" ? 3600 : 1)},
    flags: foundry.utils.mergeObject({
      "visual-active-effects.data": {
        intro: intro ?? "<p>You are lit up!</p>",
        content: item.system.description.value,
        forceInclude: true
      },
      effectmacro: {
        lightConfig: config,
        onCreate: {script: `(${onCreate.toString()})()`},
        onDelete: {script: `(${onDelete.toString()})()`},
        onDisable: {script: `(${onDisable.toString()})()`}
      },
      core: {statusId: item.name.slugify({strict: true})}
    }, flags ?? {})
  }];
}

/**
 * Helper function to construct an effect that grants a detection mode to a token.
 * Reverts the array by deleting only what was added, when the effect is deleted.
 * Returns the array of effect data.
 */
export function _constructDetectionModeEffectData({modes = [], item}) {
  const onCreate = async function() {
    const modes = effect.flags.effectmacro.data.modes;
    const previousModes = foundry.utils.duplicate(token.document.detectionModes);
    const ids = previousModes.map(m => m.id);
    previousModes.push(...modes.filter(m => !ids.includes(m.id)));
    return token.document.update({detectionModes: previousModes.filter(m => m.id !== "basicSight")});
  }

  const onDelete = async function() {
    const {detectionModes} = await actor.getTokenDocument();
    return token.document.update({detectionModes});
  }

  return [{
    icon: item.img,
    label: item.name,
    origin: item.uuid,
    duration: _getItemDuration(item),
    "flags.core.statusId": item.name.slugify({strict: true}),
    "flags.effectmacro": {
      "onCreate.script": `(${onCreate.toString()})()`,
      "onEnable.script": `(${onCreate.toString()})()`,
      "onDelete.script": `(${onDelete.toString()})()`,
      "onDisable.script": `(${onDelete.toString()})()`,
      "data.modes": modes
    }
  }];
}

/**
 * Helper function to create basic effect data, showing that some temporary item is active,
 * which does not require concentration.
 * Returns an array of effect data.
 */
export function _constructGenericEffectData({item, level = null}) {
  return [{
    label: item.name,
    icon: item.img,
    duration: _getItemDuration(item),
    "flags.core.statusId": item.name.slugify({strict: true}),
    "flags.visual-active-effects.data": {
      content: item.system.description.value
    },
    [`flags.${MODULE}`]: {
      itemData: item.clone({"system.level": level}).toObject(),
      types: ["redisplay"]
    }
  }];
}

/**
 * Helper function to add warpgate dismissal to an effect, which is triggered when the effect is deleted.
 * Returns the effect.
 */
export async function _addTokenDismissalToEffect(effect, tokenId) {
  return effect.setFlag(DEPEND.EM, "onDelete.script", `await warpgate.dismiss("${tokenId}");`);
}

/**
 * Helper function for any teleportation scripts, requiring two jb2a
 * effects (for vanishing and appearing), and the maximum radius.
 */
export async function _teleportationHelper({item, actor, token, vanish, appear, distance}) {
  let cachedDistance = 0;
  const checkDistance = async (crosshairs) => {
    while (crosshairs.inFlight) {
      //wait for initial render
      await warpgate.wait(100);
      const ray = new Ray(token.center, crosshairs);
      const [d] = canvas.grid.measureDistances([{ray}], {gridSpaces: false});
      const dist = Math.round(d / 5) * 5;
      cachedDistance = dist;
      if (dist > distance) crosshairs.icon = "icons/svg/hazard.svg";
      else crosshairs.icon = token.document.texture.src;
      crosshairs.draw();
      crosshairs.label = `${dist} ft`;
    }
  }

  await actor.sheet?.minimize();
  const p = drawCircle(token, distance);

  async function _pickTargetLocation() {
    const pos = await warpgate.crosshairs.show({
      size: token.document.width,
      icon: token.document.texture.src,
      label: "0 ft.",
      interval: -1
    }, {show: checkDistance});
    if (pos.cancelled) return pos;
    if (cachedDistance > distance) {
      ui.notifications.error(`${item.name} has a maximum range of ${distance} feet.`);
      return _pickTargetLocation();
    }
    return pos;
  }

  const {x, y, cancelled} = await _pickTargetLocation();
  canvas.app.stage.removeChild(p);
  if (cancelled) return actor.sheet?.maximize();

  await new Sequence()
    .effect().file(vanish).atLocation(token).randomRotation().scaleToObject(2)
    .wait(750)
    .animation().on(token).opacity(0.0).waitUntilFinished()
    .play();

  await token.document.update({x: x - canvas.grid.size / 2, y: y - canvas.grid.size / 2}, {animate: false});

  await new Sequence()
    .effect().file(appear).atLocation(token).randomRotation().scaleToObject(2)
    .wait(1500)
    .animation().on(token).opacity(1.0)
    .play();

  await warpgate.wait(1000);
  return actor.sheet?.maximize();
}

/**
 * Small spawn helper to preload token images for warpgate.
 * @param {string} name               Name of the actor to spawn.
 * @param {object} [updates={}]       An object of updates to the spawned token, actor, and embedded.
 * @param {object} [callbacks={}]     An object of callback functions.
 * @param {object} [options={}]       An object of additional options for the spawning.
 * @returns {string[]}                The ids of spawned tokens.
 */
export async function _spawnHelper(name, updates = {}, callbacks = {}, options = {}) {
  const images = await game.actors.getName(name).getTokenImages();
  await Promise.all(images.map(img => loadTexture(img)));
  const spawn = await warpgate.spawn(name, updates, callbacks, options) ?? [];
  return spawn;
}

/**
 * Helper function to get spell level of the returned value from Item5e#use.
 * Returns an integer.
 */
export function _getSpellLevel(use) {
  return use.flags?.dnd5e?.use?.spellLevel ?? 0;
}

/**
 * Helper function to create very basic form for a Dialog.
 * Returns a string (the content).
 */
export function _basicFormContent({label = "", type = "text", options = ""}) {
  const lab = label.length ? `<label>${label}</label>` : "";
  const inp = {
    "select": `<select autofocus>${options}</select>`,
    "number": '<input type="number" autofocus>'
  }[type] ?? '<input type="text" autofocus>';
  return `
  <form>
    <div class="form-group">
      ${lab}
      <div class="form-fields">${inp}</div>
    </div>
  </form>`;
}

/**
 * Helper function to get duration in seconds from an item's duration.
 * Returns an object.
 */
export function _getItemDuration(item) {
  const duration = item.system.duration;

  if (!duration?.value) return {};
  let {value, units} = duration;

  // do not bother for these duration types:
  if (["inst", "perm", "spec"].includes(units)) return {};

  // cases for the remaining units of time:
  if (units === "round") return {rounds: value};
  if (units === "turn") return {turns: value};
  value *= 60;
  if (units === "minute") return {seconds: value};
  value *= 60;
  if (units === "hour") return {seconds: value};
  value *= 24;
  if (units === "day") return {seconds: value};
  value *= 30;
  if (units === "month") return {seconds: value};
  value *= 12;
  if (units === "year") return {seconds: value};

  return {};
}

/**
 * Helper function to get the damage bonus from a blade cantrip.
 */
export function _bladeCantripDamageBonus(item) {
  const [part, type] = item.system.damage.parts[0];
  const level = item.parent.system.details.level ?? Math.floor(item.parent.system.details.cr);
  const add = Math.floor((level + 1) / 6);
  const {formula} = new Roll(part).alter(0, add);
  return {formula, type};
}
