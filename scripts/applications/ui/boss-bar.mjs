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
   * @type {Record<string, foundry.utils.Color>}
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
   * @type {foundry.documents.Actor|null}
   */
  get actor() {
    if (this._actor) return this._actor;

    let actor = null;
    const uuid = game.settings.get(ZHELL.id, "bossbar");
    if (uuid) actor = fromUuidSync(uuid);
    if (actor) actor.apps.bossbar = this;
    return this._actor = actor;
  }
  _actor = null;

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
      tempMaxPct: hp.tempmax ? Math.ceil(hp.tempmax / hp.effectiveMax * 100) : 0,
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

    const animate = (selector) => {
      const po = oldElement.querySelector(selector);
      const pn = newElement.querySelector(selector);
      if (po && pn) pn.animate([
        { width: po.style.width },
        { width: pn.style.width },
      ], { duration: 500, easing: "ease-in-out" });
    };

    animate(".progress.hp");
    animate(".progress.temp");
    animate(".progress.tempmax");
  }

  /* -------------------------------------------------- */

  /**
   * Register setting on init.
   */
  static register() {
    game.settings.register(ZHELL.id, "bossbar", {
      type: new foundry.data.fields.DocumentUUIDField({ type: "Actor" }),
      config: false,
      scope: "world",
      onChange: () => {
        if (ui.bossbar._actor) {
          delete ui.bossbar._actor.apps.bossbar;
          ui.bossbar._actor = null;
        }
        ui.bossbar.render();
      },
    });

    Hooks.once("ready", () => {
      ui.bossbar.render({ force: true });
      ui.bossbar.render = foundry.utils.debounce(ui.bossbar.render, 100);
    });

    Hooks.on("getSceneControlButtons", buttons => {
      Object.assign(buttons.tokens.tools, {
        setBoss: {
          button: true,
          icon: "fa-solid fa-spaghetti-monster-flying",
          name: "setBoss",
          onChange: () => ui.bossbar.setBoss(canvas.tokens.controlled[0]),
          order: 5,
          title: "ZHELL.BOSSBAR.setBoss",
          visible: game.user.isGM,
        },
      });
    });
  }

  /* -------------------------------------------------- */

  /**
   * Register an actor as the current boss.
   * @param {foundry.canvas.placeables.Token
   *  | foundry.documents.TokenDocument
   *  | foundry.documents.Actor} [subject]    The token or actor. If omitted, set to `null`.
   */
  setBoss(subject) {
    const actor = subject instanceof foundry.documents.Actor
      ? subject
      : subject instanceof foundry.documents.TokenDocument
        ? subject.actor
        : subject instanceof foundry.canvas.placeables.Token
          ? subject.actor
          : null;
    game.settings.set(ZHELL.id, "bossbar", actor ? actor.uuid : actor);
  }
}
