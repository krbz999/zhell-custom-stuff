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

  get conversion() {
    // convert from 'denom' to another currency:
    const denom = this.element[0].querySelector(".total").dataset.denom;
    if (denom === "pp") return { pp: 1, gp: 0.1, ep: 0.05, sp: 0.01, cp: 0.001 };
    else if (denom === "gp") return { pp: 10, gp: 1, ep: 0.5, sp: 0.1, cp: 0.01 };
    else if (denom === "ep") return { pp: 20, gp: 2, ep: 1, sp: 0.2, cp: 0.02 };
    else if (denom === "sp") return { pp: 100, gp: 10, ep: 5, sp: 1, cp: 0.1 };
    else if (denom === "cp") return { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
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

  activateListeners(html) {
    super.activateListeners(html);

    // up and down arrows.
    html[0].querySelectorAll(".adjust").forEach(node => {
      node.addEventListener("click", (event) => {
        const adjustment = event.currentTarget.dataset.adjustment;
        const currentNode = node.closest(".util").querySelector(".value");
        const currentValue = Number(currentNode.innerText.trim());
        const totNode = html[0].querySelector(".tally .total");
        const totValue = Number(totNode.innerText.trim());
        const cu = node.closest(".util").dataset.currency;
        if (adjustment === "up") {
          // adjust UP and ADD TO counter.
          const max = this.actor.system.currency[cu];
          const diff = event.ctrlKey ? Math.min(100, max - currentValue) : event.shiftKey ? Math.min(5, max - currentValue) : 1;
          const newVal = currentValue + diff;
          if (newVal > max) return;
          currentNode.innerText = newVal;
          totNode.innerText = (totValue + this.conversion[cu] * diff).toFixed(this.precision);
        } else if (adjustment === "down") {
          // adjust DOWN and REMOVE FROM counter.
          const min = 0;
          const diff = event.ctrlKey ? Math.min(100, currentValue - min) : event.shiftKey ? Math.min(5, currentValue - min) : 1;
          const newVal = currentValue - diff;
          if (newVal < min) return;
          currentNode.innerText = newVal;
          totNode.innerText = (totValue - this.conversion[cu] * diff).toFixed(this.precision);
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
      const tot = event.currentTarget(".total");
      const curr = tot.dataset.denom;
      const den = { pp: "gp", gp: "ep", ep: "sp", sp: "cp", cp: "pp" }[curr];
      tot.setAttribute("data-denom", den);
      const value = Number(tot.innerText.trim());
      const newVal = value * { pp: 10, gp: 2, ep: 5, sp: 10, cp: 0.001 }[curr];
      tot.innerText = newVal.toFixed(this.precision);
    });
  }
}
