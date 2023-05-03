import {MODULE} from "../const.mjs";

/**
 * Get a document from a compendium.
 * @param {String} documentName Name of the document.
 * @param {String} catalog      Key of the compendium, or suffix of the catalog.
 */
export async function _getDocumentFromCompendium(documentName, catalog) {
  const key = `zhell-catalogs.${catalog}`;
  const pack = game.packs.get(key) ?? game.packs.get(catalog);
  if (!pack) return ui.notifications.warn("Pack not found.");
  const id = pack.index.getName(documentName)?._id;
  if (!id) return ui.notifications.warn("Entry not found.");
  return pack.getDocument(id);
}

/**
 * Set the current foraging DC programmatically.
 * @param {Number} number The new foraging DC
 */
export async function _setForageDC(number) {
  if (!game.user.isGM) return ui.notifications.warn("Excuse me?");
  return game.settings.set(MODULE, "foragingDC", number);
}

/**
 * Teleport the tokens within one circular area.
 * @param {Object} crosshairsConfig Options for the warpgate crosshairs.
 * @param {Boolean} fade            Whether or not to use Sequencer to fade in and out.
 * @param {Number} fadeDuration     The duration of the fade in and out.
 */
export async function _teleportTokens(crosshairsConfig = {}, fade = true, fadeDuration = 500) {
  const config = foundry.utils.mergeObject({
    size: 4, drawIcon: false, fillAlpha: 0.1,
    lockSize: false, label: "Pick Up Tokens", interval: -1
  }, crosshairsConfig);
  // pick area of tokens.
  const origin = await warpgate.crosshairs.show(config);
  if (origin.cancelled) return;

  // get the tokens.
  const tokenDocs = warpgate.crosshairs.collect(origin);
  game.user.updateTokenTargets(tokenDocs.map(i => i.id));

  // pick new area.
  const target = await warpgate.crosshairs.show({
    size: origin.size, drawIcon: false, fillAlpha: 0.1,
    lockSize: true, label: "Select Target", interval: -1
  });
  if (target.cancelled) return game.user.updateTokenTargets();

  if (fade) {
    const sequence = new Sequence();
    for (const tokenDoc of tokenDocs) {
      sequence.animation().on(tokenDoc).fadeOut(fadeDuration);
    }
    await sequence.play({remote: false});
    await warpgate.wait(fadeDuration);
  }

  // teleport!
  const updates = tokenDocs.map(tokenDoc => {
    return {
      _id: tokenDoc.id,
      x: tokenDoc.x - origin.x + target.x,
      y: tokenDoc.y - origin.y + target.y
    };
  });
  const update = await canvas.scene.updateEmbeddedDocuments("Token", updates, {animate: false});

  if (fade) {
    await warpgate.wait(fadeDuration);
    const sequence = new Sequence();
    for (const tokenDoc of tokenDocs) {
      sequence.animation().on(tokenDoc).fadeIn(fadeDuration);
    }
    await sequence.play({remote: false});
  }
  return update;
}

/**
 * Target all tokens within an area.
 * @param {Object} crosshairsConfig Options for the warpgate crosshairs.
 */
export async function _targetTokens(crosshairsConfig = {}) {
  const config = foundry.utils.mergeObject({
    size: 4, drawIcon: false, fillAlpha: 0.1,
    lockSize: false, rememberControlled: true,
    label: "Pick Targets",
  }, crosshairsConfig);
  const origin = await warpgate.crosshairs.show(config);
  if (origin.cancelled) return;
  const tokenDocs = warpgate.crosshairs.collect(origin);
  const tokenIds = tokenDocs.map(i => i.id);
  game.user.updateTokenTargets(tokenIds);
  return tokenIds;
}

/**
 * Get the user ids of the owners of an array of tokens.
 * @param {Array} tokens      An array of tokens.
 * @param {Boolean} excludeGM Whether or not to exclude GM user ids.
 */
