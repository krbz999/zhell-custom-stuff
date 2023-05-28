import {MODULE} from "../const.mjs";

export class PublicAPI {
  /**
   * Get a document from a compendium.
   * @param {string} documentName     Name of the document.
   * @param {string} catalog          Key of the compendium, or suffix of the catalog.
   * @returns {Promise<Document>}     The retrieved document.
   */
  static async _getDocumentFromCompendium(documentName, catalog) {
    const key = `zhell-catalogs.${catalog}`;
    const pack = game.packs.get(key) ?? game.packs.get(catalog);
    if (!pack) return ui.notifications.warn("Pack not found.");
    const id = pack.index.getName(documentName)?._id;
    if (!id) return ui.notifications.warn("Entry not found.");
    return pack.getDocument(id);
  }

  /**
   * Set the current foraging DC programmatically.
   * @param {number} number           The new foraging DC.
   * @returns {Promise<Setting>}      The updated setting.
   */
  static async _setForageDC(number) {
    if (!game.user.isGM) return ui.notifications.warn("Excuse me?");
    return game.settings.set(MODULE, "foragingDC", number);
  }

  /**
   * Teleport the tokens within one circular area.
   * @param {object} [crosshairsConfig={}]      Options for the warpgate crosshairs.
   * @param {boolean} [fade=true]               Whether or not to use Sequencer to fade in and out.
   * @param {number} [fadeDuration=500]         The duration of the fade in and out.
   * @returns {Promise<TokenDocument[]>}        The array of updated token documents.
   */
  static async _teleportTokens(crosshairsConfig = {}, fade = true, fadeDuration = 500) {
    const config = foundry.utils.mergeObject({
      size: 4,
      drawIcon: false,
      fillAlpha: 0.1,
      lockSize: false,
      label: "Pick Up Tokens",
      interval: -1
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
   * @param {object} crosshairsConfig     Options for the warpgate crosshairs.
   * @returns {Promise<string[]>}         The array of token ids.
   */
  static async _targetTokens(crosshairsConfig = {}) {
    const config = foundry.utils.mergeObject({
      size: 4,
      drawIcon: false,
      fillAlpha: 0.1,
      lockSize: false,
      rememberControlled: true,
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
   * @param {Token[]} [tokens=[]]           An array of tokens.
   * @param {boolean} [excludeGM=false]     Whether or not to exclude GM user ids.
   * @returns {string[]}                    The array of user ids.
   */
  static _getTokenOwnerIds(tokens = [], excludeGM = false) {
    const userIds = game.users.reduce((acc, user) => {
      if (tokens.some(t => t.document.testUserPermission(user, "OWNER"))) acc.push(user.id);
      return acc;
    }, []);
    if (excludeGM) return userIds.filter(i => !game.users.get(i).isGM);
    else return userIds;
  }

  /**
   * Convert a number to a Roman numeral.
   * @param {number} number     The number to convert.
   * @returns {string}          The converted number.
   */
  static _romanize(number) {
    let num = Number(number);
    const roman = {
      M: 1000, CM: 900, D: 500, CD: 400, C: 100,
      XC: 90, L: 50, XL: 40, X: 10,
      IX: 9, V: 5, IV: 4, I: 1
    };
    let str = '';

    for (const i of Object.keys(roman)) {
      let q = Math.floor(num / roman[i]);
      num -= q * roman[i];
      str += i.repeat(q);
    }

    return str;
  }

  /**
   * Show text on the screen for all users.
   * @param {string} text               The text to display.
   * @param {number} [fontSize=80]      The font size of the text.
   * @returns {Promise<Sequence>}       The played Sequence.
   */
  static async _titleCard(text, fontSize = 80) {
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
    };

    return new Sequence()
      .effect().text(text, textStyle).screenSpace().screenSpaceAnchor({x: 0.5, y: 0.34}).duration(12000).fadeIn(2000).fadeOut(2000)
      .play({remote: true});
  }

  /**
   * Get whether a Token is contained within a TemplateDocument.
   * @param {Token} token                           The token placeable.
   * @param {MeasuredTemplateDocument} tempDoc      The template document.
   * @returns {boolean}                             Whether the token is contained.
   */
  static _checkTokenInTemplate(token, tempDoc) {
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
   * @param {MeasuredTemplateDocument} tempDoc      The template document.
   */
  static _selectContained(tempDoc) {
    const tokens = canvas.tokens.placeables.filter(token => {
      return PublicAPI._checkTokenInTemplate(token, tempDoc);
    });
    canvas.tokens.releaseAll();
    tokens.forEach(token => token.control({releaseOthers: false}));
  }
}
