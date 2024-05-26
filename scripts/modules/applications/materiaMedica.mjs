import {MODULE} from "../../const.mjs";

export class MateriaMedica extends Application {
  constructor(actor, ...T) {
    super(actor, ...T);
    this.actor = actor;
    this.maxRolls = 20;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 420,
      height: 700,
      classes: [MODULE, "materia-medica"],
      resizable: true,
      scrollY: [".tab .selections"],
      tabs: [
        {navSelector: ".tabs[data-group='main']", contentSelector: ".content", initial: "forage"},
        {navSelector: ".tabs[data-group='craft']", contentSelector: ".tab[data-tab='craft']", initial: "potion"}
      ],
      dragDrop: [],
      closeOnSubmit: false,
      template: `modules/${MODULE}/templates/materiaMedica.hbs`
    });
  }

  /** @override */
  get title() {
    return `Materia Medica: ${this.actor.name}`;
  }

  /** @override */
  get id() {
    return `${MODULE}-materia-medica-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  /**
   * The current dc for foraging checks, read from the game settings.
   * @returns {number}
   */
  get #targetValue() {
    return game.settings.get(MODULE, "foragingDC");
  }

  /**
   * The compendium to extract the craftable items from.
   * @returns {CompendiumCollection}
   */
  get #pack() {
    return game.packs.get("zhell-catalogs.items");
  }

  /**
   * If 'scaling' is set to '*', each iteration will double the number of dice and the modifiers.
   * If 'scaling' is set to '+', each iteration will add '2' to dice and modifiers.
   * @returns {object[]}
   */
  get #craftingTable() {
    return [
      // potions
      {id: "KwysQnHpErP39QsZ", cost: 2, magical: true, scaling: "*"},
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

  /**
   * Get data relevant to the poison application method.
   * @returns {object}
   */
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
  #speedCrafting(item) {
    const speed = !!this.actor.flags.dnd5e?.speedCrafting;
    if (!speed) return 1;
    const isMagical = this.#craftingTable.find(e => e.id === item.id).magical;
    if (isMagical && ["common", "uncommon"].includes(item.system.rarity)) return 0.5;
    return 1;
  }

  /**
   * The amount of materials available on the actor.
   * @returns {number}
   */
  get #materials() {
    const materials = foundry.utils.getProperty(this.actor, `flags.${MODULE}.materia-medica.value`) ?? 0;
    return dnd5e.utils.simplifyBonus(materials);
  }

  /** @override */
  async getData() {
    const data = {itemTypes: {}};

    this.collection = new foundry.utils.Collection();
    this.forageData ??= new foundry.utils.Collection();
    data.forages = this.forageData;
    data.poisonOptions = this.#methods;
    data.targetValue = this.#targetValue;
    data.maxRolls = this.maxRolls;

    const ids = this.#craftingTable.map(k => k.id);
    const items = await this.#pack.getDocuments({_id__in: ids});

    // Gather craftable item data. Group by `system.consumableType`.
    for (const idx of this.#craftingTable) {
      idx.item = items.find(k => k.id === idx.id);
      const type = idx.item.system.type.value;
      idx.cost = Math.floor(idx.cost * this.#speedCrafting(idx.item));
      idx.scales = ["+", "*"].includes(idx.scaling);
      if (idx.scales) {
        idx.options = {};
        const min = idx.cost;
        const max = this.#materials;
        const base = idx.item.system.damage.parts[0][0];
        const iter = {
          "+": (x) => x + 1,
          "*": (x) => x * 2
        }[idx.scaling];
        for (let i = 1; i <= max; i = iter(i)) {
          if (min * i > max) continue;
          idx.options[min * i] = new Roll(base).alter(i, 0, {multiplyNumeric: true}).formula;
        }
        idx.selected = this._selectPositions?.[idx.item.id];
      }
      data.itemTypes[type] ??= {type, label: `DND5E.Consumable${type.capitalize()}`, items: []};
      data.itemTypes[type].items.push(idx);
      this.collection.set(idx.item.id, idx);
    }
    data.itemTypes = Object.values(data.itemTypes);

    /* FORAGING */
    data.forageOptions = this.actor.items.reduce((acc, item) => {
      const valid = (item.type === "tool") && (item.system.type.baseItem === "herb") && item.system.prof.hasProficiency;
      if (valid) acc.push({id: item.id, label: item.name});
      return acc;
    }, []).concat([
      {id: "nat", label: CONFIG.DND5E.skills.nat.label},
      {id: "sur", label: CONFIG.DND5E.skills.sur.label}
    ]);
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("[data-action='forage-initiate']").addEventListener("click", this._onForage.bind(this));
    html[0].querySelector("[data-action='forage-accept']").addEventListener("click", this._onAcceptForage.bind(this));
    html[0].querySelectorAll("[data-action=craft]").forEach(n => {
      n.addEventListener("click", this._onCraftingButton.bind(this));
    });
    html[0].querySelectorAll("[data-action='delivery-method-tooltip']").forEach(n => {
      n.addEventListener("mouseover", this._showDeliveryMethodTooltip.bind(this));
    });
    html[0].querySelectorAll("[data-action='success-toggle']").forEach(n => {
      n.addEventListener("click", this._onToggleForageResult.bind(this));
    });
  }

  /**
   * Handle clicking the button to go foraging.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MateriaMedica}
   */
  async _onForage(event) {
    const target = event.currentTarget;
    target.disabled = true;
    const canAddMore = target.closest(".foraging").querySelectorAll(".results .result").length < this.maxRolls;
    if (!canAddMore) {
      ui.notifications.warn("ZHELL.CraftingCannotRollMore", {localize: true});
      return;
    }
    const type = target.closest(".tab").querySelector("[data-action='forage-method']").value;
    const tool = this.actor.items.get(type);

    const rollConfig = {
      targetValue: this.#targetValue,
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
      id: foundry.utils.randomID(),
      total: roll.total,
      formula: roll.formula,
      type: tool ? tool.name : game.i18n.format("DND5E.SkillPromptTitle", {
        skill: CONFIG.DND5E.skills[type].label
      }),
      success: roll.total >= this.#targetValue
    };
    this.forageData.set(data.id, data);
    return this.render();
  }

  /**
   * Handle toggling the success state of a foraging roll.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {MateriaMedica}
   */
  _onToggleForageResult(event) {
    const data = this.forageData.get(event.currentTarget.closest("[data-forage-id]").dataset.forageId);
    data.success = !data.success;
    return this.render();
  }

  /**
   * Handle accepting all the foraging results.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {ChatMessage}
   */
  async _onAcceptForage(event) {
    const attempts = this.forageData.size;
    const foraged = this.forageData.filter(r => r.success).length;
    this.forageData.clear();
    if (!foraged) this.render();
    await this.actor.setFlag(MODULE, "materia-medica.value", this.#materials + foraged);
    return ChatMessage.create({
      content: game.i18n.format("ZHELL.CraftingWentForaging", {
        name: this.actor.name,
        hours: attempts,
        amount: foraged
      }),
      speaker: ChatMessage.getSpeaker({actor: this.actor})
    });
  }

  /**
   * Show a tooltip to detail the poison application method selected.
   * @param {PointerEvent} event      The initiating hover event.
   */
  _showDeliveryMethodTooltip(event) {
    const method = event.currentTarget.closest(".form-group").querySelector("[data-action='delivery-method']").value;
    game.tooltip.activate(event.currentTarget, {text: game.i18n.localize(this.#methods[method].appendix)});
  }

  /**
   * Handle clicking a button to craft a specific item.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Actor}
   */
  async _onCraftingButton(event) {
    const select = event.currentTarget.closest(".item").querySelector(".scale-option");

    const idx = this.collection.get(event.currentTarget.closest("[data-item-id]").dataset.itemId);
    const itemData = game.items.fromCompendium(idx.item);
    const cost = idx.scales ? Number(select.value) : idx.cost;
    const formula = idx.scales ? idx.options[cost] : null;
    const hasDeliveryMethod = itemData.system.type.value === "poison";
    const method = hasDeliveryMethod ? event.currentTarget.closest(".tab").querySelector("[data-action='delivery-method']") : null;
    const methodCost = method ? this.#methods[method.value].cost : 0;
    const total = (cost || idx.cost) + methodCost;

    if (total > this.#materials) {
      ui.notifications.warn(game.i18n.format("ZHELL.CraftingMissingMaterials", {cost: total}));
      return null;
    }

    if (itemData.system.type.value === "poison") this._applyDeliveryMethod(itemData, method.value);

    // Replace damage formula and determine if the item should be stacked onto another item.
    if (formula) {
      const base = itemData.system.damage.parts[0][0];
      itemData.system.damage.parts[0][0] = formula;
      itemData.system.description.value = itemData.system.description.value.replace(base, formula);
    }
    const stack = this.actor.items.find(i => {
      return (i._stats.compendiumSource === itemData._stats.compendiumSource)
        && (i.system.description.value === itemData.system.description.value)
        && (!formula || (i.system.damage.parts[0][0] === formula))
        && (i.name === itemData.name);
    });

    let created;
    if (stack) {
      created = await stack.update({"system.quantity": stack.system.quantity + 1}, {render: false});
    } else {
      created = await Item.implementation.create(itemData, {parent: this.actor, render: false});
    }
    await ChatMessage.implementation.create({
      content: game.i18n.format("ZHELL.CraftingComplete", {name: this.actor.name, amount: total, link: created.link}),
      speaker: ChatMessage.implementation.getSpeaker({actor: this.actor})
    });

    return this.actor.update({[`flags.${MODULE}.materia-medica.value`]: this.#materials - total});
  }

  /**
   * Mutate poisons with delivery method, system data, name, and itemacro.
   * @param {object} itemData     The item data to mutate.
   * @param {string} method       The delivery method for the poison.
   */
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

  /*RENDERING METHODS */

  /** @override */
  _saveScrollPositions(html) {
    super._saveScrollPositions(html);
    this._selectPositions = {};
    html[0].querySelectorAll(".scale-option").forEach(s => {
      const id = s.closest("[data-item-id]").dataset.itemId;
      this._selectPositions[id] = s.value;
    });
    this._methodOption = html[0].querySelector("[data-action='delivery-method']")?.value;
    this._forageOption = html[0].querySelector("[data-action='forage-method']")?.value;
  }

  /** @override */
  _restoreScrollPositions(html) {
    super._restoreScrollPositions(html);

    for (const [id, value] of Object.entries(this._selectPositions ?? {})) {
      const select = html[0].querySelector(`[data-item-id="${id}"] .scale-option`);
      if (select && [...select.options].some(o => o.value === value)) select.value = value;
    }

    const method = html[0].querySelector("[data-action='delivery-method']");
    if (method && this._methodOption) method.value = this._methodOption;

    const forage = html[0].querySelector("[data-action='forage-method']");
    if (forage && this._forageOption) forage.value = this._forageOption;
  }

  /** @override */
  async render(...args) {
    this.actor.apps[this.appId] = this;
    return super.render(...args);
  }

  /** @override */
  async close(...args) {
    delete this.actor.apps[this.appId];
    return super.close(...args);
  }

  /** Create the character flag in Special Traits for speed crafting. */
  static init() {
    CONFIG.DND5E.characterFlags.speedCrafting = {
      name: "Speed Crafting",
      hint: game.i18n.localize("ZHELL.CraftingCharacterFlag"),
      section: "Feats",
      type: Boolean
    };
  }
}
