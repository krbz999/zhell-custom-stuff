import * as applications from "./scripts/applications/_module.mjs";
import * as data from "./scripts/data/_module.mjs";
import * as helpers from "./scripts/helpers/_module.mjs";
import * as hooks from "./scripts/hooks/_module.mjs";
import * as utils from "./scripts/utils/_module.mjs";

globalThis.ZHELL = {
  applications,
  data,
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

  if (ZHELL.settings.havilonCalendar) {
    CONFIG.time.worldCalendarClass = data.HavilonCalendar;
    CONFIG.time.worldCalendarConfig = data.HavilonCalendarConfig;
  }
});

Hooks.on("dnd5e.damageActor", hooks.markDefeated);
Hooks.on("dnd5e.postUseActivity", hooks.spendReaction);
Hooks.on("preCreateScene", hooks.sceneDefaults);
