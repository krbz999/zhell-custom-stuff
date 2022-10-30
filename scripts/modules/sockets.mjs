import { ZHELL_UTILS } from "./zhell_functions.mjs";

export class ZHELL_SOCKETS {

  // load texture for all.
  static loadTextureSocketOn = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "loadTextureForAll") {
        ZHELL_UTILS.loadTextureForAll(request.data.src, false);
      }
    });
  }

  // place tile.
  static routeTilesThroughGM = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "createTiles") {
        ZHELL_UTILS.createTiles(request.data.tileData, false);
      }
    });
  }

  // render 'award loot' UI with Backpack Manager.
  static awardLoot = () => {
    game.socket.on(`world.${game.world.id}`, (request) => {
      if (request.action === "awardLoot") {
        ZHELL_UTILS.awardLoot(request.data.backpackUuid, false);
      }
    })
  }
}
