export class ZHELL_SOCKETS {

  /* LOAD TEXTURES FOR ALL CLIENTS. */
  static loadTextureForAllSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "loadTextureForAll") {
        ZHELL_SOCKETS.loadTextureForAll(request.data.src, false);
      }
    });
  }

  static async loadTextureForAll(src, push = true) {
    if (push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "loadTextureForAll",
        data: { src }
      });
    }
    return loadTexture(src);
  }

  /* ROUTE TILE CREATION TO THE GM */
  static createTilesSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "createTiles") {
        ZHELL_SOCKETS.createTiles(request.data.tileData, false);
      }
    });
  }

  static async createTiles(tileData, push = true) {
    if (push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "createTiles",
        data: { tileData }
      });
    }
    if (game.user.isGM) return canvas.scene.createEmbeddedDocuments("Tile", tileData);
  }

  /* AWARD LOOT USING BACKPACK-MANAGER */
  static awardLootSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "awardLoot") {
        ZHELL_SOCKETS.awardLoot(request.data.backpackUuid, false);
      }
    });
  }

  static async awardLoot(backpackUuid, push = true) {
    if (push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "awardLoot",
        data: { backpackUuid }
      });
    }
    const a = game.user.character;
    const b = fromUuidSync(backpackUuid);
    return (!!a && (b instanceof Actor)) ? game.modules.get("backpack-manager").api.renderManager(a, b, {
      title: "Awarded Loot",
      hideOwnInventory: true
    }) : null;
  }

  /* UPDATE OTHER TOKENS */
  static updateTokensSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "updateToken") {
        ZHELL_SOCKETS.updateTokens(request.data.updates, false);
      }
    });
  }

  static async updateTokens(updates = [], push = true) {
    if (!game.user.isGM && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "updateToken",
        data: { updates }
      });
    }
    else if (game.user.isGM) return canvas.scene.updateEmbeddedDocuments("Token", updates);
  }

  /* GRANT ITEMS TO TOKEN */
  static grantItemsSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "grantItems" && request.data.userId === game.user.id) {
        return canvas.scene.tokens.get(request.data.tokenId).actor.createEmbeddedDocuments("Item", request.data.itemData);
      }
    });
  }

  static async grantItems(itemData = [], tokenId, push = true) {
    const userId = _getTargetUser(tokenId);

    if (!userId) return ui.notifications.warn("No user was found able to create the item on the target.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "grantItems",
        data: { itemData, tokenId, userId }
      });
    } else {
      return canvas.scene.tokens.get(tokenId).actor.createEmbeddedDocuments("Item", itemData);
    }
  }
}

// find an active user who is the owner of the token, defaulting to an active GM.
// returns found user's id.
function _getTargetUser(tokenId) {
  if (game.user.isGM) return game.user.id;
  const user = game.users.find(u => {
    return u.active && !u.isGM && canvas.scene.tokens.get(tokenId).actor.ownership[u.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  }) ?? game.users.find(u => {
    return u.active && u.isGM;
  });
  if (!user) return null;
  return user.id;
}
