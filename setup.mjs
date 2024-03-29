import {BossBar} from "./scripts/modules/applications/bossBar.mjs";
import {CombatEnhancements} from "./scripts/modules/combatHelpers.mjs";
import {ContestRoll} from "./scripts/modules/applications/contest-roll.mjs";
import {GameChangesHandler} from "./scripts/modules/gameChanges.mjs";
import {MateriaMedica} from "./scripts/modules/applications/materiaMedica.mjs";
import {SheetEdits} from "./scripts/modules/applications/sheetEdits.mjs";
import {SocketsHandler} from "./scripts/modules/sockets.mjs";
import ActorExtension from "./scripts/modules/documents/character.mjs";
import ModuleSettings from "./scripts/settings.mjs";
import PublicAPI from "./scripts/modules/publicAPI.mjs";

Hooks.once("init", ActorExtension.init);
Hooks.once("init", BossBar.init);
Hooks.once("init", CombatEnhancements.init);
Hooks.once("init", ContestRoll.init);
Hooks.once("init", GameChangesHandler.init);
Hooks.once("init", MateriaMedica.init);
Hooks.once("init", ModuleSettings.init);
Hooks.once("init", PublicAPI.init);
Hooks.once("init", SheetEdits.init);
Hooks.once("init", SocketsHandler.init);
