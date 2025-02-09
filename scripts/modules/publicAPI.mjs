import { BossBar } from "./applications/bossBar.mjs";
import * as tools from "./gameTools/_gameTools.mjs";

export default class PublicAPI {
  static init() {
    globalThis.ZHELL = {
      boss: BossBar,
      utils: tools,
    };
  }
}
