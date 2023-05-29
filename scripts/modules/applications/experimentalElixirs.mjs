import {DEPEND, MODULE} from "../../const.mjs";

export class ExperimentalElixir extends Application {
  /**
   * @constructor
   * @param {Actor} actor         The actor using the item.
   * @param {Item} item           The item being used.
   * @param {object} speaker      The speaker object from Item Macro, for convenience.
   */
  constructor({actor, item, speaker}) {
    super({actor, item, speaker});
    this.actor = actor;
    this.item = item;
    this.rollData = this.actor.getRollData();
    this.speaker = speaker;

    for (const [key, data] of Object.entries(this.actor.system.spells)) {
      if (!(data.value > 0)) continue;
      const level = (key === "pact") ? data.level : Number(key.at(-1));
      this.maxLevel = Math.max(this.maxLevel ?? 0, level);
    }
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/experimentalElixirs.hbs",
      title: "Experimental Elixir",
      classes: [MODULE, "experimental-elixir"]
    });
  }

  /** @override */
  get id() {
    return `${this.actor.uuid.replaceAll(".", "-")}-experimental-elixir`;
  }

  /**
   * The diff data of each elixir type.
   * @returns {object}      The data, divided by type.
   */
  get elixirTypes() {
    return {
      alacrity: {
        name: "Alacrity",
        data: {
          changes: [{key: "system.attributes.init.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d8"}],
          duration: {seconds: 60},
          icon: "icons/magic/movement/trail-streak-zigzag-yellow.webp"
        }
      },
      boldness: {
        name: "Boldness",
        data: {
          changes: ["mwak.attack", "rwak.attack", "msak.attack", "rsak.attack", "abilities.save"].map(prop => {
            return {key: `system.bonuses.${prop}`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4"};
          }),
          duration: {seconds: 60},
          icon: "icons/magic/movement/trail-streak-pink.webp"
        }
      },
      flight: {
        name: "Flight",
        data: {
          changes: [{key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 10}],
          duration: {seconds: 600},
          icon: "icons/magic/movement/trail-streak-impact-blue.webp"
        }
      },
      healing: {
        name: "Healing",
        data: {}
      },
      resilience: {
        name: "Resilience",
        data: {
          changes: [{key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1"}],
          duration: {seconds: 600},
          icon: "icons/magic/defensive/shield-barrier-blue.webp"
        }
      },
      swiftness: {
        name: "Swiftness",
        data: {
          changes: [{key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 10}],
          duration: {seconds: 3600},
          icon: "icons/magic/movement/pinwheel-turning-blue.webp"
        }
      },
      transformation: {
        name: "Transformation",
        data: {
          changes: [],
          duration: {seconds: 600},
          icon: "icons/magic/movement/abstract-ribbons-red-orange.webp"
        }
      }
    };
  }

  /**
   * Get a random name for an elixir.
   * @returns {string}      The random name.
   */
  _getRandomName() {
    const randomName = [
      "Arepoan Picnic Drink",
      "Arkonade",
      "Arkorow's Party Mix",
      "Cantina d'Capitol Special",
      "Daily Pick-Me-Up",
      "Dockyard Iced Tea",
      "Everything but Jungle Juice",
      "Fiendbolt Cola",
      "Green Tree's Mix",
      "Murharbor Special",
      "Rainbow Elixir",
      "Rumble Refreshment",
      "Something-ade",
      "Sunny Capital"
    ];
    return `Experimental Elixir: ${randomName[Math.floor(Math.random() * randomName.length)]}`;
  }

  /**
   * Get a random piece of flavor text for an elixir.
   * @returns {string}      The flavor text.
   */
  _getRandomFlavor() {
    const randomFlavor = [
      "Apples and oranges really are basically the same when juiced, right?",
      "Boss taught me how to make this one.",
      "Err... this one came out kind of thick, sorry.",
      "I added some extra ice to this one.",
      "I found a way to boil it like a tea!",
      "I'll be honest, I don't really remember what's in this one.",
      "Ignore the odd smokey flavor to this one; not sure how that happened.",
      "Now pulp free!",
      "Now with double pulp!",
      "Oh hey! This one could be a pretty good Margherita!",
      "Oh yikes! I'm pretty sure this one can double as a rubbing alcohol.",
      "Okay, YES, the rats refused to drink this one but I'm sure it's fine!",
      "Oooo, this one's glowing!",
      "This one has... a lot of sugar in it, sorry.",
      "This one kind of tastes like a good night's sleep. Super confused on how that worked out.",
      "This one's blue-raspberry. Not sure what the 'blue' flavor is caused by but it's DEFINITELY blue.",
      "This one's grape flavored!",
      "This one's Pina Colada.",
      "This one's strawberry!"
    ];
    return randomFlavor[Math.floor(Math.random() * randomFlavor.length)];
  }

  /**
   * Get a random image for an elixir using the default potion images.
   * @returns {Promise<string>}     The image.
   */
  async _getRandomImage() {
    const {files} = await FilePicker.browse("public", "icons/consumables/potions");
    return files[Math.floor(Math.random() * files.length)];
  }

  /**
   * Create the array of effects for the elixir.
   * @param {string[]} types      The types of elixirs.
   * @returns {object[]}          The array of effect data.
   */
  _getEffectData(types) {
    const mod = this.rollData.abilities.int.mod;
    return types.reduce((acc, type) => {
      const {data, name} = this.elixirTypes[type];
      if (data.changes) {
        acc.push({
          changes: data.changes,
          transfer: false,
          icon: data.icon,
          duration: data.duration,
          name: `Experimental Elixir: ${name}`,
          description: game.i18n.format(`ZHELL.ExperimentalElixirType${name}`, {mod}),
          flags: {[DEPEND.ET]: {transferBlock: {button: false, chat: false, displayCard: false}}}
        });
      }
      return acc;
    }, []);
  }

  /**
   * Construct the 'damage' parts for the elixir.
   * @param {string[]} types      The types of elixirs.
   * @returns {array[]}           The array of damage types.
   */
  _getDamageParts(types) {
    const rollData = this.rollData;
    const parts = [];

    // If the potion heals...
    if (types.includes("healing")) {
      parts.push([`2d4 + ${rollData.abilities.int.mod}`, "healing"]);
    }

    // If the artificer is 9th level or higher, the elixir also adds temp hp.
    if (rollData.classes.artificer.levels >= 9) {
      parts.push([`2d6 + ${rollData.abilities.int.mod}`, "temphp"]);
    }

    return parts;
  }

  /**
   * Create the rollgroups flag data depending on the size of the damage parts of the elixir.
   * @param {array[]} parts     The elixir damage parts.
   * @returns {object}          The flag data.
   */
  _getFlagData(parts) {
    const flags = {[MODULE]: {longRestDestroy: true}};
    if (parts.length > 1) {
      flags.rollgroups = {
        config: {
          groups: [
            {parts: [0], label: "Healing"},
            {parts: [1], label: "Temporary HP"}
          ]
        }
      };
    }
    return flags;
  }

  /**
   * Create the description of the elixir, keeping in mind the 9th level feature.
   * @param {string[]} types      The types of elixirs.
   * @returns {string}            The description.
   */
  _getDescription(types) {
    const mod = this.rollData.abilities.int.mod;
    let desc = types.reduce((acc, type) => {
      const data = this.elixirTypes[type];
      const intro = game.i18n.format(`ZHELL.ExperimentalElixirType${type.capitalize()}`, {mod});
      return acc + `<p><strong><em>${data.name}.</em></strong> ${intro}</p>`;
    }, "");
    if (this.rollData.classes.artificer.levels >= 9) {
      const name = "Restorative Reagents";
      const intro = game.i18n.format("ZHELL.ExperimentalElixirTypeRestorativeReagents", {mod});
      desc += `<p><strong><em>${name}.</em></strong> ${intro}</p>`;
    }
    return desc;
  }

  /**
   * Get data for an elixir.
   * @param {string[]} types          The types of elixir.
   * @returns {Promise<object[]>}     An array of item data for the elixir.
   */
  async getElixirItemData(types) {
    const flavor = this._getRandomFlavor();
    const parts = this._getDamageParts(types);
    const desc = this._getDescription(types);

    return [{
      name: this._getRandomName(),
      type: "consumable",
      img: await this._getRandomImage(),
      system: {
        description: {value: `<p><em>${flavor}</em></p> <hr> ${desc}`},
        weight: 0.5,
        activation: {type: "action", cost: 1},
        uses: {value: 1, max: 1, per: "charges", autoDestroy: true},
        consumableType: "elixir",
        damage: {parts},
        actionType: parts.length > 0 ? "heal" : ""
      },
      effects: this._getEffectData(types),
      flags: this._getFlagData(parts)
    }];
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.mod = this.rollData.abilities.int.mod;
    data.elixirs = [];
    for (const [key, value] of Object.entries(this.elixirTypes)) {
      data.elixirs.push({
        key,
        name: value.name,
        intro: `ZHELL.ExperimentalElixirType${value.name}`
      });
    }
    return data;
  }

  /** @override */
  activateListeners(html) {
    html[0].querySelector("[data-action='submit']").addEventListener("click", this._onSubmit.bind(this));
    html[0].querySelectorAll("[type='checkbox']").forEach(n => {
      n.addEventListener("change", this._onChangeCheckbox.bind(this));
    });
  }

  /**
   * Gather the checked boxes to get the elixir types, then create the elixir.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Promise<Item[]>}       The array with the created elixir.
   */
  async _onSubmit(event) {
    const types = [];
    this.element[0].querySelectorAll("input:checked").forEach(input => types.push(input.value));
    if (!types.length.between(1, this.maxLevel)) {
      ui.notifications.warn(game.i18n.format("ZHELL.ExperimentalElixirBoundedWarning", {max: this.maxLevel}));
    } else {
      await this.close();
      const data = await this.getElixirItemData(types);
      const value = this.actor.system.spells[`spell${types.length}`].value;
      await this.actor.update({[`system.spells.spell${types.length}.value`]: value - 1});
      await ChatMessage.create({
        speaker: this.speaker,
        content: game.i18n.format("ZHELL.ExperimentalElixirExpendedSlots", {
          name: this.actor.name, level: CONFIG.DND5E.spellLevels[types.length]
        })
      });
      return this.actor.createEmbeddedDocuments("Item", data);
    }
  }

  /**
   * Uncheck the first (or second) checkbox if the user checks too many.
   * @param {ChangeEvent} event      The initiating change event.
   */
  _onChangeCheckbox(event) {
    const target = event.currentTarget;
    const checked = this.element[0].querySelectorAll("input:checked");
    const tooMany = checked.length > this.maxLevel;
    if (tooMany) Array.from(checked).find(c => c !== target).checked = false;
    const button = this.element[0].querySelector("[data-action='submit']");
    const _checked = this.element[0].querySelectorAll("input:checked");
    button.disabled = !(this.actor.system.spells[`spell${_checked.length}`]?.value > 0);
    if (button.disabled) {
      const string = !_checked.length ? "PickAtLeastOne" : "NoSpellSlot"
      button.setAttribute("data-tooltip", `ZHELL.ExperimentalElixir${string}`);
    }
    else button.removeAttribute("data-tooltip");
  }

  /**
   * Create one or more random elixirs, each with just one effect.
   * @returns {Promise<Item[]>}     The created elixirs.
   */
  async experiment() {
    const value = this.item.system.uses.value;
    if (value < 1) {
      ui.notifications.warn(game.i18n.format("DND5E.ItemNoUses", {name: this.item.name}));
      return;
    }
    const roll = await new Roll("(@scale.alchemist.elixirs)d8x8rr8", this.rollData).evaluate();
    await roll.toMessage({
      speaker: this.speaker,
      flavor: game.i18n.format("ZHELL.ExperimentalElixirRollRandom", {name: this.actor.name})
    });
    const keys = Object.keys(this.elixirTypes);
    const types = roll.dice[0].results.filter(i => i.active).map(i => keys[i.result - 1]);
    const data = [];
    for (const type of types) {
      const [elix] = await this.getElixirItemData([type]);
      data.push(elix);
    }
    await ChatMessage.create({
      speaker: this.speaker,
      content: game.i18n.format("ZHELL.ExperimentalElixirCreatedRandomElixirs", {
        name: this.actor.name, n: data.length
      })
    });
    await this.item.update({"system.uses.value": value - 1});
    return this.actor.createEmbeddedDocuments("Item", data);
  }
}
