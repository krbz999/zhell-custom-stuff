// Roll a monetary value using Individual or Hoard formula, then convert to gem stones or
// art objects depending on the treasure theme. If hoard, also draw a number of magic items
// re-drawing the rarity for each item.

export default class RandomTreasure extends foundry.applications.api.Dialog {
  static THEME_OPTIONS = {
    arcana: {
      get label() {
        return CONFIG.DND5E.treasure.arcana.label
       },
      types: new Set(["gemStones"]),
    },
    armaments: {
      get label() {
        return CONFIG.DND5E.treasure.armaments.label,
      },
      types: new Set(["coins", "tradeBars"]),
    },
    implements: {
      get label() {
        return CONFIG.DND5E.treasure.implements.label;
      },
      types: new Set(["coins", "tradeBars", "tradeGoods"]),
    },
    relics: {
      get label() {
        return CONFIG.DND5E.treasure.relics.label
      },
      types: new Set(["artObjects"]),
    }
  };

  /* -------------------------------------------------- */

  // The DMG has these recorded as gp or pp, but converted to gp here.
  static INDIVIDUAL_REWARDS = {
    0: {
      monetary: "3d6",
      items: "0"
    },
    5: {
      monetary: "2d8 * 10",
      items: "0"
    },
    11: {
      monetary: "2d10 * 100",
      items: "0"
    },
    17: {
      monetary: "2d8 * 1000",
      items: "0"
    },
  };

  /* -------------------------------------------------- */

  static HOARD_REWARDS = {
    0: {
      monetary: "2d4 * 100",
      items: "1d4 - 1",
    },
    5: {
      monetary: "8d10 * 100",
      items: "1d3",
    },
    11: {
      monetary: "8d8 * 10000",
      items: "1d4",
    },
    17: {
      monetary: "6d10 * 10000",
      items: "1d6",
    },
  };

  /* -------------------------------------------------- */

  static RARITY_TABLES = {
    1: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg14RandomMagic",
    5: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg510RandomMagi",
    11: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg1116RandomMag",
    17: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg1720RandomMag",
  };

  /* -------------------------------------------------- */

  static GEMSTONE_TABLES = {
    10: "Compendium.zhell-catalogs.rolltables.RollTable.ZhHjmT6b82butgKO",
    50: "Compendium.zhell-catalogs.rolltables.RollTable.XL0PAEh0TFHEmtt5",
    100: "Compendium.zhell-catalogs.rolltables.RollTable.n41rBiuB2xclGux1",
    500: "Compendium.zhell-catalogs.rolltables.RollTable.08CU1DRhZ2DWnKPU",
    1000: "Compendium.zhell-catalogs.rolltables.RollTable.G23Dh8Xb1RywJPOj",
    5000: "Compendium.zhell-catalogs.rolltables.RollTable.GKfKKLa8pJVxjrML",
  };

  /* -------------------------------------------------- */

  static TRADEBAR_TABLES = {};

  /* -------------------------------------------------- */

  static TRADEGOODS_TABLES = {};

  /* -------------------------------------------------- */

  static ARTOBJECT_TABLES = {
    25: "Compendium.zhell-catalogs.rolltables.RollTable.YWvlWvcV6ewgVkDD",
    250: "Compendium.zhell-catalogs.rolltables.RollTable.eh6lji6udlFmzNdr",
    750: "Compendium.zhell-catalogs.rolltables.RollTable.2OQZx8Bopli249mY",
    2500: "Compendium.zhell-catalogs.rolltables.RollTable.JL0VR6ZYDAfMbUCR",
    7500: "Compendium.zhell-catalogs.rolltables.RollTable.ANXopolcnSkGFZte",
  }

  /* -------------------------------------------------- */

  static get averageLevel() {
    const {actor: party} = game.settings.get("dnd5e", "primaryParty");
    const members = party ? party.system.members.map(m => m.actor).filter(actor => actor.type === "character") : [];
    const average = Math.floor(members.reduce((acc, actor) => acc + actor.system.details.level, 0) / members.length);
    return average;
  };

  /* -------------------------------------------------- */

  #level = RandomTreasure.averageLevel;

  /* -------------------------------------------------- */

  #hoard = false;

  /* -------------------------------------------------- */

  #theme = "arcana";

  /* -------------------------------------------------- */

