import {ClassPageRenderer} from "./modules/applications/classPages.mjs";
import {PartyFeatures} from "./modules/applications/partyFeatures.mjs";
import {gameTools} from "./modules/gameTools/_gameTools.mjs";
import {ITEMACRO, ItemMacroHelpers} from "./modules/itemMacros.mjs";
import {SocketsHandler} from "./modules/sockets.mjs";
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
        contained: _checkTokenInTemplate,
        selectContained: _selectContained
      },
      utils: {
        setForageDC: _setForageDC,
        getDocument: _getDocumentFromCompendium,
        roman: _romanize,
        whisperPlayers: _whisperPlayers,
        titleCard: _titleCard,
        drawCircle: ItemMacroHelpers.drawCircle,
        loadTextureForAll: SocketsHandler.loadTextureForAll,
        createTiles: SocketsHandler.createTiles,
        awardLoot: SocketsHandler.awardLoot,
        updateToken: SocketsHandler.updateTokens,
        grantItems: SocketsHandler.grantItems,
        showClassPages: ClassPageRenderer.renderClassPages,
        renderPartyFeatures: PartyFeatures.renderPartyFeatures,
        healToken: SocketsHandler.healToken,
        ...gameTools
      },
      ITEMACRO
    }
  }
}
