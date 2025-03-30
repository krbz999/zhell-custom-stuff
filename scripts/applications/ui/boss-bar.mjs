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
   * Colors used for token bars and the bossbar.
   * @type {Record<string, Color>}
   */
  static get COLORS() {
    return this.#COLORS ??= Object.fromEntries(
      Object.entries(CONFIG.DND5E.tokenHPColors).map(([k, v]) => [k, new foundry.utils.Color(v)]),
    );
  }
  static #COLORS;

  /* -------------------------------------------------- */

  /**
   * The current 'boss'.
   * @type {Actor|null}
   */
  get actor() {
    const actor = this._actor ??= game.settings.get(ZHELL.id, "bossbar")?.() ?? null;
    if (actor) actor.apps.bossbar = this;
    return actor;
  }
  _actor;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const actor = this.actor;
    if (!actor) return { active: false };
    const hp = actor.system.attributes.hp;
    return {
      actor, hp,
      colors: BossBar.COLORS,
      active: true,
      hpColor: actor.constructor.getHPColor(hp.value, hp.effectiveMax),
      tempPct: hp.temp ? Math.ceil(hp.temp / hp.effectiveMax * 100) : 0,
      tempMaxPct: hp.tempmax ? Math.ceil(hp.tempmax, hp.effectiveMax) : 0,
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

    let po;
    let pn;

    const animate = () => {
      if (po && pn) pn.animate([
        { width: po.style.width },
        { width: pn.style.width },
      ], { duration: 500, easing: "ease-in-out" });
    };

    po = oldElement.querySelector(".progress.hp");
    pn = newElement.querySelector(".progress.hp");
    animate();

    po = oldElement.querySelector(".progress.temp");
    pn = newElement.querySelector(".progress.temp");
    animate();

    po = oldElement.querySelector(".progress.tempmax");
    pn = newElement.querySelector(".progress.tempmax");
    animate();
  }

  /* -------------------------------------------------- */

  /**
   * Register setting on init.
   */
  static register() {
    game.settings.register(ZHELL.id, "bossbar", {
      type: new foundry.data.fields.ForeignDocumentField(foundry.documents.Actor),
      config: false,
      scope: "world",
      onChange: () => {
        delete ui.bossbar.actor?.apps.bossbar;
        delete ui.bossbar._actor;
        ui.bossbar.render();
      },
    });

    const { Hooks } = foundry.helpers;
    Hooks.once("ready", () => ui.bossbar.render({ force: true }));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  close(...args) {
    // We don't close this application.
  }

  /* -------------------------------------------------- */

  /**
   * Register an actor as the current boss.
   * @param {Token|TokenDocument|Actor} subject   The token or actor.
   */
  static async setBoss(subject) {
    const actor = subject instanceof foundry.documents.Actor
      ? subject
      : subject instanceof foundry.documents.TokenDocument
        ? subject.actor
        : subject instanceof foundry.canvas.placeables.Token
          ? subject.actor
          : null;
    if (!actor) return false;
    await game.settings.set(ZHELL.id, "bossbar", actor.id);
    return true;
  }
}
