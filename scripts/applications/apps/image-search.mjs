/** @import { ImageResult } from "../../_types.mjs" */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class ImageSearch extends HandlebarsApplicationMixin(Application) {
  /**
   * Set up an index of keywords for every file in the directory.
   * @returns {Promise<void|null>}
   */
  static async _createFilePickerIndex() {
    if (ImageSearch.#fetched) return null;

    const imageResults = [];
    const extensions = new Set(Object.keys(CONST.FILE_CATEGORIES.IMAGE));
    const FilePicker = foundry.applications.apps.FilePicker.implementation;

    /**
     * Helper method for recursive indexing.
     * @param {string} path
     * @param {boolean} [root=false]
     * @param {string} [store='public']
     * @returns {Promise<void>}
     */
    const _createFilePickerIndex = async (path, root = false, store = "public") => {
      const browse = await FilePicker.browse(store, path);

      if (!root) {
        for (const file of browse.files) {
          const ext = file.split(".").at(-1);
          if (extensions.has(ext)) {
            const words = ImageSearch.getKeywords(file);
            if (words.size) {
              imageResults.push({
                filePath: file,
                keywords: words,
                label: foundry.audio.AudioHelper.getDefaultSoundName(file),
                core: store === "public",
              });
            }
          }
        }
      }

      for (const dir of browse.dirs) await _createFilePickerIndex(dir, false, store);
    };

    await _createFilePickerIndex("icons", true);
    await _createFilePickerIndex(`systems/${game.system.id}`, true, "data");
    await _createFilePickerIndex("modules", true, "data");
    await _createFilePickerIndex("assets/images", true, "data");

    ImageSearch.#fetched = imageResults;
  }

  /* -------------------------------------------------- */

  /**
   * Words that should be entirely ignored.
   * @type {Set<string>}
   */
  static STOP_WORDS = new Set(["a", "and", "in", "of", "the", "to"]);

  /* -------------------------------------------------- */

  /**
   * Fetched and cached results.
   * @type {ImageResult[]}
   */
  static #fetched;

  /* -------------------------------------------------- */

  /**
   * Pixel distance from the bottom before inserting additional results.
   * @type {number}
   */
  static BATCH_MARGIN = 100;

  /* -------------------------------------------------- */

  /**
   * The size of batches of results to insert at a time.
   * @type {number}
   */
  static BATCH_SIZE = 30;

  /* -------------------------------------------------- */

  /**
   * Found results. This property is re-assigned each time 'results' is re-rendered.
   * @type {Iterator}
   */
  #results;

  /* -------------------------------------------------- */

  /**
   * Is inserting batched results currently in progress?
   * @type {boolean}
   */
  #renderThrottle = false;

  /* -------------------------------------------------- */

  /**
   * The filters.
   * @type {object}
   */
  #filters = {
    keywords: new Set(),
    min: null,
    results: null,
    core: true,
  };

  /* -------------------------------------------------- */

  /**
   * Selected image filepaths.
   * @type {string[]}
   */
  get selected() {
    return [...this.#selected];
  }

  /* -------------------------------------------------- */

  /**
   * Selected image filepaths.
   * @type {Set<string>}
   */
  #selected = new Set();

  /* -------------------------------------------------- */

  /**
   * Get the next batch of results.
   * @returns {object[]}    Array of results.
   */
  #getNextBatch() {
    return [...this.#results.take(ImageSearch.BATCH_SIZE)];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["zhell-custom-stuff", "image-search"],
    tag: "form",
    window: {
      resizable: true,
      title: "ZHELL.IMAGE_SEARCH.TITLE",
      icon: "fa-solid fa-panorama",
      contentClasses: ["standard-form"],
    },
    position: {
      width: 1400,
      height: 1200,
    },
    form: {
      closeOnSubmit: true,
    },
    actions: {
      showImage: ImageSearch.#showImage,
      selectImage: ImageSearch.#selectImage,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    filters: {
      template: "modules/zhell-custom-stuff/templates/apps/image-search/filters.hbs",
      scrollable: [""],
    },
    images: {
      template: "modules/zhell-custom-stuff/templates/apps/image-search/images.hbs",
      templates: ["modules/zhell-custom-stuff/templates/apps/image-search/image.hbs"],
      scrollable: [".scrollable"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {};

    if (options.parts.includes("filters")) {
      const f = context.filters = {};
      f.keywords = {
        field: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
        value: this.#filters.keywords,
        dataset: { change: "keywords" },
      };
      f.min = {
        field: new foundry.data.fields.NumberField(),
        value: (this.#filters.min === 1) ? null : this.#filters.min,
        dataset: { change: "min" },
      };
      f.results = {
        field: new foundry.data.fields.NumberField(),
        value: this.#filters.results,
        dataset: { change: "results" },
      };
      f.core = {
        field: new foundry.data.fields.BooleanField(),
        value: this.#filters.core,
        dataset: { change: "core" },
      };

      context.selected = this.selected;
    }

    if (options.parts.includes("images")) {
      await ImageSearch._createFilePickerIndex();

      let results = foundry.utils.deepClone(ImageSearch.#fetched);
      for (const result of results) {
        result.score = ImageSearch.getScore(result.keywords, this.#filters.keywords);
        result.selected = this.#selected.has(result.filePath);
      }

      context.hasKeywords = this.#filters.keywords.size;
      if (context.hasKeywords) {
        results = results
          .filter(r => r.score >= (this.#filters.min ?? 1))
          .sort((a, b) => b.score - a.score);
      }

      if (this.#filters.core) results = results.filter(result => result.core);

      // Show only a limited number of results if restricted.
      if (this.#filters.results > 0) results.splice(this.#filters.results);

      this.#results = Iterator.from(results);
      context.images = this.#getNextBatch();
    }

    if (options.parts.includes("footer")) {
      context.buttons = [{ type: "submit", label: "ZHELL.IMAGE_SEARCH.CONFIRM", icon: "fa-solid fa-portrait" }];
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);

    if (partId === "filters") {
      for (const el of element.querySelectorAll("[data-change]")) {
        el.addEventListener("change", event => ImageSearch.#onChangeFilterInput.call(this, event, el));
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachFrameListeners(...args) {
    super._attachFrameListeners(...args);

    this.element.addEventListener("scroll", ImageSearch.#insertResultsWhenScrolling.bind(this), {
      capture: true, passive: true,
    });
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Record changes to filters and act on them.
   * @this {ImageSearch}
   * @param {ChangeEvent} event     Initiating change event.
   * @param {HTMLElement} target    The element that defined the [data-change].
   */
  static #onChangeFilterInput(event, target) {
    switch (target.dataset.change) {
      case "results":
        this.#filters.results = Math.max(target.valueAsNumber || 1, 1);
        if (this.#filters.results === 1) this.#filters.results = null;
        this.render({ parts: ["images"] });
        break;

      case "min":
        this.#filters.min = Math.max(target.valueAsNumber || 1, 1);
        if (this.#filters.min === 1) this.#filters.min = null;
        this.render({ parts: ["images"] });
        break;

      case "keywords":
        this.#filters.keywords = new Set(target.value);
        this.render({ parts: ["images"] });
        break;

      case "core":
        this.#filters.core = target.checked;
        this.render({ parts: ["images"] });
        break;
    }
  }

  /* -------------------------------------------------- */

  /**
   * When scrolling to the bottom of the list of results, insert more results.
   * @this {ImageSearch}
   * @param {WheelEvent} event    Initiating wheel event.
   */
  static async #insertResultsWhenScrolling(event) {
    if (this.#renderThrottle) return;

    const target = event.target.closest("[data-application-part=images]");
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollTop + clientHeight < scrollHeight - ImageSearch.BATCH_MARGIN) return;

    this.#renderThrottle = true;
    const template = ImageSearch.PARTS.images.templates[0];
    const batch = await Promise.all(
      this.#getNextBatch().map(k => {
        k.selected = this.#selected.has(k.filePath);
        return foundry.applications.handlebars.renderTemplate(template, k);
      }),
    );
    target.querySelector(".scrollable").insertAdjacentHTML("beforeend", batch.join(""));
    this.#renderThrottle = false;
  }

  /* -------------------------------------------------- */

  /**
   * Show an image as a popout.
   * @this {ImageSearch}
   * @param {PointerEvent} event          Initiating click event.
   * @param {HTMLButtonElement} target    The button that defined the [data-action].
   */
  static #showImage(event, target) {
    const src = target.closest("[data-src]").dataset.src;
    const caption = target.closest("[data-caption]").dataset.caption;
    const application = new foundry.applications.apps.ImagePopout({
      src,
      caption: src,
      window: { title: caption },
    });
    application.render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Toggle an image selection.
   * @this {ImageSearch}
   * @param {PointerEvent} event          Initiating click event.
   * @param {HTMLButtonElement} target    The button that defined the [data-action].
   */
  static #selectImage(event, target) {
    const src = target.closest("[data-src]").dataset.src;
    if (this.#selected.has(src)) this.#selected.delete(src);
    else this.#selected.add(src);
    this.element.querySelector(`figure[data-src="${src}"]`)?.classList.toggle("selected", this.#selected.has(src));
    this.render({ parts: ["filters"] });
  }

  /* -------------------------------------------------- */
  /*   Public Interface                                 */
  /* -------------------------------------------------- */

  /**
   * Get match score between two keywords.
   * @param {Set<string>} one     First keywords.
   * @param {Set<string>} other   Other keywords.
   * @returns {number}            The score.
   */
  static getScore(one, other) {
    let score = 0;

    one = new Set(Array.from(one).sort((a, b) => b.length - a.length));
    other = new Set(Array.from(other).sort((a, b) => b.length - a.length));

    const intersection = one.intersection(other);
    for (const i of intersection) {
      one.delete(i);
      other.delete(i);
      score += 30;
    }

    for (const o of [...one]) for (const t of other)
      if (o.includes(t) || t.includes(o)) {
        one.delete(o);
        other.delete(t);
        score += 20;
      }

    for (const o of one) for (const t of other) {
      const l = ImageSearch.levenshtein(o, t);
      const threshold = Math.max(2, Math.ceil(o.length * 0.3));
      if (l <= threshold) score += 5;
    }

    return score;
  }

  /* -------------------------------------------------- */

  /**
   * Get keywords from a file name.
   * @param {string} path     Full or partial file path.
   * @returns {Set<string>}   Keywords.
   */
  static getKeywords(path) {
    path = path.replaceAll("/", "-");
    const name = foundry.audio.AudioHelper.getDefaultSoundName(path);
    const words = name.split(" ")
      .map(w => w.toLowerCase().trim())
      .filter(w => (w.length >= 3) && !ImageSearch.STOP_WORDS.has(w) && !/\d+/.test(w));
    return new Set(words);
  }

  /* -------------------------------------------------- */

  /**
   * Computes the Levenshtein distance between two strings.
   * https://en.wikipedia.org/wiki/Levenshtein_distance
   * Based on this code excerpt by AmitDiwan: https://www.tutorialspoint.com/levenshtein-distance-in-javascript
   * @param {string} a    First string.
   * @param {string} b    Other string.
   * @returns {number}    Levenshtein distance.
   */
  static levenshtein(a, b) {
    if (!a) return b.length;
    if (!b) return a.length;

    a = a.toLowerCase();
    b = b.toLowerCase();

    const matrix = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = (a[j - 1] === b[i - 1]) ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }

    return matrix[b.length][a.length];
  }

  /* -------------------------------------------------- */

  /**
   * Request an image.
   * @returns {Promise<string[]>}   A promise that resolves to selected image filepaths.
   */
  static async create() {
    const application = new ImageSearch();
    const { promise, resolve } = Promise.withResolvers();
    application.addEventListener("close", () => resolve(application.selected), { once: true });
    application.render({ force: true });
    return promise;
  }
}
