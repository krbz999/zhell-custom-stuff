import { BossBar } from "./scripts/modules/applications/bossBar.mjs";
import { CombatEnhancements } from "./scripts/modules/combatHelpers.mjs";
import { GameChangesHandler } from "./scripts/modules/gameChanges.mjs";
// import { MateriaMedica } from "./scripts/modules/applications/materiaMedica.mjs";
import { SheetEdits } from "./scripts/modules/applications/sheetEdits.mjs";
import ModuleSettings from "./scripts/settings.mjs";
import PublicAPI from "./scripts/modules/publicAPI.mjs";
import dataEntry from "./scripts/modules/data-entry.mjs";

Hooks.once("init", BossBar.init);
Hooks.once("init", CombatEnhancements.init);
Hooks.once("init", GameChangesHandler.init);
// Hooks.once("init", MateriaMedica.init);
Hooks.once("init", ModuleSettings.init);
Hooks.once("init", PublicAPI.init);
Hooks.once("init", SheetEdits.init);
Hooks.on("renderItemSheet", dataEntry);
Hooks.on("renderActivitySheet", dataEntry);
