/**
 * Application to roll for random treasure, using individual or hoard formulas.
 * This creates a final chat message with links to the loot, which can be gp, gem stones,
 * art objects, and magic items.
 */
export default class RandomTreasure extends foundry.applications.api.Dialog {
  /**
   * Theme options.
   * @type {Record<string, { label: string, types: Set<string> }>}
   */
  static THEME_OPTIONS = {
    arcana: {
      get label() {
        return CONFIG.DND5E.treasure.arcana.label;
      },
      types: new Set(["gemStones"]),
    },
    armaments: {
      get label() {
        return CONFIG.DND5E.treasure.armaments.label;
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
        return CONFIG.DND5E.treasure.relics.label;
      },
      types: new Set(["artObjects"]),
    },
  };

  /* -------------------------------------------------- */

  /**
   * Formulas for individual rewards.
   * The DMG has these recorded as gp or pp, but converted to gp here.
   * @type {Record<number, { monetary: string, items: string }>}
   */
  static INDIVIDUAL_REWARDS = {
    0: {
      monetary: "3d6",
      items: "0",
    },
    5: {
      monetary: "2d8 * 10",
      items: "0",
    },
    11: {
      monetary: "2d10 * 100",
      items: "0",
    },
    17: {
      monetary: "2d8 * 1000",
      items: "0",
    },
  };

  /* -------------------------------------------------- */

  /**
   * Formulas for hoard rewards.
   * @type {Record<number, { monetary: string, items: string }>}
   */
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

  /**
   * Rarity tables by tier of play.
   * @type {Record<number, string>}
   */
  static RARITY_TABLES = {
    1: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg14RandomMagic",
    5: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg510RandomMagi",
    11: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg1116RandomMag",
    17: "Compendium.dnd-dungeon-masters-guide.tables.RollTable.dmg1720RandomMag",
  };

  /* -------------------------------------------------- */

  /**
   * Gem stone tables by price.
   * @type {Record<number, string>}
   */
  static GEMSTONE_TABLES = {
    10: "Compendium.zhell-catalogs.rolltables.RollTable.ZhHjmT6b82butgKO",
    50: "Compendium.zhell-catalogs.rolltables.RollTable.XL0PAEh0TFHEmtt5",
    100: "Compendium.zhell-catalogs.rolltables.RollTable.n41rBiuB2xclGux1",
    500: "Compendium.zhell-catalogs.rolltables.RollTable.08CU1DRhZ2DWnKPU",
    1000: "Compendium.zhell-catalogs.rolltables.RollTable.G23Dh8Xb1RywJPOj",
    5000: "Compendium.zhell-catalogs.rolltables.RollTable.GKfKKLa8pJVxjrML",
  };

  /* -------------------------------------------------- */

  /**
   * Trade bars tables by price.
   * @type {Record<number, string>}
   */
  static TRADEBAR_TABLES = {};

  /* -------------------------------------------------- */

  /**
   * Trade goods tables by price.
   * @type {Record<number, string>}
   */
  static TRADEGOODS_TABLES = {};

  /* -------------------------------------------------- */

  /**
   * Art object tables by price.
   * @type {Record<number, string>}
   */
  static ART_OBJECT_TABLES = {
    25: "Compendium.zhell-catalogs.rolltables.RollTable.YWvlWvcV6ewgVkDD",
    250: "Compendium.zhell-catalogs.rolltables.RollTable.eh6lji6udlFmzNdr",
    750: "Compendium.zhell-catalogs.rolltables.RollTable.2OQZx8Bopli249mY",
    2500: "Compendium.zhell-catalogs.rolltables.RollTable.JL0VR6ZYDAfMbUCR",
    7500: "Compendium.zhell-catalogs.rolltables.RollTable.ANXopolcnSkGFZte",
  };

  /* -------------------------------------------------- */

  /**
   * The average level of the party.
   * @type {number}
   */
  static get averageLevel() {
    const members = game.actors.party?.system.members.map(m => m.actor).filter(actor => actor.type === "character") ?? [];
    if (!members.length) return 1;
    return Math.floor(members.reduce((acc, actor) => acc + actor.system.details.level, 0) / members.length);
  }

  /* -------------------------------------------------- */

  /**
   * Initiate dialog for picking options.
   * @returns {Promise<void|null>}
   */
  static async create() {
    const { createSelectInput, createCheckboxInput, createFormGroup } = foundry.applications.fields;

    const levelInput = foundry.applications.elements.HTMLRangePickerElement.create({
      min: 1,
      max: 20,
      value: RandomTreasure.averageLevel,
      step: 1,
      name: "level",
    });
    const hoardInput = createCheckboxInput({ name: "hoard" });
    const themeInput = createSelectInput({
      required: true,
      blank: false,
      name: "theme",
      options: Object.entries(RandomTreasure.THEME_OPTIONS).map(([k, v]) => ({ value: k, label: v.label })),
    });

    const result = await this.input({
      window: {
        title: "ZHELL.TREASURE.TITLE",
      },
      content: [
        createFormGroup({
          label: game.i18n.localize("ZHELL.TREASURE.partyLevel"),
          rootId: foundry.utils.randomID(),
          input: levelInput,
        }),
        createFormGroup({
          label: game.i18n.localize("ZHELL.TREASURE.hoard"),
          rootId: foundry.utils.randomID(),
          input: hoardInput,
        }),
        createFormGroup({
          label: game.i18n.localize("ZHELL.TREASURE.theme"),
          rootId: foundry.utils.randomID(),
          input: themeInput,
        }),
      ].map(fg => fg.outerHTML).join(""),
    });
    return result ? RandomTreasure.draw(result.level, result.hoard, result.theme) : null;
  }

