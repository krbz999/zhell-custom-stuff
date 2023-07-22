import {MODULE} from "../../const.mjs";

export class TargetSequencePicker extends Application {
  /**
   * @constructor
   * @param {Token|TokenDocument} source      The source token or token document.
   * @param {number} range                    The max distance between targets.
   * @param {number} links                    The maximum number of links to make.
   * @param {Function} [callback]             A function that does something with the token ids.
   */
  constructor(source, range, links, callback) {
    super();
    this.source = source.object ?? source;
    this.range = range;
    this.links = links;
    this.link = 1;
    this.callback = callback;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      resizeable: false,
      minimizable: false,
      id: `${MODULE}-target-sequence-picker`,
      template: "modules/zhell-custom-stuff/templates/targetSequencePicker.hbs",
      classes: [MODULE, "target-sequence"],
      title: game.i18n.localize("ZHELL.TargetSequencePicker")
    });
  }

  /** @override */
  async getData() {
    return {src: this.source, targets: this.gatherWithinRange(this.source)};
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].addEventListener("click", this._onToggle.bind(this));
    html[0].querySelector("[data-action='submit']").addEventListener("click", this.submit.bind(this));
  }

  /**
   * Handle clicking an inactive img.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onToggle(event) {
    const img = event.target.closest("img:not(.active)");
    if (!img) return;
    img.classList.toggle("active");
    img.closest(".level").querySelectorAll("img:not(.active)").forEach(i => i.classList.toggle("inactive"));
    const tokens = this.gatherWithinRange(this.source.scene.tokens.get(img.dataset.tokenId));
    return this.constructLevel(tokens);
  }

  /**
   * Are a and b two different tokens within a certain distance from each other?
   * @param {Token} a       One token.
   * @param {Token} b       Another token.
   * @returns {boolean}     Whether they are within range of each other.
   */
  withinRange(a, b) {
    return (a !== b) && babonus.getMinimumDistanceBetweenTokens(a, b) <= this.range;
  }

  /**
   * Get all token placeables within range of a token.
   * @param {Token|TokenDocument} a     A central token.
   * @returns {TokenDocument[]}         An array of token documents within range.
   */
  gatherWithinRange(a) {
    a = a.object ?? a;
    return a.scene.tokens.filter(b => this.withinRange(a, b.object));
  }

  /**
   * Construct and inject a new 'level' in the application.
   * @param {TokenDocument[]} tokens      An array of token documents to show at this level.
   */
  constructLevel(tokens) {
    const level = this.element[0].querySelector(`[data-level="${this.link}"]`);
    this.link++;
    if (this.link >= this.links) return;
    const div = document.createElement("DIV");
    div.dataset.level = this.link;
    div.classList.add("level");
    div.innerHTML = tokens.reduce((acc, token) => {
      return acc + `<img src="${token.texture.src}" data-tooltip="${token.name}" data-token-id="${token.id}">`;
    }, `<span class="label">${this.link.ordinalString()} Target</span><div class="images">`) + "</div>";
    level.after(div);
  }

  /**
   * Handle clicking the finalize button.
   * @param {PointerEvent} event      The initiating click event.
   */
  submit(event) {
    const tokenIds = {};
    for (const level of this.element[0].querySelectorAll("[data-level]")) {
      const id = level.querySelector(".active")?.dataset.tokenId;
      if (id) tokenIds[level.dataset.level] = id;
    }
    this.close();
    return (this.callback instanceof Function) ? this.callback(tokenIds) : tokenIds;
  }

  /**
   * Initial rendering method for this application.
   * @returns {TargetSequencePicker}      An instance of this application.
   */
  static createApplication(token, range, links, callback) {
    if (token && (range > 0) && (links > 0)) return new TargetSequencePicker(token, range, links, callback).render(true);
  }
}
