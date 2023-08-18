import {MODULE} from "../../const.mjs";

export class TargetSequencePicker extends Application {
  /**
   * @constructor
   * @param {Token|TokenDocument} source        The source token or token document.
   * @param {number} range                      The max distance between targets.
   * @param {number} links                      The maximum number of links to make.
   * @param {Function} callback                 A function that does something with the token ids.
   * @param {boolean} [unique=false]            Whether the same target can be picked twice.
   * @param {boolean} [includeSource=true]      Include the source as the first target?
   * @param {number} [maxDistance=Infinity]     The maximum distance from the source.
   */
  constructor(config) {
    super();
    this.range = config.range;
    this.links = config.links;
    this.callback = config.callback;
    this.unique = config.unique ?? false;
    this.includeSource = config.includeSource ?? true;
    this.source = config.source;
    this.maxDistance = config.maxDistance ?? Infinity;

    const seq = this.includeSource ? [this.source.id] : [];
    this.sequence = this.unique ? new Set(seq) : seq;
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
    let lastToken = null;
    let valid = 0;

    const defaultImg = "icons/magic/symbols/question-stone-yellow.webp";
    const sequence = this.sequence.reduce((acc, id, idx) => {
      const token = canvas.scene.tokens.get(id);
      if (token) {
        lastToken = token;
        valid++;
      }
      acc[idx] = {token, default: defaultImg};
      return acc;
    }, new Array(this.links).fill({default: defaultImg}));

    const canAdd = valid < this.links;
    const targets = this.gatherWithinRange(lastToken);
    return {sequence, canAdd, targets};
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action='add-target']").forEach(n => {
      n.addEventListener("click", this._addTarget.bind(this));
    });
    html[0].querySelector("[data-action='submit']").addEventListener("click", this.submit.bind(this));
  }

  /**
   * Handle clicking an inactive img.
   * @param {PointerEvent} event      The initiating click event.
   */
  _addTarget(event) {
    const id = event.currentTarget.dataset.tokenId;
    if (this.unique) this.sequence.add(id);
    else this.sequence.push(id);
    return this.render();
  }

  /**
   * Get all token placeables within range of a token.
   * @param {Token|TokenDocument} a     A central token.
   * @returns {TokenDocument[]}         An array of token documents within range.
   */
  gatherWithinRange(a) {
    if (a !== null) a = a.object ?? a;
    return canvas.scene.tokens.reduce((acc, token) => {
      // Do not include the token itself when finding others near it.
      if (a && (a === token.object)) return acc;

      // Do not include a token already in the sequence.
      if (this.unique && this.sequence.has(token.id)) return acc;

      if (Number.isFinite(this.maxDistance) && (this.maxDistance > 0)) {
        const range = babonus.getMinimumDistanceBetweenTokens(this.source, token.object);
        if (range > this.maxDistance) return acc;
      }

      // Include a token if it is within range.
      const range = babonus.getMinimumDistanceBetweenTokens(a ?? this.source, token.object);
      if (range <= this.range) acc.push(token);

      return acc;
    }, []).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Handle clicking the finalize button.
   * @param {PointerEvent} event      The initiating click event.
   */
  submit(event) {
    const tokenIds = this.sequence.reduce((acc, id, idx) => {
      acc[idx] = id;
      return acc;
    }, {});
    if (this.callback instanceof Function) this.callback(tokenIds);
    this.close();
  }

  /** @override */
  async close() {
    if (this.callback instanceof Function) this.callback(null);
    return super.close();
  }

  /**
   * Create an instance of this application and wait for the callback.
   * @returns {Promise<object|null>}      An object of token ids, or null if closed.
   */
  static async wait(config) {
    return new Promise(resolve => {
      new TargetSequencePicker({...config, callback: resolve}).render(true);
    });
  }
}