export function _getTokenOwnerIds(tokens = [], excludeGM = false) {
  const userIds = game.users.filter(user => {
    return tokens.map(t => t.actor).some(a => {
      return a?.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    });
  }).map(i => i.id);
  if (excludeGM) return userIds.filter(i => !game.users.get(i).isGM);
  else return userIds;
}

/**
 * Render a dialog to whisper a set of players privately.
 */
export async function _whisperPlayers() {
  const users = game.users.filter(u => u.id !== game.user.id);
  const characterIds = users.map(u => u.character?.id).filter(i => !!i);
  const selectedPlayerIds = canvas.tokens.controlled.map(i => {
    return i.actor.id;
  }).filter(i => {
    return characterIds.includes(i);
  });
  const template = `modules/${MODULE}/templates/whisperDialog.hbs`;
  const characters = users.map(user => {
    const isControlled = selectedPlayerIds.includes(user.character?.id);
    const selected = (user.character && isControlled) ? "selected" : "";
    const id = user.id;
    const name = user.name;
    return {selected, id, name};
  });
  const content = await renderTemplate(template, {characters});

  return new Dialog({
    title: "Whisper",
    content,
    buttons: {
      whisper: {
        icon: "<i class='fa-solid fa-envelope'></i>",
        label: "Whisper",
        callback: async (html) => {
          let content = html[0].querySelector("textarea").value;
          if (!content) return;

          content = content.split("\n").reduce((acc, e) => {
            return acc + `<p>${e.trim()}</p>`;
          }, "");
          const whisperIds = new Set();
          for (const {id} of users) {
            if (html[0].querySelector(`span[id="${id}"].selected`)) whisperIds.add(id);
          }
          const whisper = whisperIds.size ? Array.from(whisperIds) : [game.user.id];
          return ChatMessage.create({content, whisper});
        }
      }
    },
    render: (html) => {
      html[0].querySelectorAll(".zhell-whisper .player-name").forEach(n => {
        n.addEventListener("click", (event) => event.currentTarget.classList.toggle("selected"));
      });
    },
  }, {classes: ["dialog", "zhell-whisper"]}).render(true, {height: "auto"});
}

/**
 * Convert a number to a Roman numeral.
 * @param {Number} number The number to convert.
 */
export function _romanize(number) {
  let num = Number(number);
  const roman = {
    M: 1000, CM: 900, D: 500,
    CD: 400, C: 100, XC: 90,
    L: 50, XL: 40, X: 10,
    IX: 9, V: 5, IV: 4, I: 1
  }
  let str = '';

  for (const i of Object.keys(roman)) {
    let q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }

  return str;
}

export class ExhaustionHandler {

  // Increase exhaustion.
  static async increaseExhaustion(actor) {
    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // Get current exhaustion effect, if any.
    const exhaustion = actor.effects.find(i => i.statuses.has("exhaustion"));

    // if exhausted, increase the level.
    if (exhaustion) {
      const currentLevel = exhaustion.flags[MODULE].exhaustion;
      return this.updateExhaustion(currentLevel + 1, actor);
    }

    // if not exhausted, set to 1.
    if (!exhaustion) return this.updateExhaustion(1, actor);
  }

  // Decrease exhaustion.
  static async decreaseExhaustion(actor, suppress = false) {
    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // Get current exhaustion effect, if any.
    const exhaustion = actor.effects.find(i => i.statuses.has("exhaustion"));

    // if exhausted, decrease the level.
    if (exhaustion) {
      const currentLevel = exhaustion.flags[MODULE].exhaustion;
      return this.updateExhaustion(currentLevel - 1, actor);
    }

    // if not exhausted, error.
    if (!suppress) ui.notifications.warn(`${actor.name} was not exhausted.`);
    return null;
  }

