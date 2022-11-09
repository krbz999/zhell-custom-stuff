import { FORAGING, MODULE } from "../const.mjs";

// dialog: select hours and skill/tool, then roll a bunch of times.
export async function foraging(actor) {
  const herbalismKit = actor.itemTypes.tool.find(i => {
    if (i.system.baseItem !== "herb") return false;
    return i.system.proficient > 0;
  });
  let options = "";
  if (herbalismKit) {
    options += `<option value="${herbalismKit.id}">${herbalismKit.name}</option>`;
  }
  options += `
    <option value="nat">Nature</option>
    <option value="sur">Survival</option>`;
  const hours = Array.fromRange(12).reduce((acc, e) => {
    return acc + `<option value=${e + 1}>${e + 1} hours</option>`;
  }, "");

  const targetValue = game.settings.get(MODULE, FORAGING);


  new Dialog({
    title: "Foraging",
    content: `
        <p>You are attempting to forage for materials. Please input the number of hours, and select your method of foraging.</p>
        <p style="text-align:center">The current DC is <strong>${targetValue}</strong>.</p>
        <hr>
        <form>
            <div class="form-group">
                <label>Hours of foraging:</label>
                <div class="form-fields">
                    <select id="forage-hours">${hours}</select>
                </div>
            </div>
            <div class="form-group">
                <label>Select skill or tool:</label>
                <div class="form-fields">
                    <select id="forage-checktype">${options}</select>
                </div>
            </div>
        </form>
        <hr>`,
    buttons: {
      go: {
        icon: '<i class="fas fa-check"></i>',
        label: "Forage!<br><em>(Hold shift/ctrl/alt to fast-forward all rolls)</em>",
        callback: async (html) => {
          const selection = html[0].querySelector("#forage-checktype").value;
          const num = Number(html[0].querySelector("#forage-hours").value || 1);
          if (isNaN(num) || num < 1) return;
          const ev = event;
          let rolls;
          const config = { event: ev, targetValue, fumble: null, critical: null };
          if (selection.length > 3) {
            // roll tool.
            const tool = actor.items.get(selection);
            rolls = await Promise.all(Array(num).fill(0).map(() => {
              return tool.rollToolCheck(config);
            }));
          } else {
            // roll skill.
            rolls = await Promise.all(Array(num).fill(0).map(() => {
              return actor.rollSkill(selection, config);
            }));
          }
          const counter = rolls.filter(i => i.total >= targetValue).length;
          const materialValueCurrent = actor.getFlag(MODULE, "materia-medica.value") ?? 0;
          const newValue = Math.clamped(materialValueCurrent + counter, 0, 999);
          await actor.setFlag(MODULE, "materia-medica.value", newValue);
          const speaker = ChatMessage.getSpeaker({ actor });
          const actorName = actor.name.split(" ")[0];
          const result = `${counter} ${counter === 1 ? "unit" : "units"}`;
          const content = `
                    ${actorName} went foraging for ${num} hours and gathered
                    <strong>${result}</strong> of foraged materials (added to character sheet).`;
          return ChatMessage.create({ speaker, content });
        }
      }
    }
  }).render(true);
}

