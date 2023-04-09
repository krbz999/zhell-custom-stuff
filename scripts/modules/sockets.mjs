import {ImageAnchorPicker} from "./applications/imageAnchorPicker.mjs";

export class ZHELL_SOCKETS {
  static socketsOn() {
    game.socket.on(`world.${game.world.id}`, function(request) {
      console.log("REQUEST:", request);
      return ZHELL_SOCKETS[request.action](request.data, false);
    });
  }

  static async socketTemplateFunction({userId, stuff}, push=true){
    // Find a user who can do the thing unless one is provided.
    userId ??= _getFirstGM();

    // If no one can do the thing, cry about it.
    if(!userId) return ui.notifications.warn("No user found, wah!");

    // If someone ELSE can do it, push to them.
    if(game.user.id !== userId) {
      if(push) game.socket.emit(`world.${game.world.id}`, {
        actor: "socketTemplateFunction",
        data: {stuff}
      });
    }

    // Else if YOU can do it, just do it.
    else if ( game.user.id === userId) {
      // Do the thing.
    }
  }

  /**
   * Load texture for all clients.
   * @param {string} src      The texture to load.
   */
  static async loadTextureForAll({src}, push = true) {
    if (push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "loadTextureForAll",
        data: {src}
      });
    }
    return loadTexture(src);
  }

  /**
   * Route tile creation to the GM.
   * @param {object} tileData     The data to create on the scene.
   */
  static async createTiles({userId, tileData}, push = true) {
    userId ??= _getFirstGM();
    if (!userId) return ui.notifications.warn("No user was found able to create the tiles.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "createTiles",
        data: {userId, tileData}
      });
    } else if (game.user.id === userId) {
      return canvas.scene.createEmbeddedDocuments("Tile", tileData);
    }
  }

  /**
   * Award loot using Backpack Manager.
   * @param {string} backpackUuid     The uuid of the backpack actor.
   */
  static async awardLoot({backpackUuid}, push = true) {
    if (push) {
      ui.notifications.info("Showing awarded loot!");
      game.socket.emit(`world.${game.world.id}`, {
        action: "awardLoot",
        data: {backpackUuid}
      });
    }
    const a = game.user.character;
    const b = fromUuidSync(backpackUuid);
    if (a && (b instanceof Actor)) {
      return game.modules.get("backpack-manager").api.renderManager(a, b, {
        title: "Awarded Loot", hideOwnInventory: true
      });
    } else return null;
  }

  /**
   * Update other tokens.
   * @param {object[]} updates      The array of update data.
   * @param {object} options        The update options.
   */
  static async updateTokens({userId, updates = [], options = {}}, push = true) {
    userId ??= _getFirstGM();
    if (!userId) return ui.notifications.warn("No user was found able to update the tokens.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "updateTokens",
        data: {userId, updates, options}
      });
    } else if (game.user.id === userId) {
      return canvas.scene.updateEmbeddedDocuments("Token", updates, options);
    }
  }

  /**
   * Grant healing or temporary hit points to a targeted token you do not own.
   * @param {string} tokenId      The id of a token, or the placeable or document itself.
   * @param {number} amount       The amount of healing or temp hp to grant.
   * @param {boolean} temp        Whether the healing is temporary hit points.
   */
  static async healToken({tokenId, userId = null, amount = 0, temp = false}, push = true) {
    if ((tokenId instanceof Token) || (tokenId instanceof TokenDocument)) tokenId = tokenId.id;
    userId ??= _getTargetUser(tokenId);
    if (!userId) return ui.notifications.warn("No user was found able to heal the target.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "healToken",
        data: {tokenId, amount, temp, userId}
      });
    } else if (game.user.id === userId) {
      const func = temp ? "applyTempHP" : "applyDamage";
      const heal = temp ? Math.abs(amount) : -Math.abs(amount);
      return canvas.scene.tokens.get(tokenId).actor[func](heal);
    }
  }

  /**
   * Grant items to a token.
   * @param {object[]} itemData     The array of item data objects.
   * @param {string} tokenId        The id of the token whose actor receives the items.
   */
  static async grantItems({userId, itemData = [], tokenId}, push = true) {
    userId ??= _getTargetUser(tokenId);
    if (!userId) return ui.notifications.warn("No user was found able to create the item on the target.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "grantItems",
        data: {userId, itemData, tokenId}
      });
    } else if (game.user.id === userId) {
      const names = itemData.map(i => i.name).join(", ");
      const actor = canvas.scene.tokens.get(tokenId).actor;
      const content = `${names} ${itemData.length > 1 ? "were" : "was"} added to ${actor.name}'s inventory.`;
      await ChatMessage.create({content, speaker: ChatMessage.getSpeaker({actor}), whisper: [userId]});
      return actor.createEmbeddedDocuments("Item", itemData);
    }
  }

  static async _onDropData(canvas, data) {
    if (data.type !== "Item") return;
    const item = await fromUuid(data.uuid);
    if (!["weapon", "equipment", "consumable", "tool", "backpack", "loot"].includes(item.type)) return;
    const itemData = game.items.fromCompendium(item);
    const tokens = canvas.tokens.placeables.filter(t => {
      const tb = t.bounds.contains(data.x, data.y) && (t.actor !== item.actor);
      if (game.user.isGM) return tb;
      return tb && (t.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE);
    });
    if (!tokens.length) return;
    if (tokens.length > 1) return _pickTokenTarget(tokens, itemData);
    const grant = await Dialog.confirm({
      title: "Grant Item",
      content: `<p>Grant ${itemData.name} to ${tokens[0].document.name}?</p>`
    });
    if (!grant) return;
    ui.notifications.info(`Adding item to ${tokens[0].document.name}!`);
    await tokens[0].actor.sheet._onDropSingleItem(itemData);
    return ZHELL_SOCKETS.grantItems({itemData: [itemData], tokenId: tokens[0].id});
  }
}

/**
 * Find a user who is active and owns a token, preferring players.
 * @param {string} tokenId      The id of a token.
 * @returns {string|null}       The id of the found user, if any.
 */
function _getTargetUser(tokenId) {
  if (game.user.isGM) return game.user.id;
  const user = game.users.find(u => {
    return u.active && !u.isGM && canvas.scene.tokens.get(tokenId).actor.testUserPermission(u, "OWNER");
  });
  if (user) return user.id;
  return _getFirstGM();
}

/**
 * Find a user who is active and a GM.
 * @returns {string}      The id of the first active gm found.
 */
function _getFirstGM() {
  return game.users.find(u => u.active && u.isGM)?.id;
}

/**
 * Select a token from a selection of tokens.
 * @param {Token[]} tokens      An array of token placeables.
 * @param {object} itemData     An object of item data to create.
 */
async function _pickTokenTarget(tokens, itemData) {
  const top = tokens.map(t => ({name: t.document.id, src: t.document.texture.src}));
  const title = `Pick Target for ${itemData.name}`;
  const callback = async function(event, {top, middle, bottom}) {
    const tokenId = top[0];
    const target = canvas.scene.tokens.get(tokenId);
    ui.notifications.info(`Adding item to ${target.name}!`);
    return ZHELL_SOCKETS.grantItems({itemData: [itemData], tokenId});
  }
  return new ImageAnchorPicker({top, title, callback}).render(true);
}
