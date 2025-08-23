import * as applications from "./scripts/applications/_module.mjs";
import * as data from "./scripts/data/_module.mjs";
import * as helpers from "./scripts/helpers/_module.mjs";
import * as hooks from "./scripts/hooks/_module.mjs";
import * as utils from "./scripts/utils/_module.mjs";
import * as config from "./scripts/config.mjs";

globalThis.ZHELL = {
  applications,
  data,
  config,
  helpers,
  utils,
  id: "zhell-custom-stuff",
  settings: new helpers.Settings(),
};

Hooks.once("init", () => {
  ZHELL.settings.register();
  hooks.systemChanges();
  applications.ui.BossBar.register();
  CONFIG.ui.bossbar = applications.ui.BossBar;
  CONFIG.ui.pause = applications.ui.GamePause;

  if (ZHELL.settings.havilonCalendar) {
    CONFIG.time.worldCalendarClass = data.HavilonCalendar;
    CONFIG.time.worldCalendarConfig = data.HavilonCalendarConfig;
  }
});

Hooks.on("dnd5e.damageActor", hooks.markDefeated);
Hooks.on("dnd5e.postUseActivity", hooks.spendReaction);
Hooks.on("preCreateScene", hooks.sceneDefaults);
Hooks.on("renderCharacterActorSheet", hooks.craftingButton);
Hooks.on("renderCharacterActorSheet", hooks.pietyBar);

for (const { hook, handler, condition } of Object.values(helpers.rollConfigs)) {
  Hooks.on(`dnd5e.${hook}`, (...args) => {
    const apply = !!condition(...args);
    if (apply) handler(...args);
  });
}
