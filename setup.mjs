import * as applications from "./scripts/applications/_module.mjs";
import * as helpers from "./scripts/helpers/_module.mjs";
import * as hooks from "./scripts/hooks/_module.mjs";
import * as utils from "./scripts/utils/_module.mjs";

const { Hooks } = foundry.helpers;

globalThis.ZHELL = {
  id: "zhell-custom-stuff",
  helpers,
  applications,
  utils,
  settings: new helpers.Settings(),
};

Hooks.once("init", () => {
  ZHELL.settings.register();
  hooks.systemChanges();
  applications.ui.BossBar.register();
  CONFIG.ui.bossbar = applications.ui.BossBar;
});
Hooks.on("dnd5e.damageActor", hooks.markDefeated);
Hooks.on("dnd5e.postUseActivity", hooks.spendReaction);
Hooks.on("renderActivitySheet", hooks.dataEntry);
Hooks.on("renderItemSheet5e", hooks.dataEntry);
Hooks.on("preCreateScene", hooks.sceneDefaults);
Hooks.on("renderActorSheet5eCharacter2", applications.apps.MateriaMedica.register);
