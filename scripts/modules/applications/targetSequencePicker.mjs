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
    this.range = range;
    this.links = links;
    this.callback = callback;
    this.sequence = [source.id];
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
    let lastToken;
    let valid = 0;
    const sequence = [];
    for (let i = 0; i < this.links; i++) {
      const token = canvas.scene.tokens.get(this.sequence[i]);
      if (token) {
        lastToken = token;
        valid++;
      }
      sequence.push({
        token,
        default: "icons/magic/symbols/question-stone-yellow.webp",
        next: i < this.links - 1
      });
    }
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
    this.sequence.push(id);
    return this.render();
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
    return a.scene.tokens.filter(b => this.withinRange(a, b.object)).sort((a, b) => {
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
