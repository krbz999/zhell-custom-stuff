export class GameChangesHandler {
  // Hooks on init.
  static init() {
    GameChangesHandler._configChanges();

    Hooks.on("preUpdateToken", GameChangesHandler._rotateTokensOnMovement);
    Hooks.on("dnd5e.restCompleted", GameChangesHandler._restItemDeletion);
    Hooks.on("canvasReady", GameChangesHandler._addNoteListeners);
    Hooks.on("dropCanvasData", GameChangesHandler._dropActorFolder);
    Hooks.on("preCreateScene", GameChangesHandler._preCreateScene);
  }

  static _configChanges() {
    // Adjust ability scores.
    CONFIG.DND5E.abilities.pty = {
      abbreviation: "pty",
      defaults: { vehicle: 0, npc: 1, character: 1 },
      fullKey: "piety",
      label: "ZHELL.ABILITY.PIETY",
      reference: "",
      type: "mental",
      improvement: false,
    };

    // Add to status conditions.
    CONFIG.DND5E.conditionTypes.reaction = {
      id: "reaction",
      name: "ZHELL.CONDITION.REACTION.NAME",
      img: "assets/images/conditions/reaction.webp",
      duration: { rounds: 1 },
      description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>",
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
    const { ids, content } = actor.items.reduce((acc, item) => {
      if (item.flags[ZHELL.id]?.[property]) {
        acc.ids.push(item.id);
        acc.content += `<li>${item.name}</li>`;
      }
      return acc;
    }, { ids: [], content: "" });
    if (!ids.length) return;
    await actor.deleteEmbeddedDocuments("Item", ids);
    return ChatMessage.implementation.create({
      content: `Some of ${actor.name}'s items were destroyed:<ul>${content}</ul>`,
      speaker: ChatMessage.implementation.getSpeaker({ actor }),
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
    const tokens = await Promise.all(folder.contents.map(a => a.getTokenDocument({ x, y })));
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
        },
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
      grid: { type: 2, alpha: 0.1 },
      padding: 0.05,
      fogExploration: false,
      globalLight: true,
      backgroundColor: "#000000",
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
    // not needed with v13
    // if (doc.lockRotation || (options.animate === false)) return;
    // const x = update.x ?? doc.x;
    // const y = update.y ?? doc.y;
    // if ((x === doc.x) && (y === doc.y)) return;
    // const ray = new Ray(doc, {x, y});
    // update.rotation = ray.angle * 180 / Math.PI - 90;
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
      const src = object.document.flags[ZHELL.id]?.source;
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
        options: { id, classes: ["dialog", "note-util"] },
      });
    });
  }
}
