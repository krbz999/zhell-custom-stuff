import {MODULE} from "../const.mjs";
import {mayhem} from "./gameTools/mayhem.mjs";

export class GameChangesHandler {
  // Hooks on init.
  static init() {
    GameChangesHandler._configChanges();

    if (game.modules.get("zhell-catalogs")?.active) {
      GameChangesHandler._tools();
      GameChangesHandler._weapons();
    }

    Hooks.once("setup", GameChangesHandler._setupGameChanges);
    Hooks.on("preUpdateToken", GameChangesHandler._rotateTokensOnMovement);
    Hooks.on("dnd5e.restCompleted", GameChangesHandler._restItemDeletion);
    Hooks.on("dnd5e.getItemContextOptions", GameChangesHandler._addContextMenuOptions);
    Hooks.on("canvasReady", GameChangesHandler._addNoteListeners);
    Hooks.on("dropCanvasData", GameChangesHandler._dropActorFolder);
    Hooks.on("preCreateScene", GameChangesHandler._preCreateScene);
    Hooks.on("getSceneControlButtons", GameChangesHandler.sceneControls);
  }

  // Hooks on setup.
  static _setupGameChanges() {
    // Set note display to always on.
    game.settings.set("core", NotesLayer.TOGGLE_SETTING, true);
  }

  static _configChanges() {
    // Adjust spell schools.
    foundry.utils.mergeObject(CONFIG.DND5E.spellSchools, {
      divine: {
        fullKey: "divine",
        icon: "...svg",
        label: "DND5E.SchoolDivine",
        reference: ""
      }
    });

    // Adjust ability scores.
    CONFIG.DND5E.abilities.pty = {
      abbreviation: "pty",
      defaults: {vehicle: 0, npc: 1, character: 1},
      fullKey: "piety",
      label: "DND5E.AbilityPty",
      reference: "",
      type: "mental",
      improvement: false
    };

    // Adjust consumable item subtypes.
    foundry.utils.mergeObject(CONFIG.DND5E.consumableTypes, {
      drink: {label: "DND5E.ConsumableDrink"},
      elixir: {label: "DND5E.ConsumableElixir"},
      bomb: {label: "DND5E.ConsumableBomb"},
      trap: {label: "DND5E.ConsumableTrap"}
    });

    // Adjust languages.
    foundry.utils.mergeObject(CONFIG.DND5E.languages.standard.children, {
      cait: "DND5E.LanguagesCait"
    });

    // Adjust feature item subtypes.
    foundry.utils.mergeObject(CONFIG.DND5E.featureTypes.class.subtypes, {
      primordialEffect: "DND5E.ClassFeature.PrimordialEffect"
    });

    // Add to status conditions.
    CONFIG.statusEffects.push({
      id: "reaction",
      name: "ZHELL.StatusConditionReaction",
      icon: "assets/images/conditions/reaction.webp",
      duration: {rounds: 1},
      description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>"
    },
    {
      id: "rimed",
      name: "ZHELL.StatusConditionRimed",
      icon: "icons/magic/water/barrier-ice-water-cube.webp",
      description: "<p>Your movement speed has been reduced by 10 feet.</p>",
      changes: [{key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -10}]
    });
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
    };
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
    return ChatMessage.implementation.create({
      content: `Some of ${actor.name}'s items were destroyed:<ul>${content}</ul>`,
      speaker: ChatMessage.implementation.getSpeaker({actor})
    });
  }

  /**
   * Drop folder of actors.
   * @param {Canvas} canvas                   The targeted canvas.
   * @param {object} data                     The dragged data.
   * @returns {Promise<TokenDocument[]>}      The created token documents.
   */
  static async _dropActorFolder(canvas, data) {
    if (!game.user.isGM || (data.type !== "Folder")) return;
    const folder = await fromUuid(data.uuid);
    if (folder.type !== "Actor") return;
    const [x, y] = canvas.grid.getTopLeft(data.x, data.y);
    ui.notifications.info(`Dropping actors of '${folder.name}' folder.`);
    const tokens = await Promise.all(folder.contents.map(a => a.getTokenDocument({x, y})));
    const tokenData = tokens.map(token => token.toObject());
    return canvas.scene.createEmbeddedDocuments("Token", tokenData);
  }

  /**
   * Add a context menu options for when an actor item is right-clicked.
   * @param {Item5e} item         The item that is the target of the context menu.
   * @param {object[]} array      The array of context menu options.
   */
  static _addContextMenuOptions(item, array) {
    GameChangesHandler._moveItemToSharedInventory(item, array);
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
   * Rotate tokens when they move, unless their rotation is locked.
   * @param {TokenDocument} doc     The token document being updated.
   * @param {object} update         The update about to be performed.
   * @param {object} options        The options for the update.
   */
  static _rotateTokensOnMovement(doc, update, options) {
    if (doc.lockRotation || (options.animate === false)) return;
    const x = update.x ?? doc.x;
    const y = update.y ?? doc.y;
    if ((x === doc.x) && (y === doc.y)) return;
    const ray = new Ray(doc, {x, y});
    update.rotation = ray.angle * 180 / Math.PI - 90;
  }

  /**
   * Add a listener to the canvas to show journal page contents when clicking a dummy note.
   * @returns {Dialog}      A created dialog with the page's contents.
   */
  static _addNoteListeners() {
    canvas.app.stage.addEventListener("click", async function(event) {
      const object = event.interactionData?.object;
      if (!object) return;
      const isHover = object.interactionState === MouseInteractionManager.INTERACTION_STATES.HOVER;
      if (!isHover) return;
      const isNote = object instanceof Note;
      if (!isNote) return;
      const isActual = object.document.entryId || object.document.pageId;
      if (isActual) return;
      const src = object.document.flags[MODULE]?.source;
      if (!src) return;

      const page = await fromUuid(src);
      const id = object.document.uuid.replaceAll(".", "-");
      const isOpen = Object.values(ui.windows).find(e => e.id === id);
      if (isOpen) return;
      return Dialog.prompt({
        content: `<h1>${page.name}</h1>` + page.text.content,
        rejectClose: false,
        title: page.name,
        label: "Close",
        options: {id, classes: ["dialog", "note-util"]}
      });
    });
  }

  static sceneControls(array) {
    const token = array.find(a => a.name === "token");

    // Show Mayhem dialog.
    if (game.user.isGM) token.tools.push({
      name: "mayhem-dialog",
      title: "Mayhem",
      icon: "fa-solid fa-poo-storm",
      button: true,
      visible: true,
      onClick: mayhem
    });
  }
}
