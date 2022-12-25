export class ZHELL_SOCKETS {

  /* LOAD TEXTURES FOR ALL CLIENTS. */
  static loadTextureForAllSocketOn = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "loadTextureForAll") {
        this.loadTextureForAll(request.data.src, false);
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
  static createTilesSocketOn = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "createTiles") {
        this.createTiles(request.data.tileData, false);
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
  static awardLootSocketOn = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "awardLoot") {
        this.awardLoot(request.data.backpackUuid, false);
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
}