  // Update or set exhaustion to specific level.
  static async updateExhaustion(num, actor) {
    if (!num.between(0, 11)) {
      ui.notifications.warn("The provided level was not valid.");
      return null;
    }

    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // Get current exhaustion effect, if any.
    const exhaustion = actor.effects.find(i => i.statuses.has("exhaustion"));

    // if num===0, remove it.
    if (num === 0) return exhaustion?.delete();

    // if num===11, remove it and apply dead.
    if (num === 11) {
      await exhaustion?.delete();
      const dead = foundry.utils.deepClone(CONFIG.statusEffects.find(i => {
        return (i.id === CONFIG.specialStatusEffects.DEFEATED);
      }));
      foundry.utils.mergeObject(dead, {
        statuses: [dead.id],
        name: game.i18n.localize(dead.name),
        "flags.core.overlay": true
      });
      return actor.createEmbeddedDocuments("ActiveEffect", [dead]);
    }

    // Otherwise either update or create the exhaustion effect.
    const data = {
      name: game.i18n.localize("ZHELL.StatusConditionExhaustion"),
      statuses: ["exhaustion"],
      description: `<p>${game.i18n.format("ZHELL.StatusConditionExhaustionDescription", {level: num})}</p>`,
      "flags.zhell-custom-stuff.exhaustion": num,
      icon: "icons/skills/wounds/injury-body-pain-gray.webp",
      changes: [
        {key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.abilities.check", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.mwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.rwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.msak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.rsak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.bonuses.spell.dc", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-@attributes.exhaustion"},
        {key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: num},
      ]
    };

    // If actor has exhaustion, update it to the new level.
    if (exhaustion) return exhaustion.update(data);

    // If actor not already exhausted, find and apply.
    return actor.createEmbeddedDocuments("ActiveEffect", [data]);
  }

  // Reduce exhaustion on a long rest.
  static async _longRestExhaustionReduction(actor, data) {
    if (!data.longRest) return;
    return ExhaustionHandler.decreaseExhaustion(actor, true);
  }
}

/**
 * Show text on the screen for all users.
 * @param {String} text     The text to display.
 * @param {Number} fontSize The font size of the text.
 */
export async function _titleCard(text, fontSize = 80) {
  if (!text) {
    ui.notifications.warn("No text given.");
    return null;
  }

  const textStyle = {
    align: "center",
    dropShadow: true,
    dropShadowAlpha: 0.5,
    dropShadowBlur: 5,
    dropShadowColor: "#1f1f1f",
    dropShadowDistance: 0,
    fill: "#5a5a5a",
    fontSize,
    lineJoin: "round",
    strokeThickness: 4,
    fontFamily: "Old Evils"
  }

  return new Sequence()
    .effect().text(text, textStyle).screenSpace().screenSpaceAnchor({x: 0.5, y: 0.34}).duration(12000).fadeIn(2000).fadeOut(2000)
    .play({remote: true});
}

/**
 * Get whether a Token is contained within a TemplateDocument.
 * @param {Token5e} token                     The token placeable.
 * @param {MeasuredTemplateDocument} tempDoc  The template document.
 */
export function _checkTokenInTemplate(token, tempDoc) {
  const {size} = canvas.scene.grid;
  const {width, height, x: tokx, y: toky} = token.document;
  const {x: tempx, y: tempy, object} = tempDoc;
  const startX = width >= 1 ? 0.5 : width / 2;
  const startY = height >= 1 ? 0.5 : height / 2;
  for (let x = startX; x < width; x++) {
    for (let y = startY; y < width; y++) {
      const curr = {
        x: tokx + x * size - tempx,
        y: toky + y * size - tempy
      };
      const contains = object.shape.contains(curr.x, curr.y);
      if (contains) return true;
    }
  }
  return false;
}

/**
 * Release all tokens and then control all tokens contained within a template.
 * @param {MeasuredTemplateDocument} tempDoc The template document.
 */
export function _selectContained(tempDoc) {
  const tokens = canvas.tokens.placeables.filter(token => {
    return _checkTokenInTemplate(token, tempDoc);
  });
  canvas.tokens.releaseAll();
  tokens.forEach(token => token.control({releaseOthers: false}));
}