  /* -------------------------------------------------- */

  /**
   * Draw treasures, convert, and post to chat.
   * @param {number} level    Average level of the party.
   * @param {boolean} hoard   Is this a hoard or individual treasure?
   * @param {string} theme    The theme of the treasure.
   * @returns {Promise<void>}
   */
  static async draw(level, hoard, theme) {
    // Accumulators.
    const items = [];
    const gems = {};
    const arts = {};
    let monetary;

    const rewardsLookup = hoard ? RandomTreasure.HOARD_REWARDS : RandomTreasure.INDIVIDUAL_REWARDS;
    const config = Object.entries(rewardsLookup).reverse().find(k => level >= Number(k[0]))[1];
    monetary = (await foundry.dice.Roll.create(config.monetary).evaluate()).total;
    const itemCount = (await foundry.dice.Roll.create(config.items).evaluate()).total;
    const rarityTableUuid = Object.entries(RandomTreasure.RARITY_TABLES).reverse().find(k => level >= Number(k[0]))[1];

    const gemStoneTables = foundry.utils.deepClone(RandomTreasure.GEMSTONE_TABLES);
    const artObjectTables = foundry.utils.deepClone(RandomTreasure.ART_OBJECT_TABLES);

    // Convert to gem stones.
    if (RandomTreasure.THEME_OPTIONS[theme].types.has("gemStones")) {
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
          const draw = await table.draw({ displayChat: false });
          const uuid = draw.results[0].documentUuid;

          gems[uuid] ??= { item: await fromUuid(uuid), quantity: 1 };
          gems[uuid].quantity++;
          monetary -= value;
        }
      }
    }

    // Convert to art objects.
    else if (RandomTreasure.THEME_OPTIONS[theme].types.has("artObjects")) {
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
          const draw = await table.draw({ displayChat: false });
          const uuid = draw.results[0].documentUuid;

          arts[uuid] ??= { item: await fromUuid(uuid), quantity: 1 };
          arts[uuid].quantity++;
          monetary -= value;
        }
      }
    }

    // Draw magic items.
    for (let i = 0; i < itemCount; i++) {
      let rarity = await (await fromUuid(rarityTableUuid)).draw({ displayChat: false });
      rarity = await rarity.results[0].getHTML();
      rarity = foundry.utils.parseHTML(rarity).textContent.toLowerCase().trim();
      rarity = Object.entries(CONFIG.DND5E.itemRarity).find(k => k[1].toLowerCase() === rarity)[0];

      // Use CB api to draw random item, add to `items`.
      const Cls = dnd5e.applications.CompendiumBrowser;
      const indexes = await Cls.fetch(foundry.documents.Item, {
        types: new Set(["weapon", "equipment", "tool", "consumable"]),
        filters: [
          { k: "system.properties", o: "contains", v: "mgc" },
          { k: "system.price.value", o: "gt", v: 0 },
          { k: "system.rarity", o: "exact", v: rarity },
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
    const content = [`<p>${game.i18n.localize("ZHELL.TREASURE.youReceive")}</p>`];

    // GP
    if (monetary) content.push(`<p>[[/award ${monetary}gp]]</p>`);

    // Magic items
    if (items.length) {
      content.push(`<h4>${game.i18n.localize("ZHELL.TREASURE.magicItems")}</h4>`);
      for (const item of items) content.push(`<p>${item.link}</p>`);
    }

    // Gem stones
    if (!foundry.utils.isEmpty(gems)) {
      content.push(`<h4>${game.i18n.localize("ZHELL.TREASURE.gemStones")}</h4>`);
      for (const { item, quantity } of Object.values(gems)) {
        content.push(`<p>${item.link} &times${quantity}</p>`);
      }
    }

    // Art objects
    if (!foundry.utils.isEmpty(arts)) {
      content.push(`<h4>${game.i18n.localize("ZHELL.TREASURE.artObjects")}</h4>`);
      for (const { item, quantity } of Object.values(arts)) {
        content.push(`<p>${item.link} &times${quantity}</p>`);
      }
    }

    ChatMessage.implementation.create({
      content: content.join(""),
      whisper: [game.user.id],
      speaker: ChatMessage.implementation.getSpeaker({ user: game.user }),
    });
  }
}
