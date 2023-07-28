import {MODULE} from "../../const.mjs";

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
      scrollY: [".tab .selections"],
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
  get #pack() {
    return game.packs.get("zhell-catalogs.materia-medica") ?? null;
  }

  /**
   * If 'scaling' is set to '*', each iteration will double the number of dice and the modifiers.
   * If 'scaling' is set to '+', each iteration will add '2' to dice and modifiers.
   */
  get #craftingTable() {
    return [
      // potions
      {id: "KwysQnHpErP39QsZ", cost: 2, scaling: "*"},
      {id: "gFTlhdY6vtVsXU8C", cost: 4, magical: true},
      {id: "Cg4a3MOxqOyGvKDK", cost: 6, magical: true},
      {id: "myWY2Xy0GWsS2MEh", cost: 8, magical: true},
      {id: "AkbBxDOPcEsQFpN1", cost: 10, magical: true},
      // poisons
      {id: "kwBcsGI3dMLuG96M", cost: 2, scaling: "+"},
      {id: "r3OcEJjhhpNIlxFo", cost: 4},
      {id: "pZs5VWxoNQWQMTL7", cost: 6},
      {id: "IFFhdKPlSbsCMc7z", cost: 8},
      {id: "DWtLIZLw11liaYW9", cost: 10},
      // misc
      {id: "MBhPt5wCZcQYuZIW", cost: 2},
      {id: "hYdmn5QbDdZeCRAb", cost: 4},
      {id: "WOESrV6nTY6vJE8O", cost: 6},
      {id: "ZUkFIwTYMIcJfZUh", cost: 8},
      {id: "BtV0RgISbFQeKh4u", cost: 10}
    ];
  }

  /** Get data relevant to the poison application method. */
  get #methods() {
    return {
      ingested: {label: "Ingested", cost: 0, appendix: "ZHELL.CraftingTypeIngested"},
      contact: {label: "Contact", cost: 1, appendix: "ZHELL.CraftingTypeContact"},
      injury: {label: "Injury", cost: 2, appendix: "ZHELL.CraftingTypeInjury"},
      inhaled: {label: "Inhaled", cost: 3, appendix: "ZHELL.CraftingTypeInhaled"}
    };
  }

  /**
   * Determine if the item should be crafted at half cost.
   * @param {Item} item     The item to create.
   * @returns {number}      Either 0.5 or 1.
   */
  speedCrafting(item) {
    const speed = !!this.actor.flags.dnd5e?.speedCrafting;
    if (!speed) return 1;
    const isMagical = this.#craftingTable.find(e => e.id === item.id).magical;
    if (isMagical && ["common", "uncommon"].includes(item.system.rarity)) return 0.5;
    return 1;
  }

  get materials() {
    return foundry.utils.getProperty(this.actor, `flags.${MODULE}.materia-medica.value`) ?? 0;
  }

  async getData() {
    const data = {itemTypes: {}};

    this.collection = new foundry.utils.Collection();

    // Gather craftable item data. Group by `system.consumableType`.
    for (const idx of this.#craftingTable) {
      const item = await this.#pack?.getDocument(idx.id);
      const type = item?.system.consumableType;
      if (!type) continue;

      idx.item = item;
      idx.scales = ["+", "*"].includes(idx.scaling);
      if (idx.scales) {
        idx.options = {};
        const min = idx.cost;
        const max = this.materials;
        const base = item.system.damage.parts[0][0];
        const iter = {
          "+": (x) => x + 1,
          "*": (x) => x * 2
        }[idx.scaling];
        for (let i = 1; i <= max; i = iter(i)) {
          idx.options[min * i] = new Roll(base).alter(i, 0, {multiplyNumeric: true}).formula;
        }
        idx.selected = this._selectPositions?.[item.id];
      }
      data.itemTypes[type] ??= {type, label: `DND5E.Consumable${type.capitalize()}`, items: []};
      data.itemTypes[type].items.push(idx);
      this.collection.set(item.id, idx);
    }
    data.itemTypes = Object.values(data.itemTypes);

    /* FORAGING */
    data.forageOptions = this.actor.items.reduce((acc, item) => {
      const valid = (item.type === "tool") && (item.system.baseItem === "herb") && (item.system.proficient > 0);
      if (valid) acc.push({id: item.id, label: item.name});
      return acc;
    }, [
      {id: "nat", label: CONFIG.DND5E.skills.nat.label},
      {id: "sur", label: CONFIG.DND5E.skills.sur.label}
    ]);

    data.poisonOptions = this.#methods;
    data.methodOption = this._methodOption;
    data.targetValue = this.targetValue;
    data.maxRolls = this.maxRolls;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("#forage-initiate").addEventListener("click", this._onForage.bind(this));
    html[0].querySelector("#forage-accept").addEventListener("click", this._onAcceptForage.bind(this));
    html[0].querySelectorAll("[data-action=craft]").forEach(n => n.addEventListener("click", this._onCraftingButton.bind(this)));
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
    const tool = this.actor.items.get(type);

    const rollConfig = {
      targetValue: this.targetValue,
      fumble: null,
      critical: null,
      event,
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

  async _onCraftingButton(event) {
    const select = event.currentTarget.closest(".item").querySelector(".scale-option");

    const idx = this.collection.get(event.currentTarget.closest("[data-item-id]").dataset.itemId);
    const itemData = game.items.fromCompendium(idx.item);
    const cost = idx.scales ? Number(select.value) : idx.cost;
    const formula = idx.scales ? idx.options[cost] : null;
    const hasDeliveryMethod = itemData.system.consumableType === "poison";
    const method = hasDeliveryMethod ? event.currentTarget.closest(".tab").querySelector("[data-action='delivery-method']") : null;
    const methodCost = method ? this.#methods[method.value].cost : 0;
    const total = ((cost || idx.cost) + methodCost) * this.speedCrafting(idx.item);
    console.warn({cost, idxCost: idx.cost, methodValue: method?.value, method, total, thisMat: this.materials});

    if (total > this.materials) {
      ui.notifications.warn(game.i18n.format("ZHELL.CraftingMissingMaterials", {cost: total}));
      return null;
    }

    if (itemData.system.consumableType === "poison") this._applyDeliveryMethod(itemData, method.value);

    // Replace damage formula and determine if the item should be stacked onto another item.
    if (formula) {
      const base = itemData.system.damage.parts[0][0];
      itemData.system.damage.parts[0][0] = formula;
      itemData.system.description.value = itemData.system.description.value.replace(base, formula);
    }
    const stack = this.actor.items.find(i => {
      return i.flags.core?.sourceId === itemData.flags.core.sourceId
        && i.system.description.value === itemData.system.description.value
        && (!formula || (i.system.damage.parts[0][0] === formula))
        && i.name === itemData.name;
    });

    let created;
    if (stack) {
      created = await stack.update({"system.quantity": stack.system.quantity + 1}, {render: false});
    } else {
      created = await Item.create(itemData, {parent: this.actor, render: false});
    }
    await this._displayMessage(created, total);

    return this.actor.update({[`flags.${MODULE}.materia-medica.value`]: this.materials - total});
  }

  /** Mutate poisons with delivery method, system data, name, and itemacro. */
  async _applyDeliveryMethod(itemData, method) {
    const deliveryMethod = {
      ingested: {
        system: {
          activation: {condition: "", cost: null, type: "special"},
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "creature"}
        }
      },
      contact: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "object"}
        }
      },
      injury: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          range: {value: null, long: null, units: ""},
          target: {value: 1, width: null, units: "", type: "object"}
        }
      },
      inhaled: {
        system: {
          activation: {condition: "", cost: 1, type: "action"},
          range: {value: null, long: null, units: "self"},
          target: {value: 5, width: null, units: "ft", type: "cube"}
        }
      }
    }[method];

    const {label, appendix} = this.#methods[method];
    itemData.name = `${itemData.name} (${label})`;
    itemData.system.description.value += `<p>${game.i18n.localize(appendix)}</p>`;
    foundry.utils.mergeObject(itemData.system, deliveryMethod.system);
    if (method === "injury") {
      foundry.utils.mergeObject(itemData.flags, {
        "itemacro.macro.type": "script",
        "itemacro.macro.command": "ZHELL.ITEMACRO.INJURY_POISON(...arguments);",
        "itemacro.macro.name": itemData.name
      });
    }
  }

  async _displayMessage(item, cost) {
    const content = game.i18n.format("ZHELL.CraftingComplete", {
      name: this.actor.name, amount: cost, link: item.link
    });
    const speaker = ChatMessage.getSpeaker({actor: this.actor});
    return ChatMessage.create({content, speaker});
  }

  /*RENDERING METHODS */

  _saveScrollPositions(html) {
    super._saveScrollPositions(html);
    this._selectPositions = {};
    html[0].querySelectorAll(".scale-option").forEach(s => {
      const id = s.closest("[data-item-id]").dataset.itemId;
      this._selectPositions[id] = s.value;
    });
    this._methodOption = html[0].querySelector("[data-action='delivery-method']")?.value;
  }

  /** @override */
  async render(...args) {
    this.actor.apps[this.appId] = this;
    return super.render(...args);
  }

  async close(...args) {
    delete this.actor.apps[this.appId];
    return super.close(...args);
  }

  static setUpCharacterFlag() {
    CONFIG.DND5E.characterFlags.speedCrafting = {
      name: "Speed Crafting",
      hint: game.i18n.localize("ZHELL.CraftingCharacterFlag"),
      section: "Feats",
      type: Boolean
    }
  }
}
