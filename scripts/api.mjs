import { DM_TOOL } from "./modules/dm_tool.mjs";
import { ZHELL_CATALOG, ZHELL_UTILS } from "./modules/zhell_functions.mjs";

export class api {

  static register() {
    globalThis.ZHELL = {
      setting: {
        setForageDC: ZHELL_UTILS.setForageDC
      },
      catalog: {
        getDocument: ZHELL_CATALOG.getDocument,
        spawn: ZHELL_CATALOG.spawn,
        mutate: ZHELL_CATALOG.mutate,
        cast: ZHELL_CATALOG.cast,
        castCharges: ZHELL_CATALOG.castCharges
      },
      token: {
        teleport: ZHELL_UTILS.teleportTokens,
        target: ZHELL_UTILS.targetTokens,
        getOwnerIds: ZHELL_UTILS.get_token_owner_ids,
        multiTool: DM_TOOL.RENDER,
        contained: ZHELL_UTILS.checkTokenInTemplate,
        selectContained: ZHELL_UTILS.selectContained
      },
      helper: {
        wait: ZHELL_UTILS.wait,
        nth: ZHELL_UTILS.nth,
        roman: ZHELL_UTILS.romanize,
        rollItemMacro: ZHELL_UTILS.rollItemMacro,
        whisperPlayers: ZHELL_UTILS.whisper_players,
        loadTextureForAll: ZHELL_UTILS.loadTextureForAll,
        createTiles: ZHELL_UTILS.createTiles,
        //titleCard: ZHELL_UTILS.title_card //bugged
      }
    }
  }
}
