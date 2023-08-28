export class InventorySectionConfig extends FormApplication {
  constructor(actor) {
    super();
    this.actor = actor;
    this.clone = actor.clone({}, {keepId: true});
    this.path = "flags.zhell-custom-stuff.inventorySections";
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/inventory-section-config.hbs",
      height: "auto",
      width: 400
    });
  }

  get title() {
    return `Inventory Section Config: ${this.actor.name}`;
  }

  get id() {
    return `inventory-section-config-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  async getData() {
    const sections = foundry.utils.getProperty(this.clone, this.path) ?? [];
    return {sections: !sections.length ? [] : Array.from(new Set(sections))};
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[name]").forEach(n => {
      n.addEventListener("focus", e => e.currentTarget.select());
      n.addEventListener("change", this.updateClone.bind(this));
    });
  }

  async _updateObject() {
    const data = foundry.utils.getProperty(this.clone, this.path) ?? [];
    return this.actor.update({[this.path]: data.filter(label => label)});
  }

  updateClone() {
    let data = new FormDataExtended(this.form).object[this.path];
    data = typeof data === "string" ? [data] : data;
    const labels = new Set(data).reduce((acc, label) => {
      const trim = label?.trim();
      if (trim) acc.add(trim);
      return acc;
    }, new Set());
    this.clone.updateSource({[this.path]: Array.from(labels)});
    return this.render();
  }
}
