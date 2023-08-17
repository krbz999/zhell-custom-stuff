import {MODULE} from "../../const.mjs";

export class MurkScroller extends Application {
  constructor(options) {
    super();
    this.actor = options.actor;
    this.max = options.max;
    this.itemIds = [null];
    this.callback = options.callback;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [MODULE, "murk-scroller"],
      template: "modules/zhell-custom-stuff/templates/murkScroller.hbs",
      title: "Murk Scrolls"
    });
  }

  get id() {
    return `murk-scrolls-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  /** @override */
  async getData() {
    const data = await super.getData();

    data.optgroups = this.actor.items.reduce((acc, item) => {
      if (item.type !== "spell") return acc;
      if (!item.system.level.between(1, 5)) return acc;
      if (item.system.activation.type !== "action") return acc;
      acc[item.system.level] ??= {items: [], label: CONFIG.DND5E.spellLevels[item.system.level]};
      acc[item.system.level].items.push(item);
      return acc;
    }, {});

    data.max = Number.isNumeric(this.max) ? Number(this.max) : Math.ceil(this.actor.system.details.level / 2);
    data.total = this.itemIds.reduce((acc, id) => acc + (this.actor.items.get(id)?.system.level ?? 0), 0);
    data.disableSubmit = !data.total || !data.max || (data.total > data.max);

    // Allow for pushing 'null' into the item ids array.
    data.selects = this.itemIds.map((id, idx) => {
      const item = this.actor.items.get(id);
      const tooltip = item ? item.system.description.value : null;
      return {selected: id, optgroups: data.optgroups, tooltip, idx};
    });

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action]").forEach(n => {
      const action = n.dataset.action;
      switch (action) {
        case "spell-select":
          n.addEventListener("change", this.onChange.bind(this));
          break;
        case "add-row":
          n.addEventListener("click", this.addRow.bind(this));
          break;
        case "delete":
          n.addEventListener("click", this.deleteRow.bind(this));
          break;
        case "submit":
          n.addEventListener("click", this.submit.bind(this));
          break;
      }
    });
  }

  /**
   * Handle changing the value of a select.
   * @param {PointerEvent} event      The initiating change event.
   */
  onChange(event) {
    const idx = event.currentTarget.closest("[data-idx]").dataset.idx;
    const id = event.currentTarget.value || null;
    this.itemIds[idx] = id;
    this.render();
  }

  /**
   * Handling addition of a row.
   * @param {PointerEvent} event      The initiating click event.
   */
  addRow(event) {
    this.itemIds.push(null);
    this.render();
  }

  /**
   * Handle removal of a row.
   * @param {PointerEvent} event      The initiating click event.
   */
  deleteRow(event) {
    const idx = event.currentTarget.closest("[data-idx]").dataset.idx;
    this.itemIds.splice(idx, 1);
    this.render();
  }

  /**
   * Handle clicking the finalize button.
   * @param {PointerEvent} event      The initiating click event.
   */
  submit(event) {
    const ids = this.itemIds.filter(id => this.actor.items.get(id));
    if (this.callback instanceof Function) this.callback(ids);
    this.close();
  }

  /** @override */
  async close() {
    if (this.callback instanceof Function) this.callback(null);
    return super.close();
  }

  /**
   * Create an instance of this application and wait for the callback.
   * @param {object} config
   * @param {Actor} config.actor          The actor who has the spells.
   * @param {number} [config.max]         The maximum combined level, otherwise half character level rounded up.
   * @returns {Promise<object|null>}      An object of item ids, or null if closed.
   */
  static async wait(config) {
    return new Promise(resolve => {
      new this({...config, callback: resolve}).render(true);
    });
  }
}
