export default class SuperWeebAttackGenerator extends PIXI.Container {
  /**
   * @param {foundry.canvas.placeables.Token} token
   */
  static onRefreshToken(token) {
    const container = new SuperWeebAttackGenerator();
    container.bounds = new PIXI.Rectangle();
    container.interaction = container.addChild(new PIXI.Container());
    container.interaction.hitArea = container.bounds;
    container.border = container.addChild(new PIXI.smooth.SmoothGraphics());
    token.addChild(container);

    // Add damage icons
    const size = Math.max(15, token.bounds.width / 4);
    const types = token.actor?.getFlag(ZHELL.id, "swag.types") ?? [];
    let index = -1;

    const s = canvas.dimensions.uiScale;
    const borderThickness = CONFIG.Canvas.objectBorderThickness * s;
    const bg = new PIXI.Graphics().beginFill(0x000000, 0.4).lineStyle(s, 0x000000);
    container.interaction.addChild(bg);
    bg.zIndex = -1;
    for (const [i, { type, disabled }] of types.entries()) {
      if (disabled) continue;
      index++;
      const icon = container.interaction.addChild(new PIXI.Sprite(SuperWeebAttackGenerator.textures.get(type)));
      icon.width = icon.height = size;
      icon.position.set(index * size, -(size + borderThickness));
      icon.index = i;
      icon.zIndex = i;
      bg.drawRoundedRect(icon.x + s, icon.y + s, size - 2 * s, size - 2 * s, 2 * s);
    }

    container.position.set((token.bounds.width - container.width) / 2, 0);

    const uuid = token.objectId;
    SuperWeebAttackGenerator.attacks.get(uuid)?.destroy();
    SuperWeebAttackGenerator.attacks.set(uuid, container);
  }

  /* -------------------------------------------------- */

  /**
   * @param {foundry.canvas.placeables.Token} token
   */
  static onDestroyToken(token) {
    const uuid = token.objectId;
    SuperWeebAttackGenerator.attacks.get(uuid)?.destroy();
    SuperWeebAttackGenerator.attacks.delete(uuid);
  }

  /* -------------------------------------------------- */

  /**
   * Preload all the damage type icons.
   * @returns {Promise<void>}
   */
  static async preloadTextures() {
    const promises = Object.entries(CONFIG.DND5E.damageTypes).map(async ([type, { icon, color }]) => {
      const blob = await foundry.utils.fetchResource(icon);
      const text = await blob.text();
      const template = document.createElement("DIV");
      template.innerHTML = text;
      /** @type {SVGElement} */
      const svg = template.firstElementChild;
      svg.style.setProperty("--icon-fill", color.css);

      const svgString = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
      const base = new PIXI.BaseTexture(img, { width: 256, height: 256 });
      return [type, new PIXI.Texture(base)];
    });
    const results = await Promise.all(promises);
    for (const [k, v] of results) SuperWeebAttackGenerator.textures.set(k, v);
  }

  /* -------------------------------------------------- */

  /**
   * Preloaded damage type icons.
   * @type {Map<string, PIXI.Texture>}
   */
  static textures = new Map();

  /* -------------------------------------------------- */

  /**
   * Stored pixi elements by token document uuids.
   * @type {Map<string, SuperWeebAttackGenerator>}
   */
  static attacks = new Map();

  /* -------------------------------------------------- */

  /**
   * Set up a fresh loadout.
   * @param {foundry.documents.Actor} actor   The actor to update.
   * @param {string[]} [types=[]]             The damage types. Will override any current types entirely.
   * @returns {Promise<foundry.documents.Actor>}
   */
  static addLoadout(actor, types = []) {
    types = types.filter(type => type in CONFIG.DND5E.damageTypes);
    types = types.map(type => ({ type }));
    return actor.setFlag(ZHELL.id, "swag.types", types);
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the loadout after having taken damage of given types.
   * @param {foundry.documents.Actor} actor   The actor to update.
   * @param {string[]} [types=[]]             The damage types.
   * @returns {Promise<foundry.documents.Actor>}
   */
  static applyDamageTypes(actor, types = []) {
    const swags = actor.getFlag(ZHELL.id, "swag.types");
    if (!swags?.length) return;
    const update = foundry.utils.deepClone(swags);
    for (const type of types) {
      const dmg = update.find(d => (d.type === type) && !d.disabled);
      if (dmg) dmg.disabled = true;
    }
    return actor.setFlag(ZHELL.id, "swag.types", update);
  }
}

/* -------------------------------------------------- */

Hooks.once("init", SuperWeebAttackGenerator.preloadTextures);
Hooks.on("refreshToken", SuperWeebAttackGenerator.onRefreshToken);
Hooks.on("destroyToken", SuperWeebAttackGenerator.onDestroyToken);

Hooks.on("dnd5e.calculateDamage", function(actor, damages, options) {
  options.__damages = damages;
});
Hooks.on("dnd5e.applyDamage", function(actor, amount, options) {
  const types = options.__damages?.map(d => d.type);
  if (types?.length) SuperWeebAttackGenerator.applyDamageTypes(actor, types);
});