export async function crafting(actor) {
  const materials = Number(actor.getFlag(MODULE, "materia-medica.value") ?? 0);
  if (materials < 2) {
    return ui.notifications.warn("You do not have enough foraged materials to craft anything.");
  }
  const pack = "zhell-catalogs.materia-medica";

  // some variables to be passed along the poison dialogs.
  let methodCost = 0;
  let methodType = "";

  // item descriptions.
  const itemIndex = await game.packs.get(pack).getIndex({ fields: ["system.description.value"] });
  async function subtractMaterials(cost) {
    return actor.setFlag(MODULE, "materia-medica.value", materials - Number(cost));
  }

  // MAIN dialog.
  let content = await renderTemplate(`modules/${MODULE}/templates/materia_crafting_main.hbs`);
  const typeDialog = new Dialog({
    title: "Crafting",
    content,
    buttons: {},
    render: (html) => {
      html[0].addEventListener("click", async (event) => {
        const button = event.target.closest(".option-button");
        if (!button) return;
        if (button.name === "craft-potion") potionDialog.render(true);
        else if (button.name === "craft-poison") methodDialog.render(true);
        else if (button.name === "craft-bomb") bombDialog.render(true);
        else return;
        typeDialog.close();
      });
    }
  }).render(true);

  // POTION dialog.
  function getScalingHealing() {
    let scalingHeal = "";
    let power = 1;
    let roll = new Roll("2d4+2");
    while (2 ** power <= materials) {
      let formula = roll.formula;
      scalingHeal += `<option value="${2 ** power}">${formula}</option>`;
      power++;
      roll = roll.alter(2, 0, { multiplyNumeric: true });
    }
    return scalingHeal;
  }
  const potionButtons = [
    "Gillweed Tonic",
    "Restorative Tonic",
    "Soldier's Drink",
    "Elixir of Health"
  ].reduce((acc, e, i) => {
    const id = itemIndex.getName(e)._id
    const cost = 2 * (i + 2);
    const disabled = materials < cost ? "disabled" : "";
    const description = itemIndex.getName(e).system.description.value;
    return acc + `
            <div class="dialog-buttons">
                <button class="option-button potion" data-id="${id}" data-cost="${cost}" ${disabled}>${e}</button>
            </div>
            ${!disabled ? description + (i < 3 ? "<hr>" : "") : ""}
        `;
  }, "");
  content = await renderTemplate(`modules/${MODULE}/templates/materia_crafting_potion.hbs`, {
    potionOfHealingId: itemIndex.getName("Potion of Healing")._id,
    scaleHealing: getScalingHealing(),
    potionOfHealingDescription: itemIndex.getName("Potion of Healing").system.description.value,
    potionButtons
  });
  const potionDialog = new Dialog({
    title: "Craft a Potion",
    content,
    buttons: {},
    render: (html) => {
      // set up listeners for all buttons to create item.
      html[0].addEventListener("click", (event) => {
        const button = event.target.closest(".option-button");
        if (!button || button.disabled) return;
        const { id, cost, scale } = button.dataset;
        potionDialog.close();
        createPotion(id, cost, scale);
        subtractMaterials(cost);
      });
      // set up scale listener, changing the cost.
      const selector = html[0].querySelector(".option-select");
      selector.addEventListener("change", () => {
        const scale = html[0].querySelector(".option-button.scale.potion");
        scale.setAttribute("data-cost", selector.value);
      });
    }
  });

  async function createPotion(itemId, cost, scale) {
    const item = await game.packs.get(pack).getDocument(itemId);
    const compendiumItem = game.items.fromCompendium(item, { addFlags: true });

    // if scaling item, handle individually. Does not stack.
    if (!!scale) {
      const formula = `${cost}d4 + ${cost}`;
      compendiumItem.system.damage.parts[0][0] = formula;
      compendiumItem.system.description.value = `<p>Drinking this potion as an action or bonus action restores ${formula} hit points.</p>`;
      const [created] = await actor.createEmbeddedDocuments("Item", [compendiumItem]);
      return message(created.name);
    }

    // find existing item and add to quantity.
    const existingItem = actor.items.find(i => i.getFlag("core", "sourceId") === item.uuid);
    if (!!existingItem) {
      const quantity = existingItem.system.quantity;
      const [created] = await existingItem.update({ "system.quantity": quantity + 1 });
      return message(created.name);
    }

    // create new item if no existing item is found.
    const [created] = await actor.createEmbeddedDocuments("Item", [compendiumItem]);
    return message(created.name);
  }

  // POISON dialog.
  function getScalingDamage() {
    let scalingDamage = "";
    let mult = 1;
    let roll = new Roll("2d6+2");
    while (2 * mult <= (materials - Number(methodCost))) {
      let formula = roll.formula;
      scalingDamage += `<option value="${2 * mult}">${formula}</option>`;
      mult++;
      roll = new Roll("2d6+2").alter(mult, 0, { multiplyNumeric: true });
    }
    return scalingDamage;
  }
  const methodOptions = Object.entries({
    ingested: { cost: 0, label: "Ingested Poison" },
    contact: { cost: 1, label: "Contact Poison" },
    injury: { cost: 2, label: "Injury Poison" },
    inhaled: { cost: 3, label: "Inhaled Poison" }
  }).reduce((acc, [key, { cost, label }]) => {
    if (cost + 2 > materials) return acc;
    return acc + `<option value="${key}" data-cost="${cost}">[${cost}] ${label}</option>`;
  }, "");
  content = await renderTemplate(`modules/${MODULE}/templates/materia_crafting_poison_type.hbs`, {
    options: methodOptions
  });
  const methodDialog = new Dialog({
    title: "Poison Type",
    content,
    buttons: {
      go: {
        icon: '<i class="fas fa-check"></i>',
        label: "Select Method",
        callback: (html) => {
          const type = html[0].querySelector(".method-select").value;
          methodType = type;
          poisonDialog();
        }
      }
    },
    render: (html) => {
      const select = html[0].querySelector(".method-select");
      select.addEventListener("change", (event) => {
        const [option] = event.target.selectedOptions;
        const cost = option.dataset.cost;
        methodCost = Number(cost);
      });
    }
  });

  async function poisonDialog() {
    const poisonButtons = [
      "Black Widow Venom",
      "Fear Toxin",
      "Beholder Toxin",
      "Behir Blood"
    ].reduce((acc, e, i) => {
      const { _id: id, system: { description: { value: description } } } = itemIndex.getName(e);
      const cost = 2 * (i + 2); // the cost of this poison on its own.
      const disabled = (materials - Number(methodCost)) < cost ? "disabled" : "";
      return acc + `
      <div class="dialog-buttons">
        <button class="option-button poison" data-id="${id}" data-cost="${cost}" ${disabled}>${e}</button>
      </div>
      ${!disabled ? description + (i < 3 ? "<hr>" : "") : ""}`;
    }, "");

    content = await renderTemplate(`modules/${MODULE}/templates/materia_crafting_poison.hbs`, {
      poisonButtons,
      paintDescription: itemIndex.getName("Goblin Paint").system.description.value,
      paintId: itemIndex.getName("Goblin Paint")._id,
      paintOptions: getScalingDamage()
    });
    const poisonDialogx = new Dialog({
      title: "Craft a Poison",
      content,
      buttons: {},
      render: (html) => {
        // set up listeners for all buttons to create item.
        html[0].addEventListener("click", (event) => {
          const button = event.target.closest(".option-button");
          if (!button || button.disabled) return;
          const { id, cost, scale } = button.dataset;
          poisonDialogx.close();
          createPoison(id, cost, scale);
          subtractMaterials(Number(cost) + Number(methodCost));
        });
        // set up scale listener, changing the cost.
        const selector = html[0].querySelector(".option-select");
        selector.addEventListener("change", () => {
          const scale = html[0].querySelector(".option-button.scale");
          scale.setAttribute("data-cost", selector.value);
        });
      }
    }).render(true);
  }

  async function createPoison(itemId, cost, scale) {
    const deliveryMethod = {
      ingested: {
        system: {
          activation: { condition: "", cost: null, type: "special" },
          consumableType: "poisonIngested",
          range: { value: null, long: null, units: "" },
          target: { value: 1, width: null, units: "", type: "creature" }
        }
      },
      contact: {
        system: {
          activation: { condition: "", cost: 1, type: "action" },
          consumableType: "poisonContact",
          range: { value: null, long: null, units: "" },
          target: { value: 1, width: null, units: "", type: "object" }
        }
      },
      inhaled: {
        system: {
          activation: { condition: "", cost: 1, type: "action" },
          consumableType: "poisonInhaled",
          range: { value: null, long: null, units: "self" },
          target: { value: 5, width: null, units: "ft", type: "cube" }
        }
      },
      injury: {
        system: {
          activation: { condition: "", cost: 1, type: "action" },
          consumableType: "poisonInjury",
          range: { value: null, long: null, units: "" },
          target: { value: 1, width: null, units: "", type: "object" }
        }
      }
    }

    const item = await game.packs.get(pack).getDocument(itemId);
    const compendiumItem = game.items.fromCompendium(item, { addFlags: true });
    foundry.utils.mergeObject(compendiumItem, deliveryMethod[methodType]);
    compendiumItem.name = `${compendiumItem.name} (${methodType})`;

    // if scaling item, handle individually. Does not stack.
    if (!!scale) {
      const formula = `${cost}d6 + ${cost}`;
      compendiumItem.system.damage.parts[0][0] = formula;
      const value = compendiumItem.system.description.value.replace("2d6 + 2", formula);
      compendiumItem.system.description.value = value;
      const [created] = await actor.createEmbeddedDocuments("Item", [compendiumItem]);
      return message(created.name);
    }

    // find existing item and add to quantity.
    const existingItem = actor.items.find(i => {
      if (i.getFlag("core", "sourceId") !== item.uuid) return false;
      return i.system.consumableType === compendiumItem.system.consumableType;
    });
    if (!!existingItem) {
      const quantity = existingItem.system.quantity;
      const [created] = await existingItem.update({ "system.quantity": quantity + 1 });
      return message(created.name);
    }
    // create new item if no existing item is found.
    const [created] = await actor.createEmbeddedDocuments("Item", [compendiumItem]);
    return message(created.name);
  }

  // BOMB dialog.
  const bombButtons = [
    "Smoke Pellet",
    "Acid Vial",
    "Alchemist's Fire",
    "Boltstone",
    "Fraxinella Bomb"
  ].reduce((acc, e, i) => {
    const id = itemIndex.getName(e)._id
    const cost = 2 * (i + 1);
    const disabled = materials < cost ? "disabled" : "";
    const description = itemIndex.getName(e).system.description.value;
    return acc + `
        <div class="dialog-buttons">
            <button class="option-button bomb" data-id="${id}" data-cost="${cost}" ${disabled}>${e}</button>
        </div>
        ${!disabled ? description + (i < 4 ? "<hr>" : "") : ""}
        `;
  }, "");

  content = await renderTemplate(`modules/${MODULE}/templates/materia_crafting_misc.hbs`, {
    bombButtons
  });

  const bombDialog = new Dialog({
    title: "Craft a Bomb",
    content,
    buttons: {},
    render: (html) => {
      // set up listeners for all buttons to create item.
      html[0].addEventListener("click", (event) => {
        const button = event.target.closest(".option-button");
        if (!button || button.disabled) return;
        const { id, cost } = button.dataset;
        bombDialog.close();
        createBomb(id);
        subtractMaterials(cost);
      });
    }
  });

  async function createBomb(itemId) {
    const item = await game.packs.get(pack).getDocument(itemId);
    const compendiumItem = game.items.fromCompendium(item, { addFlags: true });

    // find existing item and add to quantity.
    const existingItem = actor.items.find(i => {
      return i.getFlag("core", "sourceId") === item.uuid;
    });
    if (!!existingItem) {
      const quantity = existingItem.system.quantity;
      const [created] = await existingItem.update({ "system.quantity": quantity + 1 });
      return message(created.name);
    }
    // create new item if no existing item is found.
    const [created] = await actor.createEmbeddedDocuments("Item", [compendiumItem]);
    return message(created.name);
  }

  async function message(itemName) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `${actor.name} created <strong>${itemName}</strong>.`
    });
  }
}
