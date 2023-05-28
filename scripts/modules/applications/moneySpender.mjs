import {MODULE} from "../../const.mjs";

export class MoneySpender extends Application {
  constructor(options = {}, actor) {
    super(options);
    this.actor = actor;
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
   * The number of decimals, as a function of the conversion rate of currency.
   * @returns {number}      The number of decimals.
   */
  get precision() {
    const denom = this.element[0].querySelector("[data-action='change-denom']").dataset.denom;
    const conversion = CONFIG.DND5E.currencies[denom].conversion;
    return (conversion < 1) ? 3 : (conversion < 10) ? 2 : (conversion < 100) ? 1 : 0;
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.currencies = Object.entries(this.actor.system.currency).map(([label, value]) => {
      return {value, label};
    });
    return data;
  }

  /**
   * Change the displayed total to a new amount and new decimal position.
   */
  _displayTotal() {
    const node = this.element[0].querySelector("[data-action='change-denom']");
    const value = Number(node.dataset.value);
    const denom = node.dataset.denom;
    node.innerText = (value * CONFIG.DND5E.currencies[denom].conversion).toFixed(this.precision);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // up and down arrows.
    html[0].querySelectorAll("[data-action^='adjust']").forEach(n => n.addEventListener("click", this._onClickAdjustment.bind(this)));

    // save button.
    html[0].querySelector("[data-action='submit']").addEventListener("click", this._spendMoney.bind(this));

    // change denom.
    const node = html[0].querySelector("[data-action='change-denom']");
    ["click", "contextmenu"].forEach(type => node.addEventListener(type, this._changeDenomination.bind(this)));
  }

  /**
   * Adjust the currency total up or down when clicking the arrow anchors.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickAdjustment(event) {
    const adjustment = event.currentTarget.dataset.action;
    const currentNode = event.currentTarget.closest(".util").querySelector(".value");
    const currentValue = Number(currentNode.innerText.trim());
    const totNode = this.element[0].querySelector("[data-action='change-denom']");
    const totValue = Number(totNode.dataset.value);
    const cu = event.currentTarget.closest(".util").dataset.currency;

    if (adjustment === "adjust-up") {
      // adjust UP and ADD TO counter.
      const max = this.actor.system.currency[cu];
      const diff = event.ctrlKey ? Math.min(100, max - currentValue) : event.shiftKey ? Math.min(5, max - currentValue) : 1;
      if (currentValue + diff > max) return;
      const newTotal = totValue + diff / CONFIG.DND5E.currencies[cu].conversion;
      totNode.setAttribute("data-value", Number(newTotal).toFixed(2));
      this._displayTotal();
      currentNode.innerText = currentValue + diff;
    } else if (adjustment === "adjust-down") {
      // adjust DOWN and REMOVE FROM counter.
      const min = 0;
      const diff = event.ctrlKey ? Math.min(100, currentValue - min) : event.shiftKey ? Math.min(5, currentValue - min) : 1;
      if ((currentValue - diff) < min) return;
      const newTotal = totValue - diff / CONFIG.DND5E.currencies[cu].conversion;
      totNode.setAttribute("data-value", Number(newTotal).toFixed(2));
      this._displayTotal();
      currentNode.innerText = currentValue - diff;
    }
  }

  /**
   * Adjust the currencies on the actor with the values in this application.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Promise<Actor>}        The updated actor.
   */
  async _spendMoney(event) {
    const currency = this.actor.system.currency;
    const diffs = {};
    const update = {};
    this.element[0].querySelectorAll(".util").forEach(n => {
      const denom = n.dataset.currency;
      const spend = Number(n.querySelector(".value").innerText.trim());
      if (spend > 0) {
        diffs[denom] = spend;
        update[denom] = currency[denom] - spend;
      }
    });
    await this.close();
    if (!foundry.utils.isEmpty(diffs)) {
      const content = Object.entries(diffs).reduce((acc, [denom, spent]) => {
        return acc + `<br>${denom.toUpperCase()}: ${spent}`;
      }, `Spent some money:`);
      await ChatMessage.create({content, speaker: ChatMessage.getSpeaker({actor: this.actor})});
      return this.actor.update({"system.currency": update});
    }
  }

  /**
   * Change the denomination displayed.
   * @param {PointerEvent} event      The initiating click event.
   */
  _changeDenomination(event) {
    const value = event.currentTarget.dataset.denom;
    const denoms = Object.keys(CONFIG.DND5E.currencies);
    const idx = denoms.indexOf(value);
    const next = idx + ((event.type === "click") ? 1 : (denoms.length - 1));
    event.currentTarget.setAttribute("data-denom", denoms[next % denoms.length]);
    this._displayTotal();
  }
}
