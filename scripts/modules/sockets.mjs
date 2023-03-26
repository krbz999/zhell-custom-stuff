import {ImageAnchorPicker} from "./applications/imageAnchorPicker.mjs";

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
        data: {src}
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
        data: {tileData}
      });
    }
    if (game.user.isGM) {
      return canvas.scene.createEmbeddedDocuments("Tile", tileData);
    }
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
        data: {backpackUuid}
      });
    }
    const a = game.user.character;
    const b = fromUuidSync(backpackUuid);
    if (!!a && b instanceof Actor) {
      return game.modules.get("backpack-manager").api.renderManager(a, b, {
        title: "Awarded Loot", hideOwnInventory: true
      });
    } else return null;
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
        data: {updates}
      });
    }
    else if (game.user.isGM) {
      return canvas.scene.updateEmbeddedDocuments("Token", updates);
    }
  }

  /* GRANT ITEMS TO TOKEN */
  static grantItemsSocketOn() {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "grantItems" && request.data.userId === game.user.id) {
        const token = canvas.scene.tokens.get(request.data.tokenId);
        return token.actor.createEmbeddedDocuments("Item", request.data.itemData);
      }
    });
  }

  static async grantItems(itemData = [], tokenId, push = true) {
    const userId = _getTargetUser(tokenId);

    if (!userId) return ui.notifications.warn("No user was found able to create the item on the target.");
    if ((game.user.id !== userId) && push) {
      game.socket.emit(`world.${game.world.id}`, {
        action: "grantItems",
        data: {itemData, tokenId, userId}
      });
    } else {
      return canvas.scene.tokens.get(tokenId).actor.createEmbeddedDocuments("Item", itemData);
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
      return tb && t.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE;
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
    return ZHELL_SOCKETS.grantItems([itemData], tokens[0].id);
  }
}

// find an active user who is the owner of the token, defaulting to an active GM.
// returns found user's id.
function _getTargetUser(tokenId) {
  if (game.user.isGM) return game.user.id;
  const user = game.users.find(u => {
    return u.active && !u.isGM && canvas.scene.tokens.get(tokenId).actor.isOwner;
  }) ?? game.users.find(u => {
    return u.active && u.isGM;
  });
  return user?.id ?? null;
}

// select a token from a selection of tokens.
async function _pickTokenTarget(tokens, itemData) {
  const top = tokens.map(t => ({name: t.document.id, src: t.document.texture.src}));
  const title = `Pick Target for ${itemData.name}`;
  const callback = async function(event, {top, middle, bottom}) {
    const tokenId = top[0];
    const target = canvas.scene.tokens.get(tokenId);
    ui.notifications.info(`Adding item to ${target.name}!`);
    return ZHELL_SOCKETS.grantItems([itemData], tokenId);
  }
  return new ImageAnchorPicker({top, title, callback}).render(true);
}
