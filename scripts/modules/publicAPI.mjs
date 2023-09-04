import {MODULE} from "../const.mjs";
import {BossBar} from "./applications/bossBar.mjs";
import {ClassPages} from "./applications/classPages.mjs";
import {ContestRoll} from "./applications/contest-roll.mjs";
import {ImageAnchorPicker} from "./applications/imageAnchorPicker.mjs";
import {MurkScroller} from "./applications/murkScroller.mjs";
import {PartyFeatures} from "./applications/partyFeatures.mjs";
import {SlotRecoverer} from "./applications/slotRecoverer.mjs";
import {TargetSequencePicker} from "./applications/targetSequencePicker.mjs";
import {WhisperPlayers} from "./applications/whisperPlayers.mjs";
import {gameTools} from "./gameTools/_gameTools.mjs";
import {ITEMACRO, ItemMacroHelpers} from "./itemMacros.mjs";
import {SocketsHandler} from "./sockets.mjs";

export default class PublicAPI {
  static init() {
    globalThis.ZHELL = {
      token: {
        teleport: PublicAPI._teleportTokens,
        target: PublicAPI._targetTokens,
        healToken: SocketsHandler.healToken,
        getOwnerIds: PublicAPI._getTokenOwnerIds,
        contained: PublicAPI._checkTokenInTemplate,
        selectContained: PublicAPI._selectContained,
        multipleCombatants: PublicAPI._multipleCombatants,
        detection: {
          canSeeOtherToken: PublicAPI.canSeeOtherToken,
          getFurthestPointOnTemplateFromPosition: PublicAPI.getFurthestPointOnTemplateFromPosition,
          getFurthestPointAlongRayTemplate: PublicAPI.getFurthestPointAlongRayTemplate,
          getFurthestPointAlongRay: PublicAPI.getFurthestPointAlongRay
        }
      },
      utils: {
        setForageDC: PublicAPI._setForageDC,
        getDocument: PublicAPI._getDocumentFromCompendium,
        roman: PublicAPI._romanize,
        whisperPlayers: WhisperPlayers.whisperPlayers,
        titleCard: PublicAPI._titleCard,
        drawCircle: ItemMacroHelpers.drawCircle,
        loadTextureForAll: SocketsHandler.loadTextureForAll,
        createTiles: SocketsHandler.createTiles,
        awardLoot: SocketsHandler.awardLoot,
        updateToken: SocketsHandler.updateTokens,
        grantItems: SocketsHandler.grantItems,
        showClassPages: ClassPages.show,
        renderPartyFeatures: PartyFeatures.renderPartyFeatures,
        toggleBossBar: BossBar.toggleBossBar,
        updateBossBar: BossBar.updateBossBar,
        updateBossBarDialog: BossBar.updateBossBarDialog,
        pickPosition: ItemMacroHelpers.pickPosition,
        ...gameTools
      },
      applications: {
        imagePicker: ImageAnchorPicker,
        slotRecoverer: SlotRecoverer,
        sequencePicker: TargetSequencePicker,
        murkScroller: MurkScroller,
        contestRoll: ContestRoll
      },
      ITEMACRO: ITEMACRO
    }
  }

  /* --------------------------------- */
  /*           FUNCTIONS               */
  /* --------------------------------- */

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

  /**
   * Return whether token A can see token B.
   * @param {Token} tokenA      The token whose sight is being tested.
   * @param {Token} tokenB      The token you are trying to spot.
   * @returns {boolean}         Whether the targeted token is visible to the first token.
   */
  static canSeeOtherToken(tokenA, tokenB) {
    if (!tokenA.scene.tokenVision) return true;
    const origin = tokenB.center;
    return canvas.effects.visibility.testVisibility(origin, {object: tokenA});
  }

  /**
   * Get the highlighted, top-left grid space that is furthest away from an origin, within a template.
   * @param {object} origin                         The origin to evaluate from, usually a grid center.
   * @param {MeasuredTemplateDocument} template     The template on the scene.
   * @param {string} [type="move"]                  The scene obstruction to use for evaluation.
   * @returns {number[]}                            An array with x and y coordinates.
   */
  static getFurthestPointOnTemplateFromPosition(origin, template, type = "move") {
    const moveableArea = CONFIG.Canvas.polygonBackends[type].create(origin, {type});
    const positions = canvas.grid.highlightLayers[`MeasuredTemplate.${template.id}`].positions;
    const pos = positions.reduce((acc, str) => {
      const [x, y] = str.split(".");
      const center = canvas.grid.getCenter(x, y);
      if (!moveableArea.contains(...center)) return acc;

      const dist = new Ray(origin, {x, y}).distance;
      if (acc.distance < dist) return {distance: dist, pos: center};
      return acc;
    }, {distance: 0, pos: Object.values(origin)});
    return canvas.grid.getTopLeft(...pos.pos);
  }

