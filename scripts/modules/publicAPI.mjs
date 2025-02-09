import { BossBar } from "./applications/bossBar.mjs";
import { gameTools } from "./gameTools/_gameTools.mjs";

export default class PublicAPI {
  static init() {
    globalThis.ZHELL = {
      utils: {
        toggleBossBar: BossBar.toggleBossBar,
        updateBossBar: BossBar.updateBossBar,
        updateBossBarDialog: BossBar.updateBossBarDialog,
        ...gameTools,
      },
    };
  }
}
