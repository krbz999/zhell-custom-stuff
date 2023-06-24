import {MODULE} from "../../const.mjs";

export class BossBar extends Application {
  /**
   * @constructor
   * @param {TokenDocument} token     The token document whose actor's health is being shown.
   */
  constructor(token) {
    super();
    this.token = token;
    this.actor = token.actor;
    this.scene = token.parent;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      popOut: false,
      template: "modules/zhell-custom-stuff/templates/bossBar.hbs"
    });
  }

  /** @override */
  async getData() {
    const hp = this.actor.system.attributes.hp;
    const percent = `${Math.round((hp.value * 100 / hp.max))}%`;
    const color = new Color(Actor.implementation.getHPColor(hp.value, hp.max)).css;
    const name = this.actor.name;
    const right = (ui.sidebar.element.outerWidth() + 200) + "px";
    const sceneId = this.scene.id;
    const title = this.scene.flags[MODULE]?.bossBar?.title ?? null;
    return {percent, color, name, right, sceneId, title};
  }

  /** @override */
  async render(force = false, options = {}) {
    if (force) {
      document.querySelectorAll("#bossbar").forEach(bar => bar.remove());
      this.actor.apps["bossbar"] = this;
      await super.render(force, options);
      let el = null;
      while (!el) {
        el = this.element[0] ?? null;
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 100));
      el.style.opacity = 0.6;
      return this;
    } else {
      const {percent, color, name, title} = await this.getData();
      const bar = this.element[0].querySelector(".progress");
      bar.style.backgroundColor = color;
      bar.style.width = percent;
      bar.closest("#bossbar").querySelector(".name").innerText = name;
      bar.closest("#bossbar").querySelector(".title").innerText = title;
    }
  }

  static get isRendered() {
    return !!document.querySelector(`#bossbar[data-scene-id="${canvas.scene.id}"]`);
  }

  /**
   * Redisplay the bossbar when, e.g., refreshing the scene. Hooks on 'canvasReady'.
   * @param {Canvas} canvas     The rendered canvas.
   */
  static async _renderBossBarOnReady(canvas) {
    const scene = canvas.scene;
    const {tokenId, active} = scene.flags[MODULE]?.bossBar ?? {};
    const token = scene.tokens.get(tokenId);

    document.querySelectorAll("#bossbar").forEach(bar => bar.remove());
    if (active && token) return new BossBar(token).render(true);
  }

  /**
   * Render or remove the bossbar application. Hooks on 'updateScene'.
   * @param {Scene} scene         The updated scene.
   * @param {object} update       The update performed.
   * @param {object} options      An object of update options.
   */
  static async _renderBossBarOnSceneUpdate(scene, update, options) {
    if (!scene.isView) return;
    if (!options.bossBar) return;

    const data = scene.flags[MODULE]?.bossBar ?? {};
    const token = scene.tokens.get(data.tokenId);

    if (data.active && token) {
      if (!BossBar.isRendered) return new BossBar(token).render(true);
      return token.actor.apps["bossbar"].render();
    } else {
      const bars = document.querySelectorAll(`#bossbar[data-scene-id="${scene.id}"]`);
      bars.forEach(async (bar) => {
        bar.style.opacity = 0;
        await new Promise(r => setTimeout(r, 2000));
        bar.remove();
      });
    }
  }
}
