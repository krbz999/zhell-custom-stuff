import { ZHELL_UTILS } from "./zhell_functions.mjs";

export class ZHELL_SOCKETS {

  /** LOAD TEXTURES FOR ALL CLIENTS. */
  static loadTextureSocketOn = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "loadTextureForAll") {
        ZHELL_UTILS.loadTextureForAll(request.data.src, false);
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
  static routeTilesThroughGM = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "createTiles") {
        ZHELL_UTILS.createTiles(request.data.tileData, false);
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
  static awardLoot = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "awardLoot") {
        ZHELL_UTILS.awardLoot(request.data.backpackUuid, false);
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
