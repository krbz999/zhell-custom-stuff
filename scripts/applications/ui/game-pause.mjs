export default class GamePause extends CONFIG.ui.pause {
  /** @inheritdoc */
  async _prepareContext(options) {
    return {
      paused: game.paused,
      cssClass: game.paused ? "paused" : "",
      text: game.i18n.localize("GAME.Paused"),
      spin: false,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _renderHTML(context, options) {
    const flex = document.createElement("DIV");
    flex.classList.add("container");
    const fp = "assets/images/tiles/symbols/holy/havilon-{name}-gold.webp";

    const names = ["arepo", "peios", "veil", "thrizur", "draconiz", "anvil", "emissary", "murk"];
    names.sort(() => 0.5 - Math.random());

    let html = "";
    for (const k of names) html += `<img class="holy-symbol" src="${fp.replace("{name}", k)}">`;
    flex.innerHTML = html;

    const caption = document.createElement("figcaption");
    caption.innerText = context.text;
    return [flex, caption];
  }
}

/* -------------------------------------------------- */

/**
 * A faux hook to prevent dnd5e from modifying the pause application.
 */
Hooks.on("renderGamePause", () => {});
