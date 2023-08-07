export class SlotRecoverer extends FormApplication {
  /**
   * @constructor
   *
   * @param {Actor} actor                           The actor to recover spell slots.
   * @param {boolean} [valueEqualToLevel=true]      Whether the value of a slot should be equal to its level, otherwise 1.
   * @param {number} [maxLevel=Infinity]            The maximum level a spell slot can be.
   * @param {number} [minLevel=1]                   The minimum level a spell slot can be.
   * @param {number} [maxValue=1]                   The maximum combined value of the slots to recover.
   */
  constructor(actor, {valueEqualToLevel = true, maxLevel = Infinity, minLevel = 1, maxValue = 1} = {}) {
    super(actor);
    this.clone = actor.clone({}, {keepId: true});
    this.actor = actor;

    this.valueEqualToLevel = valueEqualToLevel;
    this.maxLevel = maxLevel;
    this.minLevel = minLevel;
    this.maxValue = maxValue;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/slotRecoverer.hbs",
      title: "Recover Spell Slots"
    });
  }

  /** @override */
  async getData() {
    const levels = this.constructor.#getLevels(this.actor, {
      valueEqualToLevel: this.valueEqualToLevel,
      maxLevel: this.maxLevel,
      minLevel: this.minLevel,
      maxValue: this.maxValue
    });

    let recovered = 0;
    for (const level of levels) {
      level.value = Math.clamped(this.clone.system.spells[level.key].value, level.min, level.max);
      level.disableLeft = level.value === level.min;
      level.disableRight = level.value === level.max;
      recovered += (level.value - level.min) * (this.valueEqualToLevel ? level.level : 1);
    }
    levels.sort((a, b) => a.label.localeCompare(b.label));
    return {
      levels,
      recovered,
      max: this.maxValue,
      overMax: recovered > this.maxValue
    };
  }

  /**
   * Get the array of spell slot levels valid for this configuration.
   * @param {Actor} actor       The actor with spell slots.
   * @param {object} config     Properties that adjust the validity of spell levels.
   * @returns {object[]}
   * @private
   */
  static #getLevels(actor, config) {
    return Object.entries(actor.system.spells).reduce((acc, [key, data]) => {
      if (data.value >= data.max) return acc;
      const level = (key === "pact") ? data.level : Number(key.at(-1));
      if (level > config.maxLevel) return acc;
      if (level < config.minLevel) return acc;
      const value = config.valueEqualToLevel ? level : 1;
      if (value > config.maxValue) return acc;
      acc.push({
        min: data.value,
        max: data.max,
        label: (key === "pact") ? "Pact Slots" : CONFIG.DND5E.spellLevels[key.at(-1)],
        level: level,
        key,
        name: `system.spells.${key}.value`
      });
      return acc;
    }, []);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    this.form.querySelectorAll("[data-adjust]").forEach(n => {
      n.addEventListener("click", this.adjust.bind(this));
    });
  }

  /**
   * Handle clicking a button to adjust the input value.
   * @param {PointerEvent} event      The initiating click event.
   */
  adjust(event) {
    const key = event.currentTarget.dataset.key;
    const diff = {up: 1, down: -1}[event.currentTarget.dataset.adjust];
    const update = new FormDataExtended(this.form).object;
    update[`system.spells.${key}.value`] += diff;
    this.clone.updateSource(update);
    this.render();
  }

  /** @override */
  async _updateObject(event, formData) {
    return this.actor.update(formData);
  }

  /** @override */
  async _onChangeInput(event) {
    await super._onChangeInput(event);
    const update = new FormDataExtended(this.form).object;
    this.clone.updateSource(update);
    this.render();
  }

  /**
   * Is this actor missing any spell slots?
   * @param {Actor} actor     The actor to check for missing spell slots.
   * @param {boolean} [valueEqualToLevel=true]      Whether the value of a slot should be equal to its level, otherwise 1.
   * @param {number} [maxLevel=Infinity]            The maximum level a spell slot can be.
   * @param {number} [minLevel=1]                   The minimum level a spell slot can be.
   * @param {number} [maxValue=1]                   The maximum combined value of the slots to recover.
   */
  static missingSlots(actor, {valueEqualToLevel = true, maxLevel = Infinity, minLevel = 1, maxValue = 1} = {}) {
    const levels = this.#getLevels(actor, {valueEqualToLevel, maxLevel, minLevel, maxValue});
    return levels.length > 0;
  }
}
