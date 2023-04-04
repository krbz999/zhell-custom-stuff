import {MODULE} from "../../const.mjs";

export function _craftingCharacterFlag() {
  CONFIG.DND5E.characterFlags.speedCrafting = {
    name: "Speed Crafting",
    hint: game.i18n.localize("ZHELL.CraftingCharacterFlag"),
    section: "Feats",
    type: Boolean
  }
}

export class MateriaMedica extends Application {
  constructor(actor, ...T) {
    super(actor, ...T);
    this.actor = actor;
    this.maxRolls = 20;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 420,
      height: 700,
      classes: [MODULE, "materia-medica"],
      resizable: true,
      scrollY: [],
      tabs: [{navSelector: ".tabs", contentSelector: ".content-tabs", initial: "forage"}],
      dragDrop: [],
      closeOnSubmit: false,
      template: `modules/${MODULE}/templates/materiaMedica.hbs`
    });
  }

  get title() {
    return `Materia Medica: ${this.actor.name}`;
  }

  get id() {
    return `${MODULE}-materia-medica-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  get targetValue() {
    return game.settings.get(MODULE, "foragingDC");
  }

  get uuids() {
    return {
      potions: {
        2: "Compendium.zhell-catalogs.materia-medica.KwysQnHpErP39QsZ",
        4: "Compendium.zhell-catalogs.materia-medica.gFTlhdY6vtVsXU8C",
        6: "Compendium.zhell-catalogs.materia-medica.Cg4a3MOxqOyGvKDK",
        8: "Compendium.zhell-catalogs.materia-medica.myWY2Xy0GWsS2MEh",
        10: "Compendium.zhell-catalogs.materia-medica.AkbBxDOPcEsQFpN1"
      },
      poisons: {
        2: "Compendium.zhell-catalogs.materia-medica.kwBcsGI3dMLuG96M",
        4: "Compendium.zhell-catalogs.materia-medica.r3OcEJjhhpNIlxFo",
        6: "Compendium.zhell-catalogs.materia-medica.pZs5VWxoNQWQMTL7",
        8: "Compendium.zhell-catalogs.materia-medica.IFFhdKPlSbsCMc7z",
        10: "Compendium.zhell-catalogs.materia-medica.DWtLIZLw11liaYW9"
      },
      misc: {
        2: "Compendium.zhell-catalogs.materia-medica.MBhPt5wCZcQYuZIW",
        4: "Compendium.zhell-catalogs.materia-medica.hYdmn5QbDdZeCRAb",
        6: "Compendium.zhell-catalogs.materia-medica.WOESrV6nTY6vJE8O",
        8: "Compendium.zhell-catalogs.materia-medica.ZUkFIwTYMIcJfZUh",
        10: "Compendium.zhell-catalogs.materia-medica.BtV0RgISbFQeKh4u"
      }
    };
  }

  getCost(uuid) {
    const {potions, poisons, misc} = this.uuids;
    const [cost] = [
      ...Object.entries(potions),
      ...Object.entries(poisons),
      ...Object.entries(misc)
    ].find(([c, u]) => u === uuid);
    return Number(cost);
  }

  get methods() {
    return {
      0: "Ingested",
      1: "Contact",
      2: "Injury",
      3: "Inhaled"
    };
  }

  get descriptionAppend() {
    return {
      0: game.i18n.localize("ZHELL.CraftingTypeIngested"),
      1: game.i18n.localize("ZHELL.CraftingTypeContact"),
      2: game.i18n.localize("ZHELL.CraftingTypeInjury"),
      3: game.i18n.localize("ZHELL.CraftingTypeInhaled")
    }
  }

  get speedCrafting() {
    return !!this.actor.flags.dnd5e?.speedCrafting;
  }

  get materials() {
    return Number(this.actor.flags[MODULE]?.["materia-medica"]?.value ?? 0);
  }

  async getData() {
    const data = await super.getData();
    const materials = this.materials;

    /* SETTING UP BUTTONS */
    const potionItems = [];
    const poisonItems = [];
    const miscItems = [];
    const {potions, poisons, misc} = this.uuids;
    for (const n of [2, 4, 6, 8, 10]) {
      const [itemA, itemB, itemC] = await Promise.all([fromUuid(potions[n]), fromUuid(poisons[n]), fromUuid(misc[n])]);
      const scalingH = n === 2 ? this._getScalingHealing(materials, this.speedCrafting) : null;
      const scalingD = n === 2 ? this._getScalingDamage(materials) : null;
      const costA = n === 2 ? "varies" : n;
      const costB = `${n === 2 ? "varies" : n} + method`;
      potionItems.push({button: itemA.name, uuid: potions[n], scaling: scalingH, description: itemA.system.description.value, cost: costA});
      poisonItems.push({button: itemB.name, uuid: poisons[n], scaling: scalingD, description: itemB.system.description.value, cost: costB});
      miscItems.push({button: itemC.name, uuid: misc[n], description: itemC.system.description.value, cost: n});
    }


    /* POISONS */
    const poisonOptions = Object.entries(this.methods).map(([cost, label]) => ({value: cost, label: `${label} (${cost})`}));

    /* FORAGING */
    const forageOptions = this.actor.items.filter(item => {
      return (item.type === "tool") && (item.system.baseItem === "herb") && (item.system.proficient > 0);
    }).map(tool => ({id: tool.id, label: tool.name})).concat([
      {id: "nat", label: "Nature"}, {id: "sur", label: "Survival"}
    ]);

    return foundry.utils.mergeObject(data, {
      forageOptions,
      poisonOptions,
      dc: this.targetValue,
      max: this.maxRolls,
      potionItems,
      poisonItems,
      miscItems
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("#forage-initiate").addEventListener("click", this._onForage.bind(this));
    html[0].querySelector("#forage-accept").addEventListener("click", this._onAcceptForage.bind(this));
    html[0].querySelectorAll("button[data-uuid]").forEach(n => n.addEventListener("click", this._onCraftingButton.bind(this)));
    html[0].querySelector("#poison-delivery-method").addEventListener("change", this._onDeliveryMethodChange.bind(this));
    html[0].querySelector("#poison-delivery-method").dispatchEvent(new Event("change"));
  }

  async _onForage(event) {
    const target = event.currentTarget;
    target.disabled = true;
    const canAddMore = target.closest(".foraging").querySelectorAll(".results .result").length < this.maxRolls;
    if (!canAddMore) {
      ui.notifications.warn("ZHELL.CraftingCannotRollMore", {localize: true});
      return;
    }
    const type = target.closest(".tab").querySelector("#forage-tool").value;
    const fumble = null;
    const critical = null;
    const tool = this.actor.items.get(type);

    const rollConfig = {
      targetValue: this.targetValue,
      fumble, critical, event,
      dialogOptions: {
        left: event.clientX - 200,
        top: event.clientY - 180
      }
    };

    let roll;
    try {
      roll = await tool.rollToolCheck(rollConfig);
    } catch {
      roll = await this.actor.rollSkill(type, rollConfig);
    }
    if (!roll) {
      target.disabled = false;
      return;
    }
    const data = {
      total: roll.total,
      formula: roll.formula,
      type: tool ? tool.name : game.i18n.format("DND5E.SkillPromptTitle", {
        skill: CONFIG.DND5E.skills[type].label
      }),
      success: roll.total >= this.targetValue
    };
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate(`modules/${MODULE}/templates/materiaMedicaForageResult.hbs`, data);
    div.querySelector(".add-forageables").addEventListener("click", this._onToggleForageResult.bind(this));
    target.closest(".foraging").querySelector(".results").appendChild(div.firstChild);
    target.disabled = false;
  }

  _onToggleForageResult(event) {
    event.currentTarget.classList.toggle("active");
  }

  async _onAcceptForage(event) {
    const target = event.currentTarget;
    const results = target.closest(".foraging").querySelector(".results");
    const attempts = results.querySelectorAll(".result").length;
    if (!attempts) {
      ui.notifications.warn("ZHELL.CraftingMustRollOnce", {localize: true});
      return;
    }
    const foraged = results.querySelectorAll(".result .active").length;
    await ChatMessage.create({
      content: game.i18n.format("ZHELL.CraftingWentForaging", {
        name: this.actor.name, hours: attempts, amount: foraged
      }),
      speaker: ChatMessage.getSpeaker({actor: this.actor})
    });
    results.innerHTML = "";
    target.closest(".foraging").querySelector("#forage-initiate").disabled = false;
    await this.actor.setFlag(MODULE, "materia-medica.value", this.materials + foraged);
    return this._refreshDropdowns();
  }

  _onCraftingButton(event) {
    const uuid = event.currentTarget.dataset.uuid;
    const tab = event.currentTarget.closest(".tab.active").dataset.tab;
    const baseCost = this.getCost(uuid);
    const itemScales = (baseCost === 2) && ["potion", "poison"].includes(tab);
    const scale = !itemScales ? null : Number(event.currentTarget.closest(".item").querySelector("select").value);
    if (!scale && (scale !== null)) {
      ui.notifications.warn("ZHELL.CraftingMustSelectScale", {localize: true});
      return;
    }
    if (tab === "potion") return this._createPotion(uuid, baseCost, scale);
    else if (tab === "poison") {
      const method = event.currentTarget.closest(".tab").querySelector("#poison-delivery-method").value;
      return this._createPoison(uuid, baseCost, scale, Number(method));
    }
    else if (tab === "misc") return this._createMisc(uuid, baseCost);
  }

  _onDeliveryMethodChange(event) {
    const c = event.currentTarget.value;
    event.currentTarget.closest("form").querySelector(".method-description").innerText = this.descriptionAppend[c];
  }

  async _createPotion(uuid, baseCost, scale = false) {
    const item = await fromUuid(uuid);
    const itemData = game.items.fromCompendium(item);
    const cost = (scale ? scale : baseCost) * (this.speedCrafting ? 0.5 : 1);
    if (cost > this.materials) {
      ui.notifications.warn(game.i18n.format("ZHELL.CraftingMissingMaterials", {cost}));
      return;
    }

    // if scaling item, handle individually. Does not stack.
    if (scale) {
      const formula = `${scale}d4 + ${scale}`;
      itemData.system.damage.parts[0][0] = formula;
      itemData.system.description.value = itemData.system.description.value.replace("2d4 + 2", formula);
      const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
      return this._finalize(created, cost);
    }

    // find existing item and add to quantity.
    const found = this.actor.items.find(i => i.flags.core?.sourceId === uuid);
    if (found) {
      const quantity = found.system.quantity;
      const created = await found.update({"system.quantity": quantity + 1});
      return this._finalize(created, cost);
    }

    // create new item if no existing item is found.
    const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    return this._finalize(created, cost);
  }

  async _createPoison(uuid, baseCost, scale = false, method) {
    const deliveryMethod = {
      0: {
        system: {
          activation: {condition: "", cost: null, type: "special"},
          consumableType: "poison",
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "creature"}
        }
      },
      1: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          consumableType: "poison",
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "object"}
        }
      },
      2: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          consumableType: "poison",
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "object"}
        }
      },
      3: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          consumableType: "poison",
          range: {value: null, long: null, units: "self"},
          target: {value: 5, width: null, units: "ft", type: "cube"}
        }
      }
    }[method];

    const append = this.descriptionAppend[method];

    const item = await fromUuid(uuid);
    const itemData = game.items.fromCompendium(item);
    const cost = method + (scale ? scale : baseCost);
    if (cost > this.materials) {
      ui.notifications.warn(game.i18n.format("ZHELL.CraftingMissingMaterials", {cost}));
      return;
    }
    itemData.system.description.value += `<p>${append}</p>`;
    foundry.utils.mergeObject(itemData, {...deliveryMethod, [`flags.${MODULE}.poisonType`]: method});
    itemData.name = `${itemData.name} (${this.methods[method]})`;

    // Setup itemacro for injury poisons.
    if (method === 2) {
      itemData.flags.itemacro = {
        macro: {
          type: "script",
          command: "ZHELL.ITEMACRO.INJURY_POISON(...arguments);",
          name: itemData.name
        }
      }
    }

    // if scaling item, handle individually. Does not stack.
    if (scale) {
      const formula = `${scale}d6 + ${scale}`;
      itemData.system.damage.parts[0][0] = formula;
      itemData.system.description.value = itemData.system.description.value.replace("2d6 + 2", formula);
      const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
      return this._finalize(created, cost);
    }

    // find existing item and add to quantity.
    const found = this.actor.items.find(i => {
      return (i.flags.core?.sourceId === uuid) && (i.flags[MODULE]?.poisonType === method);
    });
    if (found) {
      const quantity = found.system.quantity;
      const created = await found.update({"system.quantity": quantity + 1});
      return this._finalize(created, cost);
    }
    // create new item if no existing item is found.
    const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    return this._finalize(created, cost);
  }

  async _createMisc(uuid, baseCost) {
    const item = await fromUuid(uuid);
    const itemData = game.items.fromCompendium(item);
    const cost = baseCost;
    if (cost > this.materials) {
      ui.notifications.warn(game.i18n.format("ZHELL.CraftingMissingMaterials", {cost}));
      return;
    }

    // find existing item and add to quantity.
    const found = this.actor.items.find(i => i.flags.core?.sourceId === uuid);
    if (found) {
      const quantity = found.system.quantity;
      const created = await found.update({"system.quantity": quantity + 1});
      return this._finalize(created, cost);
    }
    // create new item if no existing item is found.
    const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    return this._finalize(created, cost);
  }

  async _finalize(item, cost) {
    const content = game.i18n.format("ZHELL.CraftingComplete", {
      name: this.actor.name, amount: cost, link: item.link
    });
    const speaker = ChatMessage.getSpeaker({actor: this.actor});
    await ChatMessage.create({content, speaker});
    await this.actor.setFlag(MODULE, "materia-medica.value", this.materials - cost);
    return this._refreshDropdowns();
  }

  _refreshDropdowns() {
    const heal = this.element[0].querySelector("#scale-potion");
    const healI = heal.selectedIndex;
    heal.innerHTML = this._getScalingHealing(this.materials, this.speedCrafting);
    heal.selectedIndex = Math.clamped(healI, 0, heal.childElementCount - 1);

    const dmg = this.element[0].querySelector("#scale-poison");
    const dmgI = dmg.selectedIndex;
    dmg.innerHTML = this._getScalingDamage(this.materials);
    dmg.selectedIndex = Math.clamped(dmgI, 0, dmg.childElementCount - 1);
  }

  _getScalingDamage(materials) {
    let scalingDamage = "<option value=''>&mdash;</option>";
    let mult = 1;
    let roll = new Roll("2d6 + 2");
    while (2 * mult <= materials) {
      scalingDamage += `<option value="${2 * mult}">${roll.formula}</option>`;
      mult++;
      roll = new Roll("2d6 + 2").alter(mult, 0, {multiplyNumeric: true});
    }
    return scalingDamage;
  }

  /* Helper methods to create the select options. */
  _getScalingHealing(materials, speedCrafting = false) {
    let scalingHeal = "<option value=''>&mdash;</option>";
    let power = 1;
    let roll = new Roll("2d4 + 2");
    const upperBound = materials * (speedCrafting ? 2 : 1);
    while (2 ** power <= upperBound) {
      scalingHeal += `<option value="${2 ** power}">${roll.formula}</option>`;
      power++;
      roll = roll.alter(2, 0, {multiplyNumeric: true});
    }
    return scalingHeal;
  }
}
