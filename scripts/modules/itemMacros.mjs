import {DEPEND, MODULE} from "../const.mjs";
import {arepo} from "./itemacros/boons/arepo.mjs";
import {draconiz} from "./itemacros/boons/draconiz.mjs";
import {murk} from "./itemacros/boons/murk.mjs";
import {thrizur} from "./itemacros/boons/thrizur.mjs";
import {alchemist} from "./itemacros/features/artificer-alchemist.mjs";
import {twilight} from "./itemacros/features/cleric-twilight.mjs";
import {stars} from "./itemacros/features/druid-stars.mjs";
import {misc} from "./itemacros/features/misc.mjs";
import {hearth} from "./itemacros/features/paladin-hearth.mjs";
import {paladin} from "./itemacros/features/paladin.mjs";
import {races} from "./itemacros/features/races.mjs";
import {sorcerer} from "./itemacros/features/sorcerer.mjs";
import {fathomless} from "./itemacros/features/warlock-fathomless.mjs";
import {warlockLightningDragon} from "./itemacros/features/warlock-lightning-dragon.mjs";
import {wizard} from "./itemacros/features/wizard.mjs";
import {items} from "./itemacros/items.mjs";
import {poisons} from "./itemacros/items/poisons.mjs";
import {spells} from "./itemacros/spells.mjs";

// item, speaker, actor, token, character, event, args
export const ITEMACRO = {
  // class, subclass, and race features
  ...alchemist,
  ...twilight,
  ...stars,
  ...misc,
  ...hearth,
  ...paladin,
  ...races,
  ...sorcerer,
  ...fathomless,
  ...warlockLightningDragon,
  ...wizard,
  // boons
  ...arepo,
  ...draconiz,
  ...murk,
  ...thrizur,
  // items
  ...items,
  ...poisons,
  // spells
  ...spells,
};

export class ItemMacroHelpers {
  /**
   * Helper function to verify that all module dependencies are installed and active for a particular item macro.
   * @param {string[]} moduleIds      The array of module ids.
   * @returns {boolean}               Whether all the given modules are active.
   */
  static _getDependencies(...moduleIds) {
    let abi = true;
    for (const id of moduleIds) {
      if (!game.modules.get(id)?.active) {
        ui.notifications.warn(`Missing module for Item Macro: '${id}'.`);
        abi = false;
      }
    }
    return abi;
  }

  /**
   * Helper function to return a string of options for each spell slot level for which you have
   * slots available, including pact slots. Optionally instead levels for which you have expended
   * spell slots. Optionally with a maximum level. Returns a string (possibly of length 0).
   * @param {Actor} actor                     The actor with spell slots.
   * @param {boolean} [missing=false]         Whether to instead find levels for which you have expended slots.
   * @param {number} [maxLevel=Infinity]      The maximum spell slot level to use as an option.
   * @returns {string}                        The string of select options.
   */
  static _constructSpellSlotOptions(actor, {missing = false, maxLevel = Infinity} = {}) {
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
   * @param {Item} item             The item to retrieve data from.
   * @param {object} lightData      An optional override object of light data.
   * @param {string} intro          An optional string to use for the effect's description.
   * @param {object} flags          Additional flag data to merge into the effect.
   * @returns {object[]}            An array of ActiveEffect data.
   */
  static _constructLightEffectData({item, lightData, intro, flags}) {
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
        if (!foundry.utils.hasProperty(config, key)) {
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
      name: item.name,
      origin: item.uuid,
      duration: {seconds: (value ? value : 1) * ((units === "minute") ? 60 : (units === "hour") ? 3600 : 1)},
      statuses: [item.name.slugify({strict: true})],
      description: intro ?? "You are lit up!",
      flags: foundry.utils.mergeObject({
        [DEPEND.VAE]: {data: {content: item.system.description.value, forceInclude: true}},
        [DEPEND.EM]: {
          lightConfig: config,
          onCreate: {script: `(${onCreate.toString()})()`},
          onDelete: {script: `(${onDelete.toString()})()`},
          onDisable: {script: `(${onDisable.toString()})()`}
        }
      }, flags ?? {})
    }];
  }

