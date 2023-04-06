import {drawCircle} from "./modules/animations.mjs";
import {renderClassPages} from "./modules/applications/classPages.mjs";
import {DM_TOOL} from "./modules/dm_tool.mjs";
import {ITEMACRO} from "./modules/itemMacros.mjs";
import {ZHELL_SOCKETS} from "./modules/sockets.mjs";
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
        selectContained: _selectContained
      },
      utils: {
        setForageDC: _setForageDC,
        getDocument: _getDocumentFromCompendium,
        roman: _romanize,
        whisperPlayers: _whisperPlayers,
        titleCard: _titleCard,
        drawCircle: drawCircle,
        loadTextureForAll: ZHELL_SOCKETS.loadTextureForAll,
        createTiles: ZHELL_SOCKETS.createTiles,
        awardLoot: ZHELL_SOCKETS.awardLoot,
        updateToken: ZHELL_SOCKETS.updateTokens,
        grantItems: ZHELL_SOCKETS.grantItems,
        showClassPages: renderClassPages,
        healToken: ZHELL_SOCKETS.healToken
      },
      ITEMACRO
    }
  }
}
