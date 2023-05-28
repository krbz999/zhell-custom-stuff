import {MODULE} from "../../const.mjs";

export class WhisperPlayers extends Application {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `modules/${MODULE}/templates/whisperDialog.hbs`,
      title: "Whisper",
      classes: [MODULE, "whisper-dialog"],
      id: `${MODULE}-whisper-dialog`
    });
  }

  /** @override */
  async getData() {
    const users = game.users.filter(u => u.id !== game.user.id);
    const characterIds = users.reduce((acc, u) => {
      if (u.character?.id) acc.push(u.character.id);
      return acc;
    }, [])
    const selectedPlayerIds = canvas.tokens.controlled.reduce((acc, token) => {
      if (characterIds.includes(token.actor.id)) acc.push(token.actor.id);
      return acc;
    }, []);
    const characters = users.map(user => {
      const isControlled = selectedPlayerIds.includes(user.character?.id);
      const selected = (user.character && isControlled) ? "selected" : "";
      return {selected, id: user.id, name: user.name};
    });
    return {characters};
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action='player']").forEach(n => {
      n.addEventListener("click", this._togglePlayer.bind(this));
    });
    html[0].querySelector("[data-action='whisper']").addEventListener("click", this._whisperPlayers.bind(this));
  }

  /**
   * Toggle the 'selected' class on a player.
   * @param {PointerEvent} event      The initiating click event.
   */
  _togglePlayer(event) {
    event.currentTarget.classList.toggle("selected");
  }

  /**
   * Send the message.
   * @param {PointerEvent} event          The initiating click event.
   * @returns {Promise<ChatMessage>}      The whispered chat message.
   */
  async _whisperPlayers(event) {
    const content = this.element[0].querySelector("textarea").value.split("\n").reduce((acc, e) => {
      e = e.trim();
      if (e.length) return acc + `<p>${e}</p>`;
      return acc;
    }, "");
    if (!content.length) return;
    const whisper = [];
    this.element[0].querySelectorAll("[data-action='player']").forEach(n => {
      if (n.classList.contains("selected")) whisper.push(n.dataset.userId);
    });
    if (!whisper.length) return;

    await this.close();
    return ChatMessage.create({content, whisper});
  }

  /**
   * Render this application.
   * @returns {WhisperPlayers}      An instance of this application.
   */
  static whisperPlayers() {
    return new WhisperPlayers().render(true);
  }
}
