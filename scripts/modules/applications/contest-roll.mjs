import {MODULE} from "../../const.mjs";

export class ContestRoll extends Application {

  constructor(active, spectators) {
    super();
    this.users = {active, spectators};

    for (const user of this.users.active) {
      this.userData ??= {};
      this.userData[user.id] ??= {};
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/zhell-custom-stuff/templates/contest-roll.hbs",
      classes: [MODULE, "contest-roll"]
    });
  }

  async getData() {
    const users = this.users.active.map(u => {
      return {
        isNotMe: u.id !== game.user.id,
        name: u.name,
        total: this.userData[u.id].total ?? null
      };
    });
    for (const user of this.users.active) console.warn(user.id, this.userData[user.id]);
    return {users};
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action=roll]").forEach(n => {
      n.addEventListener("click", this._onClickRoll.bind(this));
    });
  }

  async _onClickRoll(event) {
    const roll = new Roll("1d10");
    await roll.toMessage();
    this.userData[game.user.id].total = roll.total;
    return this.constructor.emitRerender();
  }

  static get #activeApp() {
    return Object.values(ui.windows).find(w => w.id === this.id);
  }

  static get id() {
    return "contest-roll";
  }
  get id() {
    return this.constructor.id;
  }


  /* ------------------------ */
  /*      SOCKET METHODS      */
  /* ------------------------ */

  /**
   * Render a new instance of this application for users. Only users with id in userIds can interact with the application.
   * @param {string[]} userIds
   * @param {object} options
   * @param {boolean} options.includeGM       Whether to include game masters regardless.
   * @param {boolean} options.includeAll      Whether to include all users.
   */
  static emitRender(userIds = [], options = {}) {
    const spectators = new Set(userIds);
    for (const user of game.users) if ((user.isGM && options.includeGM) || options.includeAll) spectators.add(user.id);

    const data = {
      active: userIds,
      spectators: Array.from(spectators)
    };

    // emit socket
    game.socket.emit(`world.${game.world.id}`, {action: "contest-roll-render", data});
    // if game.user.id in userIds/spectators, also render for me.
    if (data.spectators.includes(game.user.id)) this.receiveRender(data);
  }

  /**
   * Receive an emit about rendering a new instance of this application.
   */
  static receiveRender(data) {
    const active = data.active.map(id => game.users.get(id));
    const spectators = data.spectators.map(id => game.users.get(id));
    new ContestRoll(active, spectators).render(true);
  }

  /**
   * Rerender this application for all users if they have it open.
   */
  static emitRerender() {
    const data = this.#activeApp.userData[game.user.id];
    // emit to all users to re-render with 'data' from this user.
    game.socket.emit(`world.${game.world.id}`, {action: "contest-roll-rerender", data: {userId: game.user.id, data}});
    this.#activeApp.render();
  }

  /**
   * Receive an emit about re-rendering the application.
   * @param {string} userId     The id of the user with new data.
   * @param {object} data       The new data.
   */
  static receiveRerender({userId, data}) {
    const app = this.#activeApp;
    if (!app) return;
    app.userData[userId] = data;
    app.render();
  }

  /**
   * Setup function for the sockets.
   */
  static setupSockets() {
    game.socket.on(`world.${game.world.id}`, data => {
      if (data.action === "contest-roll-render") ContestRoll.receiveRender(data.data);
      else if (data.action === "contest-roll-rerender") ContestRoll.receiveRerender(data.data);
    });
  }
}
