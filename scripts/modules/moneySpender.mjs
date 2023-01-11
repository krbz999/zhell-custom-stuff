import { MODULE } from "../const.mjs";

export class MoneySpender extends Application {
  constructor(options = {}, actor) {
    super(options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      height: 300,
      classes: ["money-spender"],
      resizable: false,
      template: `modules/${MODULE}/templates/moneySpender.hbs`
    });
  }

  get title() {
    return `Expend Currency: ${this.actor.name}`;
  }

  get id() {
    return `${MODULE}-money-spender-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  get speedCrafting() {
    return !!this.actor.getFlag("dnd5e", "speedCrafting");
  }

  get precision() {
    const denom = this.element[0].querySelector(".total").dataset.denom;
    return { pp: 3, gp: 2, ep: 2, sp: 1, cp: 0 }[denom];
  }

  async getData() {
    const data = await super.getData();
    data.currencies = Object.entries(this.actor.system.currency).map(([label, value]) => {
      return { value, label };
    });
    return data;
  }

  _displayTotal() {
    const node = this.element[0].querySelector(".total");
    const value = Number(node.dataset.value);
    const denom = node.dataset.denom;
    node.innerText = (value * CONFIG.DND5E.currencies[denom].conversion).toFixed(this.precision);
  }

  activateListeners(html) {
    super.activateListeners(html);

    // up and down arrows.
    html[0].querySelectorAll(".adjust").forEach(node => {
      node.addEventListener("click", (event) => {
        const adjustment = event.currentTarget.dataset.adjustment;
        const currentNode = node.closest(".util").querySelector(".value");
        const currentValue = Number(currentNode.innerText.trim());
        const totNode = html[0].querySelector(".tally .total");
        const totValue = Number(totNode.dataset.value);
        const cu = node.closest(".util").dataset.currency;

        if (adjustment === "up") {
          // adjust UP and ADD TO counter.
          const max = this.actor.system.currency[cu];
          const diff = event.ctrlKey ? Math.min(100, max - currentValue) : event.shiftKey ? Math.min(5, max - currentValue) : 1;
          if (currentValue + diff > max) return;
          const newTotal = totValue + diff / CONFIG.DND5E.currencies[cu].conversion;
          totNode.setAttribute("data-value", Number(newTotal).toFixed(2));
          this._displayTotal();
          currentNode.innerText = currentValue + diff;
        } else if (adjustment === "down") {
          // adjust DOWN and REMOVE FROM counter.
          const min = 0;
          const diff = event.ctrlKey ? Math.min(100, currentValue - min) : event.shiftKey ? Math.min(5, currentValue - min) : 1;
          if (currentValue - diff < min) return;
          const newTotal = totValue - diff / CONFIG.DND5E.currencies[cu].conversion;
          totNode.setAttribute("data-value", Number(newTotal).toFixed(2));
          this._displayTotal();
          currentNode.innerText = currentValue - diff;
        }
      });
    });

    // save button.
    html[0].querySelector("button").addEventListener("click", async (event) => {
      // adjust currencies to new values.
      const currency = this.actor.system.currency;
      const diffs = {};
      const update = [...html[0].querySelectorAll(".util")].reduce((acc, n) => {
        const denom = n.dataset.currency;
        const spend = Number(n.querySelector(".value").innerText.trim());
        if (spend > 0) diffs[denom] = spend;
        acc[denom] = currency[denom] - spend;
        return acc;
      }, {});
      await this.actor.update({ "system.currency": update });
      this.close();
      if (!foundry.utils.isEmpty(diffs)) {
        const content = Object.entries(diffs).reduce((acc, [denom, spent]) => {
          return acc + `<br>${denom.toUpperCase()}: ${spent}`;
        }, `${this.actor.name} spent some money:`);
        return ChatMessage.create({ content, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
      }
    });

    // change denom.
    html[0].querySelector(".total").addEventListener("click", (event) => {
      const denom = event.currentTarget.dataset.denom;
      const newDenom = { pp: "gp", gp: "ep", ep: "sp", sp: "cp", cp: "pp" }[denom];
      event.currentTarget.setAttribute("data-denom", newDenom);
      this._displayTotal();
    });
  }
}
