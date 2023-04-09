import {MODULE} from "../const.mjs";
import {SPELL_EFFECTS, STATUS_EFFECTS} from "../../sources/conditions.mjs";

// hooks on setup.
export function _setUpGameChanges() {
  const settings = game.settings.get(MODULE, "worldSettings");
  if (settings.addEquipment) _addEquipment();
  if (settings.addDivine) _addDivine();
  if (settings.addConditions) _addConditions();
  if (settings.addPiety) _addPiety();
  if (settings.replaceConsumables) _consumables();
  if (settings.replaceLanguages) _languages();
  if (settings.replaceTools) _tools();
  if (settings.replaceWeapons) _weapons();
  if (settings.replaceTokenConditions) _conditions();
}

function _addEquipment() {
  const toAdd = {wand: "Wand"};
  foundry.utils.mergeObject(CONFIG.DND5E.equipmentTypes, toAdd);
  foundry.utils.mergeObject(CONFIG.DND5E.miscEquipmentTypes, toAdd);
}

function _addDivine() {
  const toAdd = {divine: "Divine"};
  foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, toAdd);
}

function _addConditions() {
  const toAdd = {turned: "Turned"};
  foundry.utils.mergeObject(CONFIG.DND5E.conditionTypes, toAdd);
}

function _addPiety() {
  CONFIG.DND5E.abilities["pty"] = "Piety";
  CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
  CONFIG.DND5E.featureTypes.boon = {label: "Divine Boon"};
}

function _consumables() {
  // the new consumable types.
  const addedConsumableTypes = {
    drink: "Drink",
    elixir: "Elixir",
    bomb: "Bomb",
    trap: "Trap"
  }

  // delete unwanted consumable types.
  const deletedConsumableTypes = ["rod", "wand"];
  const oldObject = foundry.utils.deepClone(CONFIG.DND5E.consumableTypes);
  for (const del of deletedConsumableTypes) delete oldObject[del];

  // merge remaining with new types to add.
  const newArray = Object.entries(addedConsumableTypes)
    .concat(Object.entries(oldObject))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  CONFIG.DND5E.consumableTypes = Object.fromEntries(newArray);
}

function _languages() {
  CONFIG.DND5E.languages = {
    common: "Common",
    cait: "Cait",
    draconic: "Draconic",
    dwarvish: "Dwarvish",
    elvish: "Elvish",
    infernal: "Infernal",
    orc: "Orcish",
    aarakocra: "Aarakocra",
    abyssal: "Abyssal",
    celestial: "Celestial",
    giant: "Giant",
    primordial: "Primordial",
    aquan: "Aquan",
    auran: "Auran",
    ignan: "Ignan",
    terran: "Terran",
    sylvan: "Sylvan",
    undercommon: "Undercommon",
    cant: "Thieves' Cant",
    druidic: "Druidic"
  }
}

function _tools() {
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

function _weapons() {
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
  const del = ["fir", "rel"];
  del.forEach(property => {
    delete CONFIG.DND5E.weaponProperties[property];
  });
}

function _conditions() {
  // these are gotten from a different file, combined, and then sorted.
  const statusEffects = SPELL_EFFECTS.concat(STATUS_EFFECTS).sort((a, b) => {
    return a.sort - b.sort;
  });
  CONFIG.statusEffects = statusEffects;
}

// Add 'View' button to scene headers for the GM.
export function _sceneHeaderView(app, array) {
  const viewBtn = {
    class: `${MODULE}-view-scene`,
    icon: "fa-solid fa-eye",
    label: "View Scene",
    onclick: async () => await app.object.view()
  }
  array.unshift(viewBtn);
}

// replace Darkvision with a slightly modified one that respects range.
export function _visionModes() {
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

// delete items after a rest.
export async function _restItemDeletion(actor, data) {
  if (!data.longRest) return;
  const ids = actor.items.filter(item => {
    return item.flags[MODULE]?.longRestDestroy;
  }).map(i => i.id);
  if (!ids.length) return;
  await actor.deleteEmbeddedDocuments("Item", ids);
  return ChatMessage.create({
    content: `${actor.name}'s experimental elixirs evaporated.`,
    speaker: ChatMessage.getSpeaker({actor})
  });
}

// Miscellaneous adjustments.
export function _miscAdjustments() {
  // Add more feature types.
  foundry.utils.mergeObject(CONFIG.DND5E.featureTypes.class.subtypes, {
    arcaneArcherShot: "Arcane Archer Shot",
    primordialEffect: "Primordial Effect"
  });

  // Adjust the time it takes for tooltips to fade in and out.
  TooltipManager.TOOLTIP_ACTIVATION_MS = 100;
}

// Drop folder of actors.
export async function _dropActorFolder(canvas, data) {
  if (data.type !== "Folder" || data.documentName !== "Actor") return;
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
export function _addContextMenuOptions(item, array) {
  _moveItemToSharedInventory(item, array);
  _createScrollFromOwnedSpell(item, array);
}

/**
 * Add a context menu option to move an item into a shared inventory (an owned Group actor).
 * @param {Item5e} item         The item that is the target of the context menu.
 * @param {object[]} array      The array of context menu options.
 */
function _moveItemToSharedInventory(item, array) {
  if (!["weapon", "equipment", "consumable", "tool", "backpack", "loot"].includes(item.type)) return;
  const inventory = game.actors.filter(a => {
    return a.isOwner && a.type === "group" && a !== item.actor;
  });
  for (const inv of inventory) {
    array.push({
      icon: "<i class='fa-solid fa-hand-holding-hand'></i>",
      name: `Move to ${inv.name}`,
      callback: async () => {
        const [c] = await inv.createEmbeddedDocuments("Item", [item.toObject()]);
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
function _createScrollFromOwnedSpell(spell, array) {
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
export async function _itemStatusCondition(sheet, html) {
  if (sheet.document.actor || !sheet.isEditable) return;
  const list = html[0].querySelector(".items-list.effects-list");
  if (!list) return;

  const options = CONFIG.statusEffects.filter(s => {
    return !sheet.document.effects.find(e => e.flags.core?.statusId === s.id);
  }).sort((a, b) => a.label.localeCompare(b.label)).reduce(function(acc, s) {
    return acc + `<option value="${s.id}">${game.i18n.localize(s.label)}</option>`;
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
      "flags.core.statusId": eff.id,
      transfer: false,
      origin: sheet.document.uuid,
      "flags.effective-transferral.transferrable.self": false,
      "flags.effective-transferral.transferrable.target": true,
      label: game.i18n.localize(eff.label)
    });
    return sheet.document.createEmbeddedDocuments("ActiveEffect", [data]);
  });
}

/**
 * Change the defaults of newly created scenes.
 * @param {Scene} scene           The scene document to be created.
 * @param {object} sceneData      The data object used to create the scene.
 */
export function _preCreateScene(scene, sceneData) {
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
 * When an effect is created in an item, set its icon and label to be the item's img
 * and name unless a different and non-default icon and label are provided.
 * @param {ActiveEffect} effect     The effect to be created.
 * @param {object} effectData       The data object used to create the effect.
 */
export function _preCreateActiveEffect(effect, effectData) {
  if (!(effect.parent instanceof Item)) return;
  const data = {};
  if ((effectData.icon === "icons/svg/aura.svg") || !effectData.icon) {
    data.icon = effect.parent.img;
  }
  if ((effectData.label === "New Effect") || !effectData.label) {
    data.label = effect.parent.name;
  }
  effect.updateSource(data);
}
