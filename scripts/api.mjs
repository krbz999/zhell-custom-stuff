import { drawCircle } from "./modules/animations.mjs";
import { applyDamageToTokens, DM_TOOL } from "./modules/dm_tool.mjs";
import { ITEMACRO } from "./modules/itemMacros.mjs";
import { ZHELL_SOCKETS } from "./modules/sockets.mjs";
import {
  _checkTokenInTemplate,
  _getDocumentFromCompendium,
  _getTokenOwnerIds,
  _romanize,
  _selectContained,
  _setForageDC,
  _targetTokens,
  _teleportTokens,
  _titleCard,
  _whisperPlayers
} from "./modules/zhell_functions.mjs";

export class api {

  static register() {
    globalThis.ZHELL = {
      token: {
        teleport: _teleportTokens,
        target: _targetTokens,
        getOwnerIds: _getTokenOwnerIds,
        multiTool: DM_TOOL.RENDER,
        contained: _checkTokenInTemplate,
        selectContained: _selectContained,
        applyDamage: applyDamageToTokens
      },
      utils: {
        setForageDC: _setForageDC,
        getDocument: _getDocumentFromCompendium,
        roman: _romanize,
        whisperPlayers: _whisperPlayers,
        loadTextureForAll: ZHELL_SOCKETS.loadTextureForAll,
        createTiles: ZHELL_SOCKETS.createTiles,
        titleCard: _titleCard,
        awardLoot: ZHELL_SOCKETS.awardLoot,
        drawCircle: drawCircle
      },
      ITEMACRO
    }
  }
}
