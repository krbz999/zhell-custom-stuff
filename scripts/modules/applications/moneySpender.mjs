import {MODULE} from "../../const.mjs";

export class MoneySpender extends Application {
  constructor(actor, config = {}) {
    super();
    this.actor = actor;
    this.clone = actor.clone({}, {keepId: true});
    this.config = config;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      height: 300,
      classes: [MODULE, "money-spender"],
      resizable: false,
      template: `modules/${MODULE}/templates/moneySpender.hbs`
    });
  }

  /** @override */
  get title() {
    return `Expend Currency: ${this.actor.name}`;
  }

  /** @override */
  get id() {
    return `${MODULE}-money-spender-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  /**
   * The key of the default currency, which is the config entry with conversion rate 1.
   * @returns {string}
   */
  get defaultDenomination() {
    const [key] = Object.entries(CONFIG.DND5E.currencies).find(c => c[1].conversion === 1);
    return key;
  }

  /** @override */
  async getData() {
    const config = CONFIG.DND5E.currencies;
    const data = await super.getData();

    data.denom = this.denom ??= this.defaultDenomination;
    data.inBase = 0;
    data.currencies = Object.keys(this.clone.system.currency).map(key => {
      const remaining = this.clone.system.currency[key];
      const spent = this.actor.system.currency[key] - remaining;
      if (config[key].conversion) data.inBase += spent / config[key].conversion;
      return {
        ...config[key],
        key,
        remaining,
        spent,
        disableUp: remaining === 0,
        disableDown: spent === 0
      };
    }).sort((a, b) => {
      return config[a.key].conversion - config[b.key].conversion;
    });

    const conv = config[this.denom].conversion;
    const precision = (conv < 1) ? 3 : (conv < 10) ? 2 : (conv < 100) ? 1 : 0;
    data.displayValue = (data.inBase * conv).toFixed(precision);
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Adjust currency up and down.
    html[0].querySelectorAll("[data-action=adjust]").forEach(n => {
      n.addEventListener("click", this._onClickAdjustment.bind(this));
    });

    // Save button.
    html[0].querySelector("[data-action=submit]").addEventListener("click", this._spendMoney.bind(this));

    // Cycle displayed denomination.
    const node = this.node = html[0].querySelector("[data-action='change-denom']");
    ["click", "contextmenu"].forEach(type => node.addEventListener(type, this._changeDenomination.bind(this)));

    // Set displayed denomination.
    html[0].querySelectorAll("[data-action='set-denom']").forEach(n => {
      n.addEventListener("click", this._onSetDenomination.bind(this));
    });
  }

  /**
   * Adjust the currency total up or down when clicking the arrow anchors.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickAdjustment(event) {
    const denom = event.currentTarget.closest("[data-denom]").dataset.denom;
    const diff = (event.ctrlKey ? 100 : event.shiftKey ? 5 : 1) * Number(event.currentTarget.dataset.dir);
    const oldValue = this.clone.system.currency[denom];
    const newValue = Math.clamped(oldValue - diff, 0, this.actor.system.currency[denom]);
    this.clone.updateSource({[`system.currency.${denom}`]: newValue});
    this.render();
  }

  /**
   * Adjust the currencies on the actor with the values in this application.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Promise<Actor>}        The updated actor.
   */
  async _spendMoney(event) {
    const currency = this.actor.system.currency;
    const update = foundry.utils.deepClone(this.clone.system.currency);
    const {diffs, content} = Object.entries(update).reduce((acc, [key, value]) => {
      const spend = currency[key] - value;
      if (spend > 0) {
        acc.diffs[key] = spend;
        acc.content += `<br>${CONFIG.DND5E.currencies[key].label}: ${spend}`;
      }
      return acc;
    }, {diffs: {}, content: "Spent some money:"});
    this.close();
    if (foundry.utils.isEmpty(diffs)) return;
    await ChatMessage.create({
      content: content,
      speaker: ChatMessage.getSpeaker({actor: this.actor})
    });
    return this.actor.update({"system.currency": update});
  }

  /**
   * Change the denomination displayed.
   * @param {PointerEvent} event      The initiating click event.
   */
  _changeDenomination(event) {
    const denoms = Object.keys(CONFIG.DND5E.currencies);
    const idx = denoms.indexOf(this.denom ??= this.defaultDenomination);
    const next = idx + ((event.type === "click") ? 1 : (denoms.length - 1));
    this.denom = denoms[next % denoms.length];
    return this.render();
  }

  /**
   * Set denomination to a specific value.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onSetDenomination(event) {
    this.denom = event.currentTarget.closest("[data-denom]").dataset.denom;
    return this.render();
  }
}
