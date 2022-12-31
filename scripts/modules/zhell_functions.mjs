import { FORAGING, MODULE } from "../const.mjs";
import { EXHAUSTION_EFFECTS } from "../../sources/conditions.mjs";

export async function _getDocumentFromCompendium(documentName, catalog) {
  const key = `zhell-catalogs.${catalog}`;
  const pack = game.packs.get(key) ?? game.packs.get(catalog);
  if (!pack) return ui.notifications.warn("Pack not found.");
  const id = pack.index.getName(documentName)?._id;
  if (!id) return ui.notifications.warn("Entry not found.");
  return pack.getDocument(id);
}

export async function _setForageDC(number) {
  if (!game.user.isGM) return ui.notifications.warn("Excuse me?");
  return game.settings.set(MODULE, FORAGING, number);
}

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
    await sequence.play();
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
  const update = await canvas.scene.updateEmbeddedDocuments("Token", updates, { animate: false });

  if (fade) {
    await warpgate.wait(fadeDuration);
    const sequence = new Sequence();
    for (const tokenDoc of tokenDocs) {
      sequence.animation().on(tokenDoc).fadeIn(fadeDuration);
    }
    await sequence.play();
  }
  return update;
}

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

export function _getTokenOwnerIds(tokens = [], excludeGM = false) {
  const permissions = tokens.map(t => t.actor.ownership);
  const userIds = game.users.filter(user => {
    return permissions.some(permission => {
      return permission[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    });
  }).map(i => i.id);
  if (excludeGM) return userIds.filter(i => !game.users.get(i).isGM);
  else return userIds;
}

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
    return { selected, id, name };
  });
  const content = await renderTemplate(template, { characters });

  return new Dialog({
    title: "Whisper",
    content,
    buttons: {
      whisper: {
        icon: "<i class='fa-solid fa-envelope'></i>",
        label: "Whisper",
        callback: async (html) => {
          let content = html[0].querySelector("#zhell-whisper-message").value;
          if (!content) return;

          content = content.split("\n").reduce((acc, e) => {
            return acc + `<p>${e.trim()}</p>`;
          }, "");
          const whisperIds = new Set();
          for (const { id } of users) {
            if (html[0].querySelector(`span[id="${id}"].selected`)) whisperIds.add(id);
          }
          const whisper = whisperIds.size ? Array.from(whisperIds) : [game.user.id];
          return ChatMessage.create({ content, whisper });
        }
      }
    },
    render: (html) => {
      html[0].addEventListener("click", (event) => {
        event.target.closest(".whisper-dialog-player-name")?.classList.toggle("selected");
      });
    },
  }).render(true, { height: "auto" });
}

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

export class EXHAUSTION {

  // increase exhaustion.
  static async increase_exhaustion(actor) {
    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // get current exhaustion effect, if any.
    const exhaustion = actor.effects.find(i => {
      return i.getFlag("core", "statusId") === "exhaustion";
    });

    // if exhausted, increase the level.
    if (exhaustion) {
      const currentLevel = exhaustion.getFlag(MODULE, "exhaustion");
      return this.update_exhaustion(currentLevel + 1, actor);
    }

    // if not exhausted, set to 1.
    if (!exhaustion) return this.update_exhaustion(1, actor);
  }

  // decrease exhaustion.
  static async decrease_exhaustion(actor) {
    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // get current exhaustion effect, if any.
    const exhaustion = actor.effects.find(i => {
      return i.getFlag("core", "statusId") === "exhaustion";
    });

    // if exhausted, decrease the level.
    if (exhaustion) {
      const currentLevel = exhaustion.getFlag(MODULE, "exhaustion");
      return this.update_exhaustion(currentLevel - 1, actor);
    }

    // if not exhausted, error.
    ui.notifications.warn(`${actor.name} was not exhausted.`);
    return null;
  }

  // update or set exhaustion to specific level
  static async update_exhaustion(num, actor) {
    if (!num.between(0, 6)) {
      ui.notifications.warn("The provided level was not valid.");
      return null;
    }
    if (!(actor instanceof Actor)) {
      ui.notifications.warn("Invalid actor provided.");
      return null;
    }

    // attempt to find any current exhaustion effect.
    let exhaustion = actor.effects.find(i => {
      return i.getFlag("core", "statusId") === "exhaustion";
    });

    // if num===0, remove it.
    if (num === 0) return exhaustion?.delete();

    // if num===6, remove it and apply dead.
    if (num === 6) {
      await exhaustion?.delete();
      const dead = foundry.utils.duplicate(CONFIG.statusEffects.find(i => {
        return i.id === "dead";
      }));
      const coreFlag = { statusId: dead.id, overlay: true };
      foundry.utils.setProperty(dead, "flags.core", coreFlag);
      return actor.createEmbeddedDocuments("ActiveEffect", [dead]);
    }

    // if actor has exhaustion, update.
    if (exhaustion) {
      const { label, changes, flags } = EXHAUSTION_EFFECTS[num - 1];
      await exhaustion.update({ label, changes, flags });
    }

    // if actor not already exhausted, find and apply.
    else if (!exhaustion) {
      exhaustion = foundry.utils.duplicate(EXHAUSTION_EFFECTS[num - 1]);
      const coreFlag = { statusId: exhaustion.id };
      foundry.utils.setProperty(exhaustion, "flags.core", coreFlag);
      await actor.createEmbeddedDocuments("ActiveEffect", [exhaustion]);
    }

    // lastly, update actor hp.
    const { value, max } = actor.system.attributes.hp;
    const newValue = Math.floor(Math.min(value, max));
    return actor.update({ "system.attributes.hp.value": newValue });
  }
}

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

  const sequence = new Sequence().effect()
    .text(text, textStyle)
    .screenSpace()
    .screenSpaceAnchor({ x: 0.5, y: 0.34 })
    .duration(12000)
    .fadeIn(2000)
    .fadeOut(2000);
  return sequence.play();
}

export function _checkTokenInTemplate(token, tempDoc) {
  const { size } = canvas.scene.grid;
  const { width, height, x: tokx, y: toky } = token.document;
  const { x: tempx, y: tempy, object } = tempDoc;
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

export function _selectContained(tempDoc) {
  const tokens = canvas.tokens.placeables.filter(token => {
    return _checkTokenInTemplate(token, tempDoc);
  });
  canvas.tokens.releaseAll();
  tokens.forEach(token => token.control({ releaseOthers: false }));
}
