import {ClassPageRenderer} from "./modules/applications/classPages.mjs";
import {ImageAnchorPicker} from "./modules/applications/imageAnchorPicker.mjs";
import {MurkScroller} from "./modules/applications/murkScroller.mjs";
import {PartyFeatures} from "./modules/applications/partyFeatures.mjs";
import {SlotRecoverer} from "./modules/applications/slotRecoverer.mjs";
import {TargetSequencePicker} from "./modules/applications/targetSequencePicker.mjs";
import {WhisperPlayers} from "./modules/applications/whisperPlayers.mjs";
import {gameTools} from "./modules/gameTools/_gameTools.mjs";
import {ITEMACRO, ItemMacroHelpers} from "./modules/itemMacros.mjs";
import {PublicAPI} from "./modules/publicAPI.mjs";
import {SocketsHandler} from "./modules/sockets.mjs";

export function setupAPI() {
  globalThis.ZHELL = {
    token: {
      teleport: PublicAPI._teleportTokens,
      target: PublicAPI._targetTokens,
      healToken: SocketsHandler.healToken,
      getOwnerIds: PublicAPI._getTokenOwnerIds,
      contained: PublicAPI._checkTokenInTemplate,
      selectContained: PublicAPI._selectContained,
      detection: {
        canSeeOtherToken: PublicAPI.canSeeOtherToken,
        getFurthestPointOnTemplateFromPosition: PublicAPI.getFurthestPointOnTemplateFromPosition,
        getFurthestPointAlongRayTemplate: PublicAPI.getFurthestPointAlongRayTemplate,
        getFurthestPointAlongRay: PublicAPI.getFurthestPointAlongRay
      }
    },
    utils: {
      setForageDC: PublicAPI._setForageDC,
      getDocument: PublicAPI._getDocumentFromCompendium,
      roman: PublicAPI._romanize,
      whisperPlayers: WhisperPlayers.whisperPlayers,
      titleCard: PublicAPI._titleCard,
      drawCircle: ItemMacroHelpers.drawCircle,
      loadTextureForAll: SocketsHandler.loadTextureForAll,
      createTiles: SocketsHandler.createTiles,
      awardLoot: SocketsHandler.awardLoot,
      updateToken: SocketsHandler.updateTokens,
      grantItems: SocketsHandler.grantItems,
      showClassPages: ClassPageRenderer.renderClassPages,
      renderPartyFeatures: PartyFeatures.renderPartyFeatures,
      toggleBossBar: PublicAPI.toggleBossBar,
      updateBossBar: PublicAPI.updateBossBar,
      updateBossBarDialog: PublicAPI.updateBossBarDialog,
      pickPosition: ItemMacroHelpers.pickPosition,
      ...gameTools
    },
    applications: {
      imagePicker: ImageAnchorPicker,
      slotRecoverer: SlotRecoverer,
      sequencePicker: TargetSequencePicker,
      murkScroller: MurkScroller
    },
    ITEMACRO
  }
}