  /**
   * Helper function to construct an effect that grants a detection mode to a token.
   * Reverts the array by deleting only what was added, when the effect is deleted.
   * @param {object[]} [modes=[]]     The array of objects of detection modes to add to the token.
   * @param {Item} item               The item being used.
   * @returns {object[]}              An array of length 1 with the effect data.
   */
  static _constructDetectionModeEffectData({modes = [], item}) {
    const onCreate = async function() {
      const modes = effect.flags.effectmacro.data.modes;
      const previousModes = foundry.utils.deepClone(token.document.detectionModes);
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
      name: item.name,
      origin: item.uuid,
      duration: ItemMacroHelpers._getItemDuration(item),
      statuses: [item.name.slugify({strict: true})],
      flags: {
        [DEPEND.EM]: {
          "onCreate.script": `(${onCreate.toString()})()`,
          "onEnable.script": `(${onCreate.toString()})()`,
          "onDelete.script": `(${onDelete.toString()})()`,
          "onDisable.script": `(${onDelete.toString()})()`,
          "data.modes": modes
        }
      }
    }];
  }

  /**
   * Helper function to create basic effect data, showing that some temporary item is active,
   * which does not require concentration.
   * @param {Item} item               The item being used.
   * @param {number} [level=null]     The optional level of the spell, for upcasting.
   * @param {string[]} types          The types of buttons to show in VAE for this item.
   * @returns {object[]}              An array of ActiveEffect data.
   */
  static _constructGenericEffectData({item, level = null, types}) {
    const itemData = item.clone({"system.level": level}, {keepId: true}).toObject();
    types ??= ["redisplay"];
    return [{
      name: item.name,
      icon: item.img,
      duration: ItemMacroHelpers._getItemDuration(item),
      statuses: [item.name.slugify({strict: true})],
      [`flags.${[DEPEND.VAE]}.data.content`]: item.system.description.value,
      [`flags.${MODULE}`]: {itemData, types}
    }];
  }

  /**
   * Helper function to add warpgate dismissal to an effect, which is triggered when the effect is deleted.
   * @param {ActiveEffect|object} effect          The effect or an object of effect data to update or modify.
   * @param {string} tokenId                      The id of the token to dismiss when the effect is deleted.
   * @returns {Promise<ActiveEffect|object>}      The updated effect or the modified object.
   */
  static async _addTokenDismissalToEffect(effect, tokenId) {
    const command = `await warpgate.dismiss("${tokenId}");`;
    if (effect instanceof ActiveEffect) {
      return effect.setFlag(DEPEND.EM, "onDelete.script", command);
    } else {
      foundry.utils.setProperty(effect, `flags.${DEPEND.EM}.onDelete.script`, command);
      return effect;
    }
  }

  /**
   * Helper function for any teleportation scripts, requiring two jb2a
   * effects (for vanishing and appearing), and the maximum radius.
   * @param {Item} item           The item being used.
   * @param {Actor} actor         The actor who owns the item.
   * @param {Token} token         The token of the actor owning the item.
   * @param {string} vanish       The jb2a asset used for the vanishing effect.
   * @param {string} appear       The jb2a asset used for the appearing effect.
   * @param {number} distance     The maximum distance the token can teleport.
   * @returns {Promise<void>}     A promise that resolves when a token has been teleported.
   */
  static async _teleportationHelper({item, actor, token, vanish, appear, distance}) {
    await actor.sheet?.minimize();
    const p = ItemMacroHelpers.drawCircle(token, distance);

    const {x, y, cancelled} = await ItemMacroHelpers.pickTargetLocation(token, distance);
    canvas.app.stage.removeChild(p);
    if (cancelled) return actor.sheet?.maximize();

    await new Sequence()
      .effect().file(vanish).atLocation(token).randomRotation().scaleToObject(2)
      .wait(750)
      .animation().on(token).opacity(0.0).waitUntilFinished()
      .play({remote: false});

    await token.document.update({x: x - canvas.grid.size / 2, y: y - canvas.grid.size / 2}, {animate: false});

    await new Sequence()
      .effect().file(appear).atLocation(token).randomRotation().scaleToObject(2)
      .wait(1500)
      .animation().on(token).opacity(1.0)
      .play({remote: false});

    await warpgate.wait(1000);
    return actor.sheet?.maximize();
  }

  /**
   * A helper for picking a target location.
   * @param {Token} token           The origin of the target picker.
   * @param {number} distance       The maximum range, in feet.
   * @returns {Promise<object>}     A promise that resolves to an object of x and y coords.
   */
  static async pickTargetLocation(token, distance) {
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
    return pickPos();

    async function pickPos() {
      const pos = await warpgate.crosshairs.show({
        size: token.document.width,
        icon: token.document.texture.src,
        label: "0 ft.",
        interval: -1
      }, {show: checkDistance});
      if (pos.cancelled) return pos;
      if (cachedDistance > distance) {
        ui.notifications.error(`The maximum range is ${distance} feet!`);
        return pickPos();
      }
      return pos;
    }
  }

  /**
   * Small spawn helper to preload token images for warpgate.
   * @param {string} name               Name of the actor to spawn.
   * @param {object} [updates={}]       An object of updates to the spawned token, actor, and embedded.
   * @param {object} [callbacks={}]     An object of callback functions.
   * @param {object} [options={}]       An object of additional options for the spawning.
   * @returns {Promise<string[]>}       The ids of spawned tokens.
   */
  static async _spawnHelper(name, updates = {}, callbacks = {}, options = {}) {
    const images = await game.actors.getName(name).getTokenImages();
    await Promise.all(images.map(img => loadTexture(img)));
    const spawn = await warpgate.spawn(name, updates, callbacks, options) ?? [];
    return spawn;
  }

  /**
   * Helper function to get spell level of the returned value from Item5e#use.
   * @param {ChatMessage|object} use      The returned value from an item usage.
   * @returns {number}                    The level at which an item was used.
   */
  static _getSpellLevel(use) {
    return use.flags?.dnd5e?.use?.spellLevel ?? 0;
  }

  /**
   * Helper function to create very basic form for a Dialog.
   * @param {string} [label=""]             The label before the select/input.
   * @param {string} [type="text"]          The type of input ('text', 'number', 'select').
   * @param {string} [options=""]           The string of options in case of a select input.
   * @param {boolean} [autofocus=true]      Whether to add autofocus to the created input.
   * @returns {string}                      The dialog content.
   */
  static _basicFormContent({label = "", type = "text", options = "", autofocus = true}) {
    const lab = label.length ? `<label>${label}</label>` : "";
    const auto = autofocus ? "autofocus" : "";
    const inp = {
      "select": `<select ${auto}>${options}</select>`,
      "number": `<input type="number" ${auto}>`
    }[type] ?? `<input type="text" ${auto}>`;
    return `
    <form class="dnd5e">
      <div class="form-group">
        ${lab}
        <div class="form-fields">${inp}</div>
      </div>
    </form>`;
  }

  /**
   * Helper function to get duration in seconds from an item's duration.
   * @param {Item} item     The item from which to retrieve data.
   * @returns {object}      An object with either 'turns' or 'seconds'.
   */
  static _getItemDuration(item) {
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
   * Draw a circle around a token placeable.
   * @param {Token} token         A token placeable.
   * @param {number} radius       The radius of the circle (in ft).
   * @returns {PIXIGraphics}      The pixi graphics element.
   */
  static drawCircle(token, radius) {
    const {x, y} = token.center;
    const tokenRadius = Math.abs(token.document.x - x);
    const pixels = radius * canvas.scene.dimensions.distancePixels + tokenRadius;
    const color = game.user.color.replace("#", "0x");
    const p = new PIXI.Graphics()
      .beginFill(color, 0.5).drawCircle(x, y, pixels).endFill()
      .beginHole().drawCircle(x, y, pixels - 5).endHole();
    canvas.app.stage.addChild(p);
    return p;
  }

  /**
   * Pick a position within a certain number of feet from a token.
   * @param {Token} token                   The token origin.
   * @param {number} radius                 The maximum radius, in feet.
   * @param {object} config                 Additional options to configure the workflow.
   * @param {string} config.type            The type of restriction ('move' or 'sight').
   * @param {boolean} config.showImage      Show the given image on the cursor.
   * @param {string} config.img             The image to show on the cursor, if any.
   * @param {color} config.red              The color used for invalid positions.
   * @param {color} config.grn              The color used for valid positions.
   * @param {number} config.alpha           The opacity of the drawn shapes.
   * @param {boolean} config.highlight      Highlight the gridspace of the current position.
   * @returns {Promise<object|null>}        A promise that resolves to an object of coordinates.
   */
  static async pickPosition(token, radius, config = {}) {
    config = foundry.utils.mergeObject({
      type: "move",
      showImage: true,
      img: token.document.texture.src,
      red: 0xFF0000,
      grn: 0x00FF00,
      alpha: 0.5,
      highlight: true
    }, config);

    const pointerSprite = new PIXI.Sprite(await loadTexture(img));
    const name = `pick-position.${token.id}`;
    const layer = canvas.grid.addHighlightLayer(name);

    const getPosition = (x, y) => {
      const types = CONST.GRID_TYPES;
      if (canvas.scene.grid.type === types.GRIDLESS) {
        return {x: Math.roundDecimals(x, 2), y: Math.roundDecimals(y, 2)};
      } else return canvas.grid.getSnappedPosition(x, y);
    };

    return new Promise(resolve => {
      const c = token.center;
      const pixels = radius * canvas.scene.dimensions.distancePixels + Math.abs(token.document.x - c.x);

      async function onClick() {
        const x = canvas.mousePosition.x - Math.abs(token.document.x - c.x);
        const y = canvas.mousePosition.y - Math.abs(token.document.y - c.y);
        const targetLoc = getPosition(x, y);
        resolve(targetLoc);
        drawing.destroy();
        canvas.app.ticker.remove(pointerImage);
        canvas.grid.clearHighlightLayer(name);
        pointerSpriteContainer.destroy();
      }

      function pointerImage(delta) {

        const x = canvas.mousePosition.x - pointerSprite.width / 2;
        const y = canvas.mousePosition.y - pointerSprite.height / 2;
        const pos = getPosition(x, y);
        canvas.grid.clearHighlightLayer(name);

        if (config.showImage) {
          pointerSpriteContainer.x = pos.x;
          pointerSpriteContainer.y = pos.y;
        }

        if (config.highlight) canvas.grid.highlightPosition(name, pos);
      }

      function cancel() {
        resolve(null)
        drawing.destroy();
        canvas.app.ticker.remove(pointerImage);
        pointerSpriteContainer.destroy();
        canvas.grid.clearHighlightLayer(name);
      }

      const drawing = new PIXI.Graphics();
      const pointerSpriteContainer = new PIXI.Container();

      pointerSprite.width = token.w;
      pointerSprite.height = token.h;
      pointerSprite.alpha = config.alpha;
      pointerSpriteContainer.addChild(pointerSprite);
      pointerSpriteContainer.visible = config.showImage;
      pointerSpriteContainer.eventMode = "none"
      canvas.controls.addChild(pointerSpriteContainer);
      canvas.app.ticker.add(pointerImage);

      const movePoly = CONFIG.Canvas.polygonBackends[config.type].create(c, {
        type: config.type, hasLimitedRadius: true, radius: pixels
      });

      drawing.eventMode = "dynamic";
      drawing.beginFill(0xFFFFFF, 0.2);
      drawing.drawShape(movePoly);
      drawing.endFill();
      drawing.tint = drawing.containsPoint(canvas.mousePosition) ? config.grn : config.red;
      drawing.cursor = "pointer";
      drawing.alpha = config.alpha;
      drawing.on('click', onClick);
      drawing.on('pointerover', () => {
        drawing.tint = config.grn;
        pointerSpriteContainer.visible = config.showImage;
      });
      drawing.on('pointerout', () => {
        drawing.tint = config.red;
        pointerSpriteContainer.visible = false;
      });
      drawing.on('rightclick', cancel);
      canvas.tokens.addChild(drawing);
    });
  }
}

