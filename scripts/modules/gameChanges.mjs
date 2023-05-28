import {MODULE} from "../const.mjs";
import {SPELL_EFFECTS, STATUS_EFFECTS} from "../../sources/conditions.mjs";

export class GameChangesHandler {
  // hooks on setup.
  static _setUpGameChanges() {
    const settings = game.settings.get(MODULE, "worldSettings");
    if (settings.addEquipment) GameChangesHandler._addEquipment();
    if (settings.addDivine) GameChangesHandler._addDivine();
    if (settings.addConditions) GameChangesHandler._addConditions();
    if (settings.addPiety) GameChangesHandler._addPiety();
    if (settings.replaceConsumables) GameChangesHandler._consumables();
    if (settings.replaceLanguages) GameChangesHandler._languages();
    if (settings.replaceTools) GameChangesHandler._tools();
    if (settings.replaceWeapons) GameChangesHandler._weapons();
    if (settings.replaceTokenConditions) GameChangesHandler._conditions();
  }

  static _addEquipment() {
    const toAdd = {wand: "Wand"};
    foundry.utils.mergeObject(CONFIG.DND5E.equipmentTypes, toAdd);
    foundry.utils.mergeObject(CONFIG.DND5E.miscEquipmentTypes, toAdd);
  }

  static _addDivine() {
    const toAdd = {divine: "Divine"};
    foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, toAdd);
  }

  static _addConditions() {
    const toAdd = {turned: "Turned"};
    foundry.utils.mergeObject(CONFIG.DND5E.conditionTypes, toAdd);

    CONFIG.DND5E.conditionTypes = Object.fromEntries(Object.entries(CONFIG.DND5E.conditionTypes).sort((a, b) => a[1].localeCompare(b[1])));
  }

  static _addPiety() {
    // Ability scores.
    CONFIG.DND5E.abilities.pty = {
      label: "Piety",
      abbreviation: "pty",
      type: "mental",
      defaults: {vehicle: 0}
    };

    // Feature types.
    const toAdd = {
      boon: {label: "DND5E.Feature.DivineBoon"},
      curse: {label: "DND5E.Feature.Curse"}
    };
    foundry.utils.mergeObject(CONFIG.DND5E.featureTypes, toAdd);
    CONFIG.DND5E.featureTypes = Object.fromEntries(Object.entries(CONFIG.DND5E.featureTypes).sort((a, b) => {
      return a[1].label.localeCompare(b[1].label, game.i18n.lang);
    }));
  }

  static _consumables() {
    const toDelete = ["rod", "wand"];
    for (const d of toDelete) delete CONFIG.DND5E.consumableTypes[d];

    const toAdd = {drink: "Drink", elixir: "Elixir", bomb: "Bomb", trap: "Trap"};
    foundry.utils.mergeObject(CONFIG.DND5E.consumableTypes, toAdd);

    CONFIG.DND5E.consumableTypes = Object.fromEntries(Object.entries(CONFIG.DND5E.consumableTypes).sort((a, b) => a[1].localeCompare(b[1])));
  }

  static _languages() {
    const toDelete = ["gnomish", "halfling"];
    for (const lang of toDelete) delete CONFIG.DND5E.languages[lang];

    const toAdd = {cait: "Cait", orc: "Orcish"};
    foundry.utils.mergeObject(CONFIG.DND5E.languages, toAdd);

    CONFIG.DND5E.languages = Object.fromEntries(Object.entries(CONFIG.DND5E.languages).sort((a, b) => a[1].localeCompare(b[1])));
  }

  static _tools() {
    const key = "zhell-catalogs.items";

    CONFIG.DND5E.toolIds = {
      accordion: `${key}.NtQzLYE9ySGxHLzA`,
      alchemist: `${key}.4tStn8Ym5IHOZMEn`,
      bagpipes: `${key}.s40QkYXMkoc78pnX`,
      brewer: `${key}.0hLh5UuEiqAHFNGy`,
      calligrapher: `${key}.9A3m86BsFcK3kyuk`,
      card: `${key}.xpcEdLZpuwatrD1g`,
      carpenter: `${key}.zSyPecV8GvlwRBnb`,
      cartographer: `${key}.qByp9O1TXmmvZZlw`,
      chess: `${key}.sXYKYV74alW1rSZX`,
      cobbler: `${key}.wYitL12DbabCoAJe`,
      concertina: `${key}.US8qotundpdkpU0X`,
      cook: `${key}.eXTMqIA8scnGoKMi`,
      dice: `${key}.EsX0MGofFkxs7gvD`,
      disg: `${key}.qJAan3e7Q3VerBPl`,
      drum: `${key}.BLkHLSjSAg11Irgd`,
      dulcimer: `${key}.3hpOtqloLx29dW9x`,
      flute: `${key}.q1Kts9CfnofRKbXy`,
      forg: `${key}.HGwOzsIewhia3L3n`,
      glassblower: `${key}.OcB7ewGkA84DOQHp`,
      glaur: `${key}.0gATC04WyH4JrPWg`,
      guiro: `${key}.0bn6X8GmJPTb8kee`,
      harp: `${key}.tfEjBgVmyoE394Nj`,
      herb: `${key}.Bk0BYIgrgb3WMqj7`,
      horn: `${key}.lGg5FEecUJx8jvAs`,
      jeweler: `${key}.mRFujgFSiyNaHIED`,
      leatherworker: `${key}.8rI5F0h572rFImET`,
      longhorn: `${key}.qASPf4BtC2c4AEPB`,
      lute: `${key}.44YtLQgKSkCzK8v9`,
      lyre: `${key}.kacmOU2zKEnqOjoz`,
      mason: `${key}.Q7S6lUvCHfPNaCNx`,
      navg: `${key}.Zl4MTQUqNI9vqHLN`,
      painter: `${key}.2cPulLXT5TlYeGdj`,
      panflute: `${key}.FfHnUw4L7R2FM6P5`,
      pois: `${key}.XSll8MbsWEWmkdC5`,
      potter: `${key}.XWLsZ87NMbPa7aZq`,
      recorder: `${key}.bT9cbtnneRrHcoHY`,
      shawm: `${key}.XODrsxO7bonOv2uy`,
      smith: `${key}.CFQ2BiMfssksd9O3`,
      tantan: `${key}.x0MtEjLGydd5MHcf`,
      thelarr: `${key}.pOlph5kKSqAO6Jvh`,
      thief: `${key}.7PPZlSR6IpQ4Mvvv`,
      tinker: `${key}.ASonPC97y4IGqIfO`,
      tocken: `${key}.JReT6EKOgEeYRpMt`,
      ukulele: `${key}.8TVfL7rU2IOAnbmk`,
      viol: `${key}.M6bLWTHz021Bz61B`,
      wargong: `${key}.Jki4OaxHOBC3HETT`,
      weaver: `${key}.G0xhjVpUygYbCUue`,
      whistlestick: `${key}.jNfLEw1hydqd6gFV`,
      woodcarver: `${key}.XkkGVigtxh57Wvb2`,
      yarting: `${key}.wVJXpPGzTlETZ3MR`,
      zulkoon: `${key}.kLrbRKBnNatsGTjH`
    }
  }

  static _weapons() {
    const key = "zhell-catalogs.items";

    CONFIG.DND5E.weaponIds = {
      battleaxe: `${key}.5YvvZ5KsGgzlVBJg`,
      blowgun: `${key}.7mIrXgEFREdCZoq6`,
      club: `${key}.u2OfOMTYwv7xC3E7`,
      dagger: `${key}.36WDepHXSrp9qxtZ`,
      dart: `${key}.ssBK4bfm1gx3Q9Fo`,
      falchion: `${key}.bo4IjSpfdCfwQ5Bu`,
      flail: `${key}.1emzz8v17oS9h9ex`,
      glaive: `${key}.pq4htSLwsFByOXg6`,
      greataxe: `${key}.T7cSFs9R3pGF74b3`,
      greatclub: `${key}.y9B7EXLlrRukmCNw`,
      greatsword: `${key}.KXtYXV1G9vpwctfQ`,
      halberd: `${key}.NcZKj1Re9XxUJHYS`,
      handcrossbow: `${key}.tq2IZWhRwEpoJCLN`,
      handaxe: `${key}.zR4BtcctYAOWE7KN`,
      heavycrossbow: `${key}.zQX0nUPFKzAmWfVP`,
      javelin: `${key}.JW3iiWOeLeHfMCQW`,
      lance: `${key}.BzVHGLVLnYXcQGAN`,
      lightcrossbow: `${key}.sNVv0zBflAVdfLya`,
      lighthammer: `${key}.8nRG9Jf9u1P8qw4N`,
      longbow: `${key}.uplzusJQ5sTMsJOg`,
      longsword: `${key}.dNMYjSSffEzglwww`,
      mace: `${key}.fECMzleaJX8fqZvG`,
      maul: `${key}.wcVsUIcWNasTeZGU`,
      morningstar: `${key}.q4HPiLX1kDF47XKd`,
      net: `${key}.UKZi1Zva5aIhyTc2`,
      pike: `${key}.aUze6i3qVTpNnCnR`,
      quarterstaff: `${key}.oPTWor277Kok0ETq`,
      rapier: `${key}.yYDQyDeLgwENSebw`,
      scimitar: `${key}.lHPyj9lRxx7gLchp`,
      shortbow: `${key}.2r5SFrkBL39wxTas`,
      shortsword: `${key}.7ixPiAumqBjKBU5u`,
      sickle: `${key}.sTlhgLxyWg76c1MB`,
      sling: `${key}.Aa3xDhMzueybrODT`,
      spear: `${key}.03SkVtPAOdoK6BWB`,
      trident: `${key}.z8lUzt9KwtyksYO9`,
      warpick: `${key}.evvPCgenUmPXFSb0`,
      warhammer: `${key}.YZzXPxRgpYcPh61M`,
      whip: `${key}.KGH7gJe5mvpbRoFZ`
    };

    // delete some weapon properties.
    const toDelete = ["fir", "rel"];
    for (const d of toDelete) delete CONFIG.DND5E.weaponProperties[d];
  }

  static _conditions() {
    // these are gotten from a different file, combined, and then sorted.
    const statusEffects = SPELL_EFFECTS.concat(STATUS_EFFECTS).sort((a, b) => {
      return a.sort - b.sort;
    });
    CONFIG.statusEffects = statusEffects;
  }

  // Add 'View' button to scene headers for the GM.
  static _sceneHeaderView(app, array) {
    const viewBtn = {
      class: `${MODULE}-view-scene`,
      icon: "fa-solid fa-eye",
      label: "View Scene",
      onclick: () => app.document.view()
    }
    array.unshift(viewBtn);
  }

  // replace Darkvision with a slightly modified one that respects range.
  static _visionModes() {
    CONFIG.Canvas.visionModes.darkvision = new VisionMode({
      id: "darkvision",
      label: "VISION.ModeDarkvision",
      canvas: {
        shader: ColorAdjustmentsSamplerShader,
        uniforms: {enable: true, contrast: 0, saturation: -1.0, brightness: 0},
      },
      lighting: {
        background: {visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED},
      },
      vision: {
        darkness: {adaptive: true},
        defaults: {contrast: 0, saturation: -1.0, brightness: 0.65},
      },
    });
  }

  /**
   * Delete items after a rest.
   * @param {Actor} actor                 The actor taking a rest.
   * @param {object} data                 The rest data.
   * @returns {Promise<ChatMessage>}      A created chat message with updates.
   */
  static async _restItemDeletion(actor, data) {
    const property = data.longRest ? "longRestDestroy" : "shortRestDestroy";
    const {ids, content} = actor.items.reduce((acc, item) => {
      if (item.flags[MODULE]?.[property]) {
        acc.ids.push(item.id);
        acc.content += `<li>${item.name}</li>`;
      }
      return acc;
    }, {ids: [], content: ""});
    if (!ids.length) return;
    await actor.deleteEmbeddedDocuments("Item", ids);
    return ChatMessage.create({
      content: `Some of ${actor.name}'s items were destroyed:<ul>${content}</ul>`,
      speaker: ChatMessage.getSpeaker({actor})
    });
  }

  // Miscellaneous adjustments.
  static _miscAdjustments() {
    // Add more feature types.
    const entries = Object.entries({
      ...CONFIG.DND5E.featureTypes.class.subtypes,
      ...{
        arcaneArcherShot: "Arcane Archer Shot",
        primordialEffect: "Primordial Effect"
      }
    }).sort((a, b) => a[1].localeCompare(b[1]));
    CONFIG.DND5E.featureTypes.class.subtypes = Object.fromEntries(entries);

    // Adjust the time it takes for tooltips to fade in and out.
    TooltipManager.TOOLTIP_ACTIVATION_MS = 100;
  }

  /**
   * Drop folder of actors.
   * @param {Canvas} canvas                   The targeted canvas.
   * @param {object} data                     The dragged data.
   * @returns {Promise<TokenDocument[]>}      The created token documents.
   */
  static async _dropActorFolder(canvas, data) {
    if ((data.type !== "Folder") || (data.documentName !== "Actor")) return;
    const folder = await fromUuid(data.uuid);
    const [x, y] = canvas.grid.getTopLeft(data.x, data.y);
    const tokenData = await Promise.all(folder.contents.map(a => a.getTokenDocument({x, y})));
    return canvas.scene.createEmbeddedDocuments("Token", tokenData);
  }

  /**
   * Add a context menu options for when an actor item is right-clicked.
   * @param {Item5e} item         The item that is the target of the context menu.
   * @param {object[]} array      The array of context menu options.
   */
  static _addContextMenuOptions(item, array) {
    GameChangesHandler._moveItemToSharedInventory(item, array);
    GameChangesHandler._createScrollFromOwnedSpell(item, array);
  }

  /**
   * Add a context menu option to move an item into a shared inventory (an owned Group actor).
   * @param {Item5e} item         The item that is the target of the context menu.
   * @param {object[]} array      The array of context menu options.
   */
  static _moveItemToSharedInventory(item, array) {
    if (!["weapon", "equipment", "consumable", "tool", "backpack", "loot"].includes(item.type)) return;
    const inventory = game.actors.filter(a => {
      return a.isOwner && (a.type === "group") && (a !== item.actor);
    });
    for (const inv of inventory) {
      array.push({
        icon: "<i class='fa-solid fa-hand-holding-hand'></i>",
        name: `Move to ${inv.name}`,
        callback: async () => {
          const itemData = item.toObject();
          const create = await inv.sheet._onDropSingleItem(itemData);
          if (!create) return;
          const [c] = await inv.createEmbeddedDocuments("Item", [itemData]);
          if (c) await item.delete();
        }
      });
    }
  }

  /**
   * Add a context menu option to create a scroll from a spell in an actor's spellbook.
   * @param {Item5e} spell        The spell that is the target of the context menu.
   * @param {object[]} array      The array of context menu options.
   */
  static _createScrollFromOwnedSpell(spell, array) {
    if (spell.type !== "spell") return;
    array.push({
      name: "Create Scroll",
      icon: "<i class='fa-solid fa-scroll'></i>",
      callback: async () => {
        const path = "flags.concentrationnotifier.data.requiresConcentration";
        const scroll = await Item.implementation.createScrollFromSpell(spell);
        const itemData = game.items.fromCompendium(scroll);
        foundry.utils.mergeObject(itemData.flags, spell.flags);
        if (spell.system.components.concentration) foundry.utils.setProperty(itemData, path, true);
        ui.notifications.info(`Created scroll from ${spell.name}.`);
        return spell.actor.createEmbeddedDocuments("Item", [itemData]);
      }
    });
  }

  /**
   * Add a dropdown in unowned items to add a status condition for ET purposes.
   * @param {ItemSheet} sheet       The item sheet.
   * @param {HTMLElement} html      The sheet's element.
   */
  static async _itemStatusCondition(sheet, html) {
    if (!sheet.isEditable) return;
    const list = html[0].querySelector(".items-list.effects-list");
    if (!list) return;

    const options = CONFIG.statusEffects.filter(s => {
      return !sheet.document.effects.find(e => e.statuses.has(s.id));
    }).sort((a, b) => a.name.localeCompare(b.name)).reduce(function(acc, s) {
      return acc + `<option value="${s.id}">${game.i18n.localize(s.name)}</option>`;
    }, "");

    if (!options.length) return;

    const DIV = document.createElement("DIV");
    DIV.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/statusConditionSelect.hbs");
    list.append(...DIV.children);

    const add = html[0].querySelector("[data-effect-type='statusCondition'] a[data-action='statusCondition']");
    if (add) add.addEventListener("click", async function() {
      const id = sheet.document.uuid.replaceAll(".", "-") + "-" + "add-status-condition";
      const effId = await Dialog.wait({
        title: "Add Status Condition",
        content: `
        <form class="dnd5e">
          <div class="form-group">
            <label>Status Condition:</label>
            <div class="form-fields">
              <select autofocus>${options}</select>
            </div>
          </div>
        </form>`,
        buttons: {
          ok: {
            label: "Add",
            icon: '<i class="fa-solid fa-check"></i>',
            callback: (html) => html[0].querySelector("select").value
          }
        },
        default: "ok"
      }, {id});
      if (!effId) return;
      const eff = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === effId));
      const data = foundry.utils.mergeObject(eff, {
        statuses: [eff.id],
        transfer: false,
        origin: sheet.document.uuid,
        "flags.effective-transferral.transferrable.self": false,
        "flags.effective-transferral.transferrable.target": true,
        name: game.i18n.localize(eff.name)
      });
      return sheet.document.createEmbeddedDocuments("ActiveEffect", [data]);
    });
  }

  /**
   * Change the defaults of newly created scenes.
   * @param {Scene} scene           The scene document to be created.
   * @param {object} sceneData      The data object used to create the scene.
   */
  static _preCreateScene(scene, sceneData) {
    const data = foundry.utils.mergeObject({
      grid: {type: 2, alpha: 0.1},
      padding: 0.05,
      fogExploration: false,
      globalLight: true,
      backgroundColor: "#000000"
    }, sceneData);
    scene.updateSource(data);
  }

  /**
   * When an effect is created in an item, set its icon and name to be the item's img
   * and name unless a different and non-default icon and name are provided.
   * @param {ActiveEffect} effect     The effect to be created.
   * @param {object} effectData       The data object used to create the effect.
   */
  static _preCreateActiveEffect(effect, effectData) {
    const data = {};
    if ((effectData.icon === "icons/svg/aura.svg") || !effectData.icon) {
      data.icon = effect.parent.img;
    }
    if ((effectData.name === "New Effect") || !effectData.name) {
      data.name = effect.parent.name;
    }
    effect.updateSource(data);
  }

  /**
   * Hook function to replace the token HUD condition selector with a new one
   * that has images and names, as well as tooltips.
   * @param {TokenHUD} hud          The token HUD.
   * @param {HTML} html             The element of the HUD.
   * @param {object} tokenData      The data of the token related to the HUD.
   */
  static _replaceTokenHUD(hud, html, tokenData) {
    const sorting = CONFIG.statusEffects.reduce((acc, e) => {
      acc[e.id] = e.sort;
      return acc;
    }, {});
    const innerHTML = Object.values(tokenData.statusEffects).sort((a, b) => {
      return sorting[a.id] - sorting[b.id];
    }).reduce((acc, eff) => {
      const condition = CONFIG.statusEffects.find(e => e.id === eff.id) ?? {};
      const clss = "status-effect effect-control";
      const atts = (eff.isActive ? "active" : "") + " " + (eff.isOverlay ? "overlay" : "");
      const tooltip = condition.description;
      const name = game.i18n.localize(`ZHELL.StatusCondition${eff.id.capitalize()}`);
      return acc + `
      <div src="${eff.src}" class="${clss} ${atts}" data-status-id="${eff.id}" data-tooltip="${tooltip}">
        <img class="status-effect-img" src="${eff.src}">
        <div class="status-effect-name">${name}</div>
      </div>`;
    }, "");
    html[0].querySelector(".status-effects").innerHTML = innerHTML;
  }

  /**
   * Inject buttons into VAE effects.
   * @param {ActiveEffect} effect     The active effect being rendered.
   * @param {object[]} buttons        The array of buttons on this effect.
   */
  static _visualActiveEffectsCreateEffectButtons(effect, buttons) {
    // Item data and type must be added in the effect by this module.
    const {itemData, types} = effect.flags[MODULE] ?? {};
    if (!itemData || !types) return;

    // Use the item embedded.
    if (types.includes("use")) {
      buttons.push({
        label: `${itemData.name} (Use)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          item.prepareFinalAttributes();
          return item.use({}, {"flags.dnd5e.itemData": itemData});
        }
      });
    }

    // Redisplay the item embedded.
    if (types.includes("redisplay")) {
      buttons.push({
        label: `${itemData.name} (Chat)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          item.prepareFinalAttributes();
          return item.displayCard();
        }
      });
    }

    // Make an attack roll with the item embedded.
    if (types.includes("attack")) {
      buttons.push({
        label: `${itemData.name} (Attack)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          return item.rollAttack({event});
        }
      });
    }

    // Make a damage roll with the item embedded.
    if (types.includes("damage")) {
      buttons.push({
        label: `${itemData.name} (Damage)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          return item.rollDamage({event});
        }
      });
    }

    // Make a healing roll with the item embedded.
    if (types.includes("healing")) {
      buttons.push({
        label: `${itemData.name} (Healing)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          return item.rollDamage({event});
        }
      });
    }

    // Create a measured template from the item embedded.
    if (types.includes("template")) {
      buttons.push({
        label: `${itemData.name} (Template)`,
        callback: () => {
          const item = new Item.implementation(itemData, {parent: effect.parent});
          return dnd5e.canvas.AbilityTemplate.fromItem(item).drawPreview();
        }
      });
    }
  }

  /**
   * Rotate tokens when they move, unless their rotation is locked.
   * @param {TokenDocument} doc     The token document being updated.
   * @param {object} update         The update about to be performed.
   * @param {object} options        The options for the update.
   */
  static _rotateTokensOnMovement(doc, update, options) {
    if (doc.lockRotation || (options.animate === false)) return;
    if (!foundry.utils.hasProperty(update, "x") && !foundry.utils.hasProperty(update, "y")) return;
    const ray = new Ray(doc, {x: update.x ?? doc.x, y: update.y ?? doc.y});
    update.rotation = ray.angle * 180 / Math.PI - 90;
  }
}
