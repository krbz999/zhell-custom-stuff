import {MODULE} from "../../const.mjs";

export class HeartContainers extends Application {
  /**
   * @constructor
   * @param {User} user     The current user.
   */
  constructor(user) {
    super();
    this.user = user;
    this.active = true;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      resizeable: false,
      popOut: false,
      minimizable: false,
      id: `${MODULE}-heart-containers`,
      template: "modules/zhell-custom-stuff/templates/heartContainers.hbs"
    });
  }

  /**
   * Get the character of the related user.
   * @returns {Actor}     The user's assigned actor.
   */
  get actor() {
    return this.user.character;
  }

  /** @override */
  async getData() {
    this.hp = foundry.utils.deepClone(this.actor.system.attributes.hp);

    /** The total number of hearts. */
    const total = Math.ceil((this.hp.max + this.hp.tempmax) / 10);
    const hearts = [];
    for (let i = 1; i <= total; i++) {
      const isEmpty = i > Math.ceil(this.hp.value / 10);
      const pulse = !isEmpty && (i + 1 > Math.ceil(this.hp.value / 10));
      const data = {
        isYellow: i > total - Math.ceil(this.hp.tempmax / 10),
        isEmpty,
        pulse,
        isRed: i <= Math.ceil(Math.min(this.hp.value, this.hp.max) / 10)
      };
      hearts.push(data);
    }
    const tempHearts = Array(Math.ceil(this.hp.temp / 10)).fill(0);

    return {hearts, tempHearts, active: this.active};
  }

  /** @override */
  render(force = false, options = {}) {
    this.actor.apps[this.appId] = this;
    return super.render(force, options);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("[data-action='toggle']").addEventListener("click", this._onToggle.bind(this));
  }

  /**
   * Handle toggling the 'active' class on the button to hide/show the hearts.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onToggle(event) {
    event.currentTarget.classList.toggle("active");
    this.active = event.currentTarget.classList.contains("active");
  }

  /**
   * Initial rendering method for this application.
   * @returns {HeartContainers}     An instance of this application.
   */
  static createApplication() {
    const user = game.user;
    if (user.character) {
      return new HeartContainers(user).render(true);
    }
  }
}
