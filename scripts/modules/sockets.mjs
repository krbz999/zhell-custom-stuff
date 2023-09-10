import {ImageAnchorPicker} from "./applications/imageAnchorPicker.mjs";

export class SocketsHandler {
  static init() {
    Hooks.on("dropCanvasData", SocketsHandler._onDropData);
    game.socket.on(`world.${game.world.id}`, function(request) {
      return SocketsHandler[request.action]?.(request.data, false);
    });
  }

  static async socketTemplateFunction({userId, stuff}, push = true) {
    // Find a user who can do the thing unless one is provided.
    userId ??= _getUserId(someTarget);

    // If no one can do the thing, cry about it.
    if (!userId) return ui.notifications.warn("No user found, wah!");

    // If someone ELSE can do it, push to them.
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "socketTemplateFunction",
        data: {stuff}
      });
    }

    // Else if YOU can do it, just do it.
    else if (game.user.id === userId) {
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
      if (temp) return canvas.scene.tokens.get(tokenId).actor.applyTempHP(Math.abs(amount));
      return canvas.scene.tokens.get(tokenId).actor.applyDamage(Math.abs(amount), -1);
    }
  }

  /**
   * Grant items to a token.
   * @param {object[]} itemData     The array of item data objects.
   * @param {string} tokenId        The id of the token whose actor receives the items.
   */
  static async createEmbeddedDocuments({userId, itemData = [], tokenId}, push = true) {
    userId ??= _getTargetUser(tokenId);
    if (!userId) return ui.notifications.warn("No user was found able to create the item on the target.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "createEmbeddedDocuments",
        data: {userId, itemData, tokenId}
      });
    } else if (game.user.id === userId) {
      const names = itemData.map(i => i.name).join(", ");
      const actor = canvas.scene.tokens.get(tokenId).actor;
      const content = `${names} ${itemData.length > 1 ? "were" : "was"} added to ${actor.name}'s inventory.`;
      const whisper = _getOwnerIds(actor);
      await ChatMessage.create({content, speaker: ChatMessage.getSpeaker({actor}), whisper});
      const valid = await actor.sheet._onDropSingleItem(itemData[0]);
      if (valid) return actor.createEmbeddedDocuments("Item", itemData);
    }
  }

  /**
   * When dropping an item on the canvas, find a token at the target area and transfer the item to their sheet. If more
   * one token is found, pick one of them using a prompt, and then emit a socket event to create the item on their sheet.
   * @param {Canvas} canvas     The canvas.
   * @param {object} data       The drop data.
   */
  static async _onDropData(canvas, data) {
    if (data.type !== "Item") return;
    const item = await fromUuid(data.uuid);

    // Must be a physical item.
    if (!foundry.utils.hasProperty(item, "system.quantity")) return;
    const itemData = game.items.fromCompendium(item);

    // Find valid tokens at the drop area.
    const tokens = canvas.tokens.placeables.filter(t => {
      const tb = t.bounds.contains(data.x, data.y) && (t.actor !== item.actor);
      if (game.user.isGM) return tb;
      return tb && (t.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE);
    });
    if (!tokens.length) return;

    let token;

    // If more than one token, pick one.
    if (tokens.length > 1) {
      const tokenId = await _pickTokenTarget(tokens, itemData);
      token = canvas.scene.tokens.get(tokenId);
    } else {
      token = tokens[0].document;
    }

    if (!token) return;

    // Confirm the transfer.
    const grant = await Dialog.confirm({
      title: "Grant Item",
      content: `<p>Grant ${itemData.name} to ${token.name}?</p>`
    });
    if (!grant) return;
    ui.notifications.info(`Adding item to ${token.name}!`);
    return SocketsHandler.createEmbeddedDocuments({itemData: [itemData], tokenId: token.id});
  }

  /**
   * Delete an item off another player.
   * @param {string[]} [itemIds=[]]       The ids of items to delete.
   * @param {string[]} [effectIds=[]]     The ids of effects to delete.
   * @param {string} actorId              The id of the actor off which to delete documents.
   */
  static async deleteEmbeddedDocuments({userId, itemIds = [], effectIds = [], actorId}, push = true) {
    // Find a user who is able to handle this request.
    userId ??= _getTargetUser(actorId, true);
    if (!userId) {
      ui.notifications.warn("No user was found able to handle the request.");
      return null;
    }

    // If you cannot handle it, emit the request.
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "deleteEmbeddedDocuments",
        data: {userId, itemIds, effectIds, actorId}
      });
    }

    // If you can handle it, handle it.
    else if (game.user.id === userId) {
      const actor = game.actors.get(actorId);
      return Promise.all([
        actor.deleteEmbeddedDocuments("Item", itemIds),
        actor.deleteEmbeddedDocuments("ActiveEffect", effectIds)
      ]);
    }
  }

  /**
   * Prompt an actor to take a long rest.
   * @param {string} actorId      The id of the actor to prompt.
   */
  static async longRest({userId, actorId}, push = true) {
    userId ??= _getTargetUser(actorId, true);
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "longRest",
        data: {userId, actorId}
      });
    } else if (game.user.id === userId) {
      const actor = game.actors.get(actorId);
      return actor.longRest();
    }
  }
}

/**
 * Find a user who is active and owns a token, preferring players.
 * @param {string} tokenId                      The id of a token.
 * @param {boolean} [isActor=false]             Is this an actor id instead of token id?
 * @param {boolean} [preferAssigned=falsed]     Favor a player who has the actor assigned? Requires `isActor`.
 * @returns {string|null}                       The id of the found user, if any.
 */
function _getTargetUser(tokenId, isActor = false, preferAssigned = false) {
  const actor = isActor ? game.actors.get(tokenId) : canvas.scene.tokens.get(tokenId).actor;
  const owners = game.users.filter(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
  return ((!isActor || !preferAssigned) ? owners[0]?.id : owners.find(u => u.character === actor)?.id) ?? _getFirstGM();
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
    return top[0];
  }
  return new ImageAnchorPicker({top, title, callback}).render(true);
}

/**
 * Get the ids of all owners of an actor.
 * @param {Actor} actor     The actor.
 * @returns {string[]}      The user ids.
 */
function _getOwnerIds(actor) {
  return game.users.reduce((acc, u) => {
    const owner = actor.testUserPermission(u, "OWNER");
    if (owner) acc.push(u.id);
    return acc;
  }, []);
}
