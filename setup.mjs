import BossBar from "./scripts/modules/applications/boss-bar.mjs";
import { CombatEnhancements } from "./scripts/modules/combatHelpers.mjs";
import { GameChangesHandler } from "./scripts/modules/gameChanges.mjs";
import { SheetEdits } from "./scripts/modules/applications/sheetEdits.mjs";
import ModuleSettings from "./scripts/settings.mjs";
import dataEntry from "./scripts/modules/data-entry.mjs";
import * as tools from "./scripts/modules/utils/_utils.mjs";

Hooks.once("init", BossBar.init);
Hooks.once("init", CombatEnhancements.init);
Hooks.once("init", GameChangesHandler.init);
Hooks.once("init", ModuleSettings.init);
Hooks.once("init", SheetEdits.init);
Hooks.on("renderItemSheet", dataEntry);
Hooks.on("renderActivitySheet", dataEntry);

globalThis.ZHELL = {
  utils: tools,
  boss: BossBar,
};
