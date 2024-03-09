import {MODULE} from "../../../const.mjs";
import {ExperimentalElixir} from "../../applications/experimentalElixirs.mjs";

export const alchemist = {EXPERIMENTAL_ELIXIR, ELIXIR_CANNON};

async function EXPERIMENTAL_ELIXIR(item) {
  const app = new ExperimentalElixir({
    item: item,
    speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
    actor: item.actor
  });
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

async function ELIXIR_CANNON(item) {
  const app = new ExperimentalElixir({
    item: item,
    speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
    actor: item.actor
  });

  // The item has 15 max uses. If it has no uses left, prompt for a new type and refill.
  if (!item.system.uses.value) {
    const type = await Dialog.wait({
      title: item.name,
      buttons: Object.entries(app.elixirTypes).reduce((acc, [type, data]) => {
        acc[type] = {label: data.name, callback: type};
        return acc;
      }, {}),
      render: (html) => {
        html[0].closest(".dialog").querySelectorAll("[data-button]").forEach(n => {
          const string = `ZHELL.ExperimentalElixirType${app.elixirTypes[n.dataset.button].name}`;
          n.setAttribute("data-tooltip", game.i18n.format(string, {mod: item.actor.system.abilities.int.mod}));
          n.setAttribute("data-tooltip-direction", "LEFT");
        });
      }
    }, {
      classes: ["dialog", "column-dialog"],
      id: `elixir-cannon-${item.uuid.replaceAll(".", "-")}`
    });
    if (!type) return;
    const [itemData] = await app.getElixirItemData([type]);
    delete itemData.system.uses;
    return item.update({
      [`flags.${MODULE}.itemData`]: [itemData],
      "system.uses.value": item.system.uses.max
    });
  }

  // If there are uses left, use the item.
  const use = await item.use({}, {createMessage: false});
  if (!use) return;

  const [itemData] = item.flags[MODULE].itemData;
  const elixir = new Item.implementation(itemData, {parent: item.actor});
  elixir.prepareData();
  elixir.prepareFinalAttributes();
  return elixir.use({}, {"flags.dnd5e.itemData": itemData});
}