  async configure() {
    const { createSelectInput, createCheckboxInput, createFormGroup } = foundry.applications.fields

    const levelInput = foundry.applications.elements.HTMLRangePickerElement.create({
      min: 1,
      max: 20,
      value: this.#level,
      step: 1,
      name: "level",
    })
    const hoardInput = createCheckboxInput({name: "hoard", value: this.#hoard})
    const themeInput = createSelectInput({
      required: true,
      blank: false,
      name: "theme",
      value: this.#theme,
      options: Object.entries(themeOptions).map(([k, v]) => ({value: k, label: v.label})),
    })

    const result = await foundry.applications.api.Dialog.input({
      content: [
        createFormGroup({
          label: "Party Level",
          rootId: foundry.utils.randomID(),
          input: levelInput
        }),
        createFormGroup({
          label: "Hoard",
          rootId: foundry.utils.randomID(),
          input: hoardInput,
        }),
        createFormGroup({
          label: game.i18n.localize("DND5E.Treasure.Configuration.Label"),
          rootId: foundry.utils.randomID(),
          input: themeInput,
        }),
      ].map(fg => fg.outerHTML).join("")
    });

    if (!result) return;

    const { level, hoard, theme } = result;
    this.#level = level;
    this.#hoard = hoard;
    this.#theme = theme;
  }

  /* -------------------------------------------------- */
};




// Accumulators.
const items = [];
const gems = {};
const arts = {};
let monetary;

/* -------------------------------------------------- */

const rewardsLookup = hoard ? hoardRewards : individualRewards;
const config = Object.entries(rewardsLookup).reverse().find(k => level >= Number(k[0]))[1];
monetary = (await foundry.dice.Roll.create(config.monetary).evaluate()).total;
const itemCount = (await foundry.dice.Roll.create(config.items).evaluate()).total;
const rarityTableUuid = Object.entries(rarityTables).reverse().find(k => level >= Number(k[0]))[1];

// Convert to gem stones.
if (themeOptions[theme].types.has("gemStones")) {
  for (const k in gemStoneTables) {
    if (monetary >= Number(k)) gemStoneTables[k] = await fromUuid(gemStoneTables[k]);
    else delete gemStoneTables[k];
  }

  while (!foundry.utils.isEmpty(gemStoneTables)) {
    const value = Number(Object.keys(gemStoneTables).at(-1));
    if (monetary < value) {
      delete gemStoneTables[value];
    }

    else {
      const table = gemStoneTables[value];
      const draw = await table.draw({displayChat: false});
      const uuid = draw.results[0].documentUuid;

      gems[uuid] ??= {item: await fromUuid(uuid), quantity: 1};
      gems[uuid].quantity++;
      monetary -= value;
    }
  }
}

// Convert to art objects.
else if (themeOptions[theme].types.has("artObjects")) {
  for (const k in artObjectTables) {
    if (monetary >= Number(k)) artObjectTables[k] = await fromUuid(artObjectTables[k]);
    else delete artObjectTables[k];
  }

  while (!foundry.utils.isEmpty(artObjectTables)) {
    const value = Number(Object.keys(artObjectTables).at(-1));
    if (monetary < value) {
      delete artObjectTables[value];
    }

    else {
      const table = artObjectTables[value];
      const draw = await table.draw({displayChat: false});
      const uuid = draw.results[0].documentUuid;

      arts[uuid] ??= {item: await fromUuid(uuid), quantity: 1};
      arts[uuid].quantity++;
      monetary -= value;
    }
  }
}

// Draw magic items.
for (let i = 0; i < itemCount; i++) {
  let rarity = await (await fromUuid(rarityTableUuid)).draw({displayChat: false});
  rarity = await rarity.results[0].getHTML();
  rarity = foundry.utils.parseHTML(`<div>${rarity}</div>`).querySelector(".description").textContent.toLowerCase().trim();
  rarity = Object.entries(CONFIG.DND5E.itemRarity).find(k => k[1].toLowerCase() === rarity.toLowerCase())[0];

  // Use CB api to draw random item, add to `items`.
  const Cls = dnd5e.applications.CompendiumBrowser;
  const indexes = await Cls.fetch(foundry.documents.Item, {
    types: new Set(["weapon", "equipment", "tool", "consumable"]),
    filters: [
      {k: "system.properties", o: "contains", v: "mgc"},
      {k: "system.price.value", o: "gt", v: 0},
      {k: "system.rarity", o: "exact", v: rarity},
    ],
    index: true,
    indexFields: new Set(),
    sort: true,
  });

  if (!indexes.length) break;

  const idx = indexes[Math.floor(Math.random() * indexes.length)];
  const item = await fromUuid(idx.uuid);
  items.push(item);
}

// Post message with results.
const content = ["<p>You receive:</p>"];

// GP
if (monetary) content.push(`<p>[[/award ${monetary}gp]]</p>`);

// Magic items
if (items.length) {
  content.push("<h4>Magic Items</h4>");
  for (const item of items) content.push(`<p>${item.link}</p>`);
}

// Gem stones
if (!foundry.utils.isEmpty(gems)) {
  content.push("<h4>Gemstones</h4>")
  for (const { item, quantity } of Object.values(gems)) {
    content.push(`<p>${item.link} &times${quantity}</p>`);
  }
}

// Art objects
if (!foundry.utils.isEmpty(arts)) {
  content.push("<h4>Art Objects</h4>")
  for (const { item, quantity } of Object.values(arts)) {
    content.push(`<p>${item.link} &times${quantity}</p>`);
  }
}

ChatMessage.create({
  content: content.join(""),
  whisper: [game.user.id],
});
