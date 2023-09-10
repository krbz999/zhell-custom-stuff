export class TreasureCreator extends FormApplication {
  static FOLDER_UUIDS = {
    BARS: "Compendium.zhell-catalogs.items.Folder.ZqwLV5v9etJCJJJL",
    SPICES: "Compendium.zhell-catalogs.items.Folder.88AexCDtWyqlkxFz",
    TREASURES: {
      25: "Compendium.zhell-catalogs.items.Folder.zn7zE7rYhjMggm22",
      250: "Compendium.zhell-catalogs.items.Folder.NgE3uJoRxsBiaBxC",
      750: "Compendium.zhell-catalogs.items.Folder.3OY4QM06kZMz5J6c",
      2500: "Compendium.zhell-catalogs.items.Folder.RmXZJ48r0aJWnv47",
      7500: "Compendium.zhell-catalogs.items.Folder.uwvO3CyurM4anwTW",
    },
    GEMS: {
      10: "Compendium.zhell-catalogs.items.Folder.I0apG37UxncBKtpx",
      50: "Compendium.zhell-catalogs.items.Folder.nhBL6I3gb3Y0OGDi",
      100: "Compendium.zhell-catalogs.items.Folder.Y2fzr7t4vgtXsJFs",
      500: "Compendium.zhell-catalogs.items.Folder.H2aGHKLHEdTNrFyl",
      1000: "Compendium.zhell-catalogs.items.Folder.LJninyP7UWgAZ8NY",
      5000: "Compendium.zhell-catalogs.items.Folder.E2UT2GWsRYI00PqN",
    }
  };
  static LOOT_ACTOR = "xNTF7EBch9vSGJnB";
  static CURRENCIES = {
    0: {
      30: {cp: "5d6"},
      60: {sp: "4d6"},
      70: {ep: "3d6"},
      95: {gp: "3d6"},
      100: {pp: "1d6"}
    },
    5: {
      30: {cp: "4d6 * 100", ep: "1d6 * 10"},
      60: {sp: "6d6 * 10", gp: "2d6 * 10"},
      70: {ep: "3d6 * 10", gp: "2d6 * 10"},
      95: {gp: "4d6 * 10"},
      100: {gp: "2d6 * 10", pp: "3d6"}
    },
    11: {
      20: {sp: "4d6 * 100", gp: "1d6 * 100"},
      35: {ep: "1d6 * 100", gp: "1d6 * 100"},
      75: {gp: "2d6 * 100", pp: "1d6 * 10"},
      100: {gp: "2d6 * 100", pp: "2d6 * 10"}
    },
    17: {
      15: {ep: "2d6 * 1000", gp: "8d6 * 100"},
      55: {gp: "1d6 * 1000", pp: "1d6 * 100"},
      100: {gp: "1d6 * 1000", pp: "2d6 * 100"}
    }
  };

  // get an array of [{denom, roll}]
  async rollForCurrencies(cr, ep = true) {
    const table = TreasureCreator.CURRENCIES[cr];
    const roll = await new Roll("1d100").evaluate();
    // find the smallest of those that the roll is less than.
    const smallest = Object.keys(table).reduce((acc, val) => {
      val = Number(val);
      return ((roll.total > val) || !(val < acc)) ? acc : val;
    }, Infinity);
    this.currencies ??= {};
    for (const [denom, formula] of Object.entries(table[smallest])) {
      if (!ep && (denom === "ep")) continue;
      const roll = await new Roll(formula).evaluate();
      this.currencies[denom] ??= 0;
      this.currencies[denom] += roll.total;
    }
    this.render();
  }

  // return a single item.
  async rollForBars() {
    const folder = await fromUuid(TreasureCreator.FOLDER_UUIDS.BARS);
    const items = await Promise.all(folder.contents.map(c => fromUuid(c.uuid)));
    return items[Math.floor(Math.random() * items.length)];
  }

  // returns a single item.
  async rollForGems(uuid) {
    const folder = await fromUuid(uuid);
    const items = await Promise.all(folder.contents.map(c => fromUuid(c.uuid)));
    return items[Math.floor(Math.random() * items.length)];
  }

  // returns a single item.
  async rollForSpices() {
    const folder = await fromUuid(TreasureCreator.FOLDER_UUIDS.SPICES);
    const items = await Promise.all(folder.contents.map(c => fromUuid(c.uuid)));
    return items[Math.floor(Math.random() * items.length)];
  }

  // returns a single item.
  async rollForTreasures(uuid) {
    const folder = await fromUuid(uuid);
    const items = await Promise.all(folder.contents.map(c => fromUuid(c.uuid)));
    return items[Math.floor(Math.random() * items.length)];
  }

  constructor() {
    super();
    this.model = new (class Model extends foundry.abstract.DataModel {
      static defineSchema() {
        return {
          gems: new foundry.data.fields.SchemaField({
            selected: new foundry.data.fields.StringField({
              initial: Object.values(TreasureCreator.FOLDER_UUIDS.GEMS)[0]
            })
          }),
          treasures: new foundry.data.fields.SchemaField({
            selected: new foundry.data.fields.StringField({
              initial: Object.values(TreasureCreator.FOLDER_UUIDS.TREASURES)[0]
            })
          }),
          currencies: new foundry.data.fields.SchemaField({
            selected: new foundry.data.fields.StringField({
              initial: Object.keys(TreasureCreator.CURRENCIES)[0]
            }),
            allowElectrum: new foundry.data.fields.BooleanField({initial: true})
          })
        };
      }
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/treasure-creator.hbs",
      closeOnSubmit: false,
      submitOnChange: true,
      title: "Treasure Creator",
      width: 500,
      height: "auto",
      classes: ["zhell-custom-stuff", "treasure-creator", "dnd5e"],
      id: "treasure-creator",
      scrollY: [".loot"]
    });
  }

  static async create() {
    return new this().render(true);
  }

  async _updateObject(event, formData) {
    this.model.updateSource(formData);
    this.render();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("[data-action=submit]").addEventListener("click", this.submit.bind(this));
    html[0].querySelectorAll("[data-action=roll]").forEach(n => n.addEventListener("click", this.onClickRoll.bind(this)));
    html[0].querySelectorAll("[data-action=render]").forEach(n => n.addEventListener("click", this.onRender.bind(this)));
  }

  async getData() {
    const keys = Object.keys(TreasureCreator.CURRENCIES);
    const items = this.items ??= [];
    const config = CONFIG.DND5E.currencies;

    return {
      model: this.model,
      context: {
        gems: Object.entries(TreasureCreator.FOLDER_UUIDS.GEMS).reduce((acc, [gp, uuid]) => {
          acc[uuid] = `${gp} Gold`;
          return acc;
        }, {}),
        treasures: Object.entries(TreasureCreator.FOLDER_UUIDS.TREASURES).reduce((acc, [gp, uuid]) => {
          acc[uuid] = `${gp} Gold`;
          return acc;
        }, {}),
        currencies: keys.reduce((acc, key, idx) => {
          acc[key] = keys[idx + 1] ? `CR ${key}--${keys[idx + 1]}` : `CR ${key}+`;
          return acc;
        }, {})
      },
      items: items.map(i => {
        const price = i.item.system.price;
        return {
          item: i.item,
          quantity: i.quantity,
          label: `${price.value} ${config[price.denomination].label}`
        };
      }).sort((a, b) => a.item.name.localeCompare(b.item.name)),
      currencies: Object.entries(this.currencies ?? {}).map(([denom, amount]) => {
        const label = config[denom].label;
        return {denom, label, amount};
      }).sort((a, b) => {
        return config[a.denom].conversion - config[b.denom].conversion;
      })
    };
  }

  async onRender(event) {
    const item = await fromUuid(event.currentTarget.dataset.uuid);
    return item.sheet.render(true);
  }

  async onClickRoll(event) {
    const type = event.currentTarget.dataset.type;
    let item;
    if (type === "currencies") return this.rollForCurrencies(this.model.currencies.selected, this.model.currencies.allowElectrum);
    else if (type === "bars") item = await this.rollForBars();
    else if (type === "gems") item = await this.rollForGems(this.model.gems.selected);
    else if (type === "spices") item = await this.rollForSpices();
    else if (type === "treasures") item = await this.rollForTreasures(this.model.treasures.selected);
    if (!item) {
      ui.notifications.warn("No item somehow.");
      return null;
    }

    const exist = this.items.find(e => e.item === item);
    if (exist) exist.quantity++;
    else this.items.push({item: item, quantity: 1});
    this.render();
  }

  async submit() {
    this.close();
    console.warn({items: this.items, currencies: this.currencies});

    const actor = game.actors.get(TreasureCreator.LOOT_ACTOR);

    const itemUpdates = [];
    const itemCreates = [];
    const actorUpdates = {};

    for (const {item, quantity} of this.items) {
      const exist = actor.items.find(e => e.flags.core?.sourceId === item.uuid);
      if (exist) {
        itemUpdates.push({_id: exist.id, "system.quantity": exist.system.quantity + quantity});
      } else {
        const itemData = game.items.fromCompendium(item);
        itemData.system.quantity = quantity;
        itemCreates.push(itemData);
      }
    }
    for (const [key, value] of Object.entries(this.currencies ?? {})) {
      actorUpdates[`system.currency.${key}`] = actor.system.currency[key] + value;
    }

    await Promise.all([
      actor.updateEmbeddedDocuments("Item", itemUpdates),
      actor.createEmbeddedDocuments("Item", itemCreates),
      actor.update(actorUpdates)
    ]);
    return ZHELL.utils.awardLoot({backpackUuid: actor.uuid});
  }
}
