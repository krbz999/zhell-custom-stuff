import {DEPEND, MODULE} from "../../const.mjs";

export class MurkScroller extends Application {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.item = options.item;
    this.speaker = options.speaker;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [MODULE, "murk-scroller"],
      template: "modules/zhell-custom-stuff/templates/murkScroller.hbs"
    });
  }

  get title() {
    return "Murk Scrolls";
  }

  get id() {
    return `murk-scrolls-${this.actor.uuid.replaceAll(".", "-")}`;
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.options = this.spellOptions;
    data.max = Math.ceil(this.actor.system.details.level / 2);
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelector("select").addEventListener("change", this._updateTotal.bind(this));
    html[0].querySelector("[data-action='add-row']").addEventListener("click", this._renderNewRow.bind(this));
    html[0].querySelector("[data-action='delete']").addEventListener("click", this._deleteRow.bind(this));
    html[0].querySelector("[data-action='create']").addEventListener("click", this.createScrolls.bind(this));
  }

  /**
   * Update the tracked total and tooltip when a dropdown has its value changed.
   */
  _updateTotal() {
    let level = 0;
    this.element[0].querySelectorAll("select").forEach(n => {
      const item = this.actor.items.get(n.value);
      level += (item?.system.level ?? 0);
      n.closest(".form-group").setAttribute("data-tooltip", item?.system.description.value || "");
    });
    this.element[0].querySelector(".level-track .current").innerText = level;
  }

  /**
   * Gather and return the options from the actor's available spells.
   * This method does not append it, simply returns the string.
   * @returns {string}      The options for a new select.
   */
  get spellOptions() {
    if (this._spellOptions) return this._spellOptions;
    const options = this.actor.items.filter(item => {
      return (item.type === "spell")
        && item.system.level.between(1, 5)
        && (item.system.activation.type === "action");
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    }).sort((a, b) => {
      return a.system.level - b.system.level;
    }).reduce((acc, item) => {
      return acc + `<option value="${item.id}">[${item.system.level}] ${item.name}</option>`;
    }, "<option value=''>&mdash; Choose a spell &mdash;</option>");
    this._spellOptions = options;
    return options;
  }

  /**
   * Append one new row to the form.
   * @param {PointerEvent} event      The initiating click event.
   */
  _renderNewRow(event) {
    const div = document.createElement("DIV");
    div.innerHTML = `
    <div class="form-group" data-tooltip-direction="LEFT">
      <label>Spell:</label>
      <div class="form-fields">
        <select>${this.spellOptions}</select>
        <a data-action="delete"><i class="fa-solid fa-trash"></i></a>
      </div>
    </div>`;
    div.querySelector("select").addEventListener("change", this._updateTotal.bind(this));
    div.querySelector("[data-action='delete']").addEventListener("click", this._deleteRow.bind(this));
    this.element[0].querySelector(".spells").appendChild(div.firstElementChild);
  }

  /**
   * Remove a row in the form.
   * @param {PointerEvent} event      The initiating click event.
   */
  _deleteRow(event) {
    event.currentTarget.closest(".form-group").remove();
    this._updateTotal();
  }

  /**
   * Create the Murk scrolls from the selections.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Item[]}                The array of created scrolls.
   */
  async createScrolls(event) {
    const target = event.currentTarget;
    target.disabled = true;
    const [v, m] = this.element[0].querySelectorAll(".level-track span");
    const value = Number(v.innerText.trim());
    const max = Number(m.innerText.trim());

    if (!(value > 0)) {
      ui.notifications.warn("You must create at least one scroll.");
      target.disabled = false;
      return null;
    }

    if (value > max) {
      ui.notifications.warn("The combined spell level is too high.");
      target.disabled = false;
      return null;
    }

    const selects = Array.from(this.element[0].querySelectorAll("select"));
    const itemData = await Promise.all(selects.map(s => this._createScroll(s.value)));

    if (!itemData.length) {
      ui.notifications.warn("The selections were somehow invalid.");
      target.disabled = false;
      return null;
    }

    const use = await this.item.use({}, {configureDialog: false});
    if (!use) {
      target.disabled = false;
      return null;
    }

    await this.close();

    await ChatMessage.create({
      speaker: this.speaker,
      content: `${this.actor.name.split(" ")[0]} created ${itemData.length} scrolls of Murk.`
    });
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  /**
   * Construct one specific object of scroll data. This method returns false if invalid.
   * @param {string} id     The id of the spell on the actor.
   * @returns {object}      The object of item data for the scroll.
   */
  async _createScroll(id) {
    const item = this.actor.items.get(id);
    if (!item) return false;
    const scroll = await Item.implementation.createScrollFromSpell(item);
    const scrollData = game.items.fromCompendium(scroll, {addFlags: false});
    scrollData.flags = {...scrollData.flags, ...item.flags};

    // Add concentration info.
    if (item.system.components.concentration) {
      const path = `flags.${DEPEND.CN}.data.requiresConcentration`;
      foundry.utils.setProperty(scrollData, path, true);
    }
    scrollData.name = scrollData.name.replace("Spell Scroll:", "Murk Scroll:");
    return scrollData;
  }
}
