const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class BossBar extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "boss-bar",
    window: {
      frame: false,
      positioned: false,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    bar: {
      template: "modules/zhell-custom-stuff/templates/ui/boss-bar.hbs",
      classes: ["boss-bar"],
      root: false,
    },
  };

  /* -------------------------------------------------- */

  /**
   * The current 'boss'.
   * @type {Actor|null}
   */
  get actor() {
    return game.settings.get(ZHELL.id, "bossBar")?.() ?? null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const actor = this.actor;
    if (!actor) return { active: false };
    const hp = actor.system.attributes.hp;
    return {
      actor, hp,
      active: true,
      color: actor.constructor.getHPColor(hp.value, hp.effectiveMax),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _insertElement(element) {
    const existing = document.getElementById(element.id);
    if (existing) existing.replaceWith(element);
    else document.querySelector("#ui-top").insertAdjacentElement("beforeend", element);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _syncPartState(partId, newElement, oldElement, state) {
    super._syncPartState(partId, newElement, oldElement, state);
    const po = oldElement.querySelector(".progress");
    const pn = newElement.querySelector(".progress");
    if (po && pn) pn.animate([
      { width: po.style.width },
      { width: pn.style.width },
    ], { duration: 500, easing: "ease-in-out" });
  }

  /* -------------------------------------------------- */

  /**
   * Register setting on init.
   */
  static register() {
    game.settings.register(ZHELL.id, "bossBar", {
      type: new foundry.data.fields.ForeignDocumentField(foundry.documents.Actor),
      config: false,
      scope: "world",
      onChange: () => ui.bossBar.render(),
    });

    const { Hooks } = foundry.helpers;
    // TODO: Change how this works to use events in v14. https://github.com/foundryvtt/foundryvtt/issues/11980
    Hooks.on("dnd5e.damageActor", BossBar.#onDamageHealActor);
    Hooks.on("dnd5e.healActor", BossBar.#onDamageHealActor);
    Hooks.once("ready", () => ui.bossBar.render({ force: true }));
  }

  /* -------------------------------------------------- */

  /**
   * Update the boss bar when its actor is damaged or healed.
   * @this {BossBar}
   * @param {Actor} actor   The actor that was damaged.
   */
  static #onDamageHealActor(actor) {
    if (actor !== ui.bossBar.actor) return;
    ui.bossBar.render();
  }
}