/* Application and utility class for item macros. */
export class ItemMacro extends MacroConfig {
  constructor(item) {
    super(item);
    this.item = item;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/itemacro-config.hbs",
      classes: [MODULE, "macro-sheet", "sheet"]
    });
  }

  /** @override */
  async _updateObject(event, formData) {
    for (const key in formData) {
      if (!formData[key]) {
        delete formData[key];
        formData[`-=${key}`] = null;
      }
    }
    if (!Object.values(formData).some(e => e)) return this.item.update({[`flags.${MODULE}.-=itemacro`]: null});
    else return this.item.update({[`flags.${MODULE}.itemacro`]: formData});
  }

  /** @override */
  async getData() {
    const options = Object.keys(ZHELL.ITEMACRO).map(key => ({value: key, label: key}));
    const data = this.item.flags[MODULE]?.itemacro ?? {};
    return {
      item: this.item,
      command: data.command ?? null,
      options: options,
      selected: data.api ?? null
    };
  }

  /* -------------------------------------- */
  /*                                        */
  /*             STATIC METHODS             */
  /*                                        */
  /* -------------------------------------- */

  /** Initialize hooks. */
  static init() {
    Item.prototype.hasMacro = ItemMacro.hasMacro;
    Item.prototype.executeMacro = ItemMacro.executeMacro;
    Item.prototype.getMacro = ItemMacro.getMacro;

    Hooks.once("setup", ItemMacro.replaceRollItem);
    Hooks.on("renderActorSheet", ItemMacro.renderActorSheet);
    Hooks.on("getItemSheetHeaderButtons", ItemMacro.getHeaderButtons);
  }

  /** Replace the standard hotbar macro. */
  static replaceRollItem() {
    dnd5e.documents = {...dnd5e.documents};
    dnd5e.documents.macro = {...dnd5e.documents.macro};
    dnd5e.documents.macro.rollItem = ItemMacro.rollItem;
  }

  /**
   * Replace event listeners for items on an actor sheet if they have item macros.
   * @param {ActorSheet} sheet
   * @param {HTMLElement} html
   */
  static renderActorSheet(sheet, [html]) {
    if (sheet.actor.type === "group") return;
    if (!sheet.isEditable) return;

    const images = html.querySelectorAll(".item .item-image");
    for (const image of images) {
      const item = sheet.actor.items.get(image.closest("[data-item-id]")?.dataset.itemId);
      if (!item?.hasMacro()) continue;
      const clone = image.cloneNode(false);
      image.parentNode.replaceChild(clone, image);
      clone.addEventListener("click", event => item.executeMacro({event}));
    }
  }

  /**
   * Add item macro button in item headers.
   * @param {ItemSheet} sheet
   * @param {object[]} buttons
   */
  static getHeaderButtons(sheet, buttons) {
    if (!sheet.isEditable) return;
    buttons.unshift({
      icon: "fa-solid fa-sd-card",
      class: "itemacro",
      onclick: () => new ItemMacro(sheet.item).render(true)
    });
  }

  /**
   * Combination of the system's getMacroTarget and rollItem.
   * @param {string} name     The name of the item.
   * @returns {any}
   */
  static rollItem(name) {
    let actor;
    const speaker = ChatMessage.getSpeaker();
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    actor ??= game.actors.get(speaker.actor);
    if (!actor) {
      ui.notifications.warn(game.i18n.localize("MACRO.5eNoActorSelected"));
      return null;
    }

    // Find item in collection
    const documents = actor.items.filter(item => item.name === name);
    const type = game.i18n.localize(`DOCUMENT.Item`);
    if (!documents.length) {
      ui.notifications.warn(game.i18n.format("MACRO.5eMissingTargetWarn", {actor: actor.name, type, name}));
      return null;
    }
    if (documents.length > 1) {
      ui.notifications.warn(game.i18n.format("MACRO.5eMultipleTargetsWarn", {actor: actor.name, type, name}));
    }

    const item = documents[0];
    if (item.hasMacro()) return item.executeMacro();
    return item.use();
  }

  /**
   * Get whether an item has a macro embedded.
   * @returns {boolean}
   */
  static hasMacro() {
    const data = this.flags[MODULE]?.itemacro;
    if (!data) return false;
    if (data.api in ZHELL.ITEMACRO) return true;
    else return !!data.command?.trim();
  }

  /**
   * Get the embedded macro. The API method, if any, otherwise the command script.
   * @returns {string}
   */
  static getMacro() {
    const data = this.flags[MODULE]?.itemacro;
    let body;
    if (data.api in ZHELL.ITEMACRO) body = `return ZHELL.ITEMACRO.${data.api}(...arguments);`;
    else body = data.command.trim();
    return body;
  }

  /**
   * Execute an item's macro.
   * @param {object} [scope={}]     Additional arguments for the item macro.
   * @returns {any}
   */
  static async executeMacro(scope = {}) {
    if (!this.hasMacro()) return null;

    // Set up variables.
    const item = this;
    const actor = item.actor;
    const speaker = ChatMessage.getSpeaker({actor});
    const token = actor.token?.object ?? actor.getActiveTokens()[0] ?? null;
    const character = game.user.character ?? null;

    const body = `(async () => {
      ${item.getMacro()}
    })();`;
    const fn = Function("item", "speaker", "actor", "token", "character", ...Object.keys(scope), body);
    return fn.call(scope, item, speaker, actor, token, character, ...Object.values(scope));
  }
}
