import {ExperimentalElixir} from "../../applications/experimentalElixirs.mjs";

export async function macro(item, speaker, actor, token, character, event, args) {
  const app = new ExperimentalElixir({item, speaker, actor});
  return new Dialog({
    title: "Experimental Elixir",
    buttons: {
      experiment: {
        label: "<div class='label'>Experiment<br><em>(once per long rest)</em></div>",
        icon: "<i class='fa-solid fa-flask'></i>",
        callback: app.experiment.bind(app)
      },
      build: {
        label: "<div class='label'>Build-an-Elixir<br><em>(expend a spell slot)</em></div>",
        icon: "<i class='fa-solid fa-cubes'></i>",
        callback: app.render.bind(app, true)
      }
    }
  }, {
    classes: app.options.classes
  }).render(true);
}