  /**
   * Get the furthest point along a ray template, a top-left position on a grid.
   * @param {MeasuredTemplateDocument} template     The ray template.
   * @param {string} [type="move"]                  The scene obstruction to use for evaluation.
   * @returns {number[]}                            An array with x and y coordinates.
   */
  static getFurthestPointAlongRayTemplate(template, type = "move") {
    const origin = template.object.ray.A;
    return PublicAPI.getFurthestPointOnTemplateFromPosition(origin, template, type);
  }

  /**
   * Add the selected token to initiative a number of times.
   * @param {Token|TokenDocument} token     The token from whom to make combatants.
   * @param {Number} [amount=2]             The amount of combatants to create.
   * @param {object} [options={}]           Additional parameters that change the combatants.
   * @returns {Combatant[]}
   */
  static async _multipleCombatants(token, amount = 2, options = {}) {
    const data = [];
    for (let i = 0; i < amount; i++) {
      const roll = await token.actor.getInitiativeRoll().evaluate();
      data.push(foundry.utils.mergeObject({
        actorId: token.actor.id,
        defeated: false,
        hidden: false,
        initiative: roll.total,
        sceneId: token.scene.id,
        tokenId: token.id
      }, options));
    }
    return game.combat.createEmbeddedDocuments("Combatant", data);
  }

  /* --------------------------------- */
  /*   WORKS IN PROGRESS               */
  /* --------------------------------- */

  static async getFurthestPointAlongRay(ray) {
    const template = await MeasuredTemplateDocument.create({
      t: "ray",
      x: ray.A.x,
      y: ray.A.y,
      distance: ray.distance / canvas.dimensions.distancePixels + canvas.dimensions.distance / 2,
      direction: Math.toDegrees(ray.angle),
      width: 5,
      hidden: true
    }, {parent: canvas.scene});
    await new Promise(r => setTimeout(r, 100));
    template.object.refresh();
    return PublicAPI.getFurthestPointAlongRayTemplate(template);
  }

  static _computeShape(ray) {
    const width = 5 * canvas.dimensions.distancePixels;
    const direction = ray.angle;
    const distance = ray.distance;
    return MeasuredTemplate.getRayShape(direction, distance, width);
  }

  /**
   * Push tokens away from a point on the canvas. Does not take walls into account.
   * All pushed tokens will end up at the perimeter of a circle.
   * @param {object|Token} origin     Object with x and y coordinates, or a token placeable.
   * @param {number} ft               The radius to push tokens out to.
   */
  static async pushTokensAwayFromPoint(origin, ft) {
    const shape = MeasuredTemplate.getCircleShape(canvas.dimensions.distancePixels * ft);
    if (origin instanceof Token) origin = origin.center;
    shape.x = origin.x;
    shape.y = origin.y;

    const updates = [];
    for (const tok of canvas.scene.tokens) {
      const center = tok.object.center;
      const ray = new Ray(origin, center);
      if (!(ray.distance > 0)) continue;
      const point = shape.pointAtAngle(ray.angle);
      updates.push({x: point.x - tok.object.w / 2, y: point.y - tok.object.h / 2});
    }
    return canvas.scene.updateEmbeddedDocuments("Token", updates);
  }

  /**
   * Smack the target away from the origin.
   * @param {Token} origin      The token to smack away from.
   * @param {Token} target      The token to smack away.
   * @param {number} ft         Number of feet to smack away.
   */
  static async smackTokenAway(origin, target, ft) {
    const oc = origin.center;
    const tc = target.center;
    const ray = Ray.towardsPoint(oc, tc, ft * canvas.dimensions.distancePixels);
    canvas.interface.createScrollingText(tc, "Smack!");
    const [x, y] = await PublicAPI.getFurthestPointAlongRay(ray);
    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [], {deleteAll: true});
    if (canvas.grid.measureDistance(oc, {x, y}) < canvas.grid.measureDistance(oc, tc)) {
      ui.notifications.warn("You can't smack someone closer to you.");
      return null;
    }
    return target.document.update({x, y});
  }
}
