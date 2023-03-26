import {MODULE} from "../../const.mjs";

/**
 * A custom dialog-esque application that lets a user pick from a set of image anchors.
 */
export class ImageAnchorPicker extends Application {

  /** @override */
  constructor(data) {
    super(data);
    this._data = data;
    this.allowMultiple = data.allowMultiple;
    this.callback = data.callback;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [MODULE, "image-selector"],
      height: "auto",
      width: 400,
      template: `modules/${MODULE}/templates/imageAnchorDialog.hbs`
    });
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.rows = {top: this._data.top ?? [], middle: this._data.middle ?? [], bottom: this._data.bottom ?? []};
    data.label = this._data.label ?? "OK";
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll(".image-selector a").forEach(n => n.addEventListener("click", this._onClickAnchor.bind(this)));
    html[0].querySelector("button").addEventListener("click", this._onClickButton.bind(this));
    for (const s of [".row.top", ".row.middle", ".row.bottom"]) {
      const row = html[0].querySelector(s);
      if (!row) continue;
      const count = row.childElementCount;
      row.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
      row.firstElementChild.classList.add("active");
    }
  }

  /**
   * Toggle the 'active' class on an anchor when clicked. If multiple are not allowed,
   * toggle off the same class on all other anchors in the same row.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickAnchor(event) {
    const wasActive = event.currentTarget.classList.contains("active");
    if (this.allowMultiple) {
      const length = event.currentTarget.closest(".row").querySelectorAll(".active").length;
      if ((length > 1) || !wasActive) event.currentTarget.classList.toggle("active");
    } else if (!wasActive) {
      for (const child of event.currentTarget.closest(".row").children) {
        child.classList.toggle("active", child === event.currentTarget);
      };
    }
  }

  /**
   * Collect the names from the dataset of the currently active anchors in each row, and pass
   * them to the given custom callback function. Then close the application.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickButton(event) {
    const data = {
      top: Array.from(this.element[0].querySelectorAll(".top .active")).map(u => u.dataset.name),
      middle: Array.from(this.element[0].querySelectorAll(".middle .active")).map(u => u.dataset.name),
      bottom: Array.from(this.element[0].querySelectorAll(".bottom .active")).map(u => u.dataset.name)
    }
    this.close();
    return this.callback(event, data);
  }
}
