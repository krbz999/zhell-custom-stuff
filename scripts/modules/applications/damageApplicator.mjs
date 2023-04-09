import {MODULE} from "../../const.mjs";

/**
 * An application that takes selected tokens, and lets you roll saving throws and
 * apply damage correctly via a the interface.
 */
export class DamageApplicator extends Application {
  constructor(data) {
    super(data);
    // The initiating damage roll.
    this.message = data.message;
    this.tokens = canvas.tokens.controlled;
    // The damage types and the bypasses (mgc, ada, sil);
    this.values = this.message.flags[MODULE].damage.values; // object of damage type to damage value
    this.bypasses = this.message.flags[MODULE].damage.bypasses;
    this.types = Object.keys(this.values);
    this.hasSave = this.message.flags[MODULE].damage.hasSave;
    this.saveData = this.message.flags[MODULE].damage.saveData;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 500,
      height: "100%",
      classes: [MODULE, "damage-applicator"],
      resizable: true,
      scrollY: [],
      tabs: [],
      dragDrop: [],
      closeOnSubmit: false,
      template: `modules/${MODULE}/templates/damageApplicator.hbs`,
      top: 0,
      left: 0
    });
  }

  get title() {
    return `Damage Applicator: ${this.message.id}`;
  }

  get id() {
    return `${MODULE}-damage-applicator-${this.message.uuid.replaceAll(".", "-")}`;
  }

  /**
   * The tokens that are targeted by this application of damage or healing. If the user is a GM,
   * use the selected tokens. If the user is not a GM, use their owned tokens. Either case,
   * broken tokens are filtered out.
   * @returns {Token[]}     An array of token placeables.
   */
  get targets() {
    const tokens = (game.user.isGM ? this.tokens : canvas.tokens.placeables).filter(token => token.actor);
    if (game.user.isGM) return tokens;
    else return tokens.filter(token => token.actor.testUserPermission(game.user, "OWNER"));
  }

  /** @override */
  async getData() {
    const data = await super.getData();

    // Actor data.
    data.actors = [];
    for (const token of this.targets) {
      const {dr, di, dv} = this._getActorDamageTraits(token.actor);
      data.actors.push({
        id: token.id,
        hasResistance: dr.length > 0,
        hasInvulnerability: di.length > 0,
        hasVulnerability: dv.length > 0,
        img: token.document.texture.src,
        name: token.actor.name.split(" ")[0].trim(),
        actorName: token.actor.name,
        hasPlayer: this._getActorHasActivePlayerOwner(token.actor),
        hp: token.actor.system.attributes.hp,
        dr, di, dv
      });
    }

    // Damage roll data.
    data.types = Object.entries(this.values).map(([type, value]) => ({
      type,
      value,
      label: CONFIG.DND5E.damageTypes[type] ?? type
    }));
    data.total = Object.values(this.values).reduce((acc, v) => acc + v, 0);

    // Item data.
    data.hasSave = this.hasSave;
    if (data.hasSave) {
      const save = this.saveData;
      data.save = {
        ability: save.ability,
        dc: save.dc, // todo: babonus bonus to save dc?
        label: CONFIG.DND5E.abilities[save.ability]
      }
    }

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action='toggle-trait']").forEach(n => n.addEventListener("click", this._onToggleTrait.bind(this)));
    html[0].querySelectorAll("[data-action='saving-throw']").forEach(n => n.addEventListener("click", this._onRollSave.bind(this)));
    html[0].querySelectorAll("[data-action='toggle-throw']").forEach(n => n.addEventListener("click", this._onToggleSuccess.bind(this)));
    html[0].querySelectorAll("[data-action='remove-actor']").forEach(n => n.addEventListener("click", this._onRemoveActor.bind(this)));
    html[0].querySelectorAll("[data-action='pan-to-token']").forEach(n => n.addEventListener("click", this._onPanToken.bind(this)));
    html[0].querySelectorAll("[data-action='apply-damage']").forEach(n => n.addEventListener("click", this._onApplyDamage.bind(this)));
    html[0].querySelectorAll("[data-action='render-actor']").forEach(n => n.addEventListener("click", this._onRenderActor.bind(this)));
    html[0].querySelector("[data-action='apply-damage-all']").addEventListener("click", this._onApplyDamageAll.bind(this));
    html[0].querySelector("[data-action='saving-throw-all']")?.addEventListener("click", this._onRollSaveAll.bind(this));
  }

  /** @override */
  async render(force = false, options = {}) {
    if (!this.targets.length) {
      ui.notifications.warn("You have no valid tokens.");
      return null;
    }
    return super.render(force, options);
  }

  /**
   * Render the sheet of the token's associated actor.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {ActorSheet}            The rendered actor sheet.
   */
  _onRenderActor(event) {
    return canvas.scene.tokens.get(event.currentTarget.closest(".actor").dataset.tokenId).actor.sheet.render(true);
  }

  /**
   * Apply damage to a single token's actor.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onApplyDamage(event) {
    const actorEl = event.currentTarget.closest(".actor");
    const actor = canvas.scene.tokens.get(actorEl.dataset.tokenId).actor;
    const values = foundry.utils.deepClone(this.values);

    const modifiers = actorEl.querySelectorAll(".trait-section .enabled");
    for (const mod of modifiers) {
      const data = mod.closest(".type").dataset;
      values[data.key] *= {dr: 0.5, di: 0, dv: 2}[data.trait];
    }
    const total = Object.values(values).reduce((acc, v) => acc + v, 0);

    // Did the actor save?
    let multiplier = 1;
    if (actorEl.querySelector("[data-action='toggle-throw'].success")) multiplier = 0.5;
    if (event.shiftKey) multiplier *= -1;

    await actor.applyDamage(total, multiplier);
    const [val, max] = actorEl.querySelectorAll("[data-attr^='hp-']");
    val.innerText = actor.system.attributes.hp.value;
    max.innerText = actor.system.attributes.hp.max;
  }

  /**
   * Apply damage to all tokens' actors.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onApplyDamageAll(event) {
    this.element[0].querySelectorAll(".actor [data-action='apply-damage']").forEach(n => n.dispatchEvent(new PointerEvent("click", event)));
  }

  /**
   * Roll saving throws for all tokens' actors.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onRollSaveAll(event) {
    this.element[0].querySelectorAll(".actor [data-action='saving-throw']").forEach(n => {
      if (n.style.pointerEvents !== "none") n.dispatchEvent(new PointerEvent("click", event));
    });
  }

  /**
   * Damage all tokens with the default respective damage types and values from the chatlog.
   * @param {PointerEvent} event        The initiating click event.
   * @param {boolean} [save=false]      Whether to roll saving throws first to halve the damage.
   */
  async damageAll(event, {save = false} = {}) {
    const heal = event.shiftKey && !save;
    for (const token of this.targets) {
      const values = foundry.utils.deepClone(this.values);
      const {dr, di, dv} = this._getActorDamageTraits(token.actor);
      for (const d of dr) if (!d.bypass) values[d.key] *= 0.5;
      for (const d of di) if (!d.bypass) values[d.key] *= 0;
      for (const d of dv) if (!d.bypass) values[d.key] *= 2;
      let modifier = 1;
      if (this.hasSave && save) {
        const roll = await token.actor.rollAbilitySave(this.saveData.ability, {
          fastForward: true, targetValue: this.saveData.dc, chatMessage: false
        });
        if (roll.total >= this.saveData.dc) modifier = 0.5;
      }
      const total = Object.values(values).reduce((acc, v) => acc + v, 0);
      if (heal) modifier *= -1;
      await token.actor.applyDamage(total, modifier);
    }
  }

  /**
   * Pan to the relevant token on the canvas. Fade the UI for 5 seconds.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onPanToken(event) {
    const app = event.currentTarget.closest(".zhell-custom-stuff.damage-applicator");
    app.classList.toggle("fade", true);
    const {x, y} = canvas.tokens.get(event.currentTarget.closest(".actor").dataset.tokenId).center;
    await canvas.animatePan({x, y, scale: 1, duration: 500});
    app.classList.toggle("fade", false);
  }

  /**
   * Remove an actor when the trash can button is clicked.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onRemoveActor(event) {
    event.currentTarget.closest(".actor").remove();
  }

  /**
   * Perform a saving throw for the selected token's actor, then append the result just below.
   * @param {PointerEvent} event      The initiating click event.
   */
  async _onRollSave(event) {
    const target = event.currentTarget;
    target.style.pointerEvents = "none";
    const token = canvas.scene.tokens.get(target.closest(".actor").dataset.tokenId);
    const data = target.dataset;
    const roll = await token.actor.rollAbilitySave(data.ability, {event, targetValue: data.dc});
    if (!roll) {
      target.style.pointerEvents = "";
      return;
    }
    // Show roll result after this anchor.
    const res = target.closest(".util").querySelector("[data-action='toggle-throw']");
    res.classList.toggle("success", roll.total >= Number(data.dc));
    res.innerText = roll.total;
  }

  /**
   * Toggle the success state of a saving throw.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onToggleSuccess(event) {
    event.currentTarget.classList.toggle("success");
  }

  /**
   * Toggle whether a trait should be taken into account for the purpose of applying damage.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onToggleTrait(event) {
    event.currentTarget.classList.toggle("enabled");
  }

  /**
   * Get a target's relevant resistances, invulnerabilities, and vulnerabilities.
   * @param {Actor} actor     The actor to evaluate.
   * @returns {object}        An object with dx.key, .label, .bypass, for dx = dr, di, dv.
   */
  _getActorDamageTraits(actor) {
    return ["dr", "di", "dv"].reduce((acc, d) => {
      const trait = actor.system.traits[d];
      const types = new Set(trait.value);
      const bypasses = trait.bypasses.filter(b => this.bypasses.includes(b)); // the bypasses that matter.
      if (trait.custom?.length) {
        for (const val of trait.custom.split(";")) {
          const t = val.trim();
          if (t) types.add(t);
        }
      }

      for (const type of types) {
        if (!this.types.includes(type)) continue; // ignore types that aren't relevant for this damage roll.
        const hasBypass = CONFIG.DND5E.physicalDamageTypes[type] && (bypasses.size > 0);
        if (hasBypass) {
          for (const b of bypasses) {
            acc[d].push({
              key: type,
              label: `Non-${CONFIG.DND5E.physicalWeaponProperties[b].slice(0, 3)} ${CONFIG.DND5E.damageTypes[type]}`,
              bypass: b
            });
          }
        } else {
          acc[d].push({
            key: type,
            label: `${CONFIG.DND5E.damageTypes[type]}`
          });
        }
      }

      return acc;
    }, {dr: [], di: [], dv: []});
  }

  /**
   * Get whether a target has an active player owner.
   * @param {Actor} actor     The actor to evaluate.
   * @returns {boolean}       Whether the actor has an active player owner.
   */
  _getActorHasActivePlayerOwner(actor) {
    return game.users.some(user => {
      return !user.isGM && user.active && actor.testUserPermission(user, "OWNER");
    });
  }

  /**
   * Append button(s) to damage rolls.
   * @param {ChatMessage} message     The message being rendered.
   * @param {HTMLElement} html        The rendered html element.
   */
  static async _appendToDamageRolls(message, [html]) {
    if (!game.user.isGM) return;
    if (message.flags.dnd5e?.roll?.type !== "damage") return;
    const roll = html.querySelector(".dice-roll");
    const div = document.createElement("DIV");
    div.innerHTML = await renderTemplate("modules/zhell-custom-stuff/templates/damageRollButtons.hbs", {save: message.flags[MODULE].damage.hasSave});
    div.querySelector("[data-action='render']").addEventListener("click", (event) => new DamageApplicator({message}).render(true));
    div.querySelector("[data-action='quick-apply']").addEventListener("click", (event) => new DamageApplicator({message}).damageAll(event, {save: false}));
    div.querySelector("[data-action='save-and-apply']")?.addEventListener("click", (event) => new DamageApplicator({message}).damageAll(event, {save: true}));
    roll.after(div.firstElementChild);
  }

  /**
   * Append damage type and bypass properties to a damage roll message.
   * @param {Item} item         The item rolling damage.
   * @param {object} config     The configuration object for the damage roll.
   */
  static _appendDamageRollData(item, config) {
    const parts = item.system.damage.parts;
    const indices = {};

    let idx = 0;
    for (const [formula, type] of parts) {
      const terms = new CONFIG.Dice.DamageRoll(formula, config.data).terms;
      for (const term of terms) {
        if (!(term instanceof Die) && !(term instanceof NumericTerm)) continue;
        indices[idx] = type;
        idx++;
      }
    }

    const bypasses = item.system.properties ? Object.keys(CONFIG.DND5E.physicalWeaponProperties).filter(p => {
      return item.system.properties[p];
    }) : [];

    config.messageData[`flags.${MODULE}.damage`] = {
      indices,
      bypasses,
      hasSave: item.hasSave,
      saveData: item.system.save
    };
  }

  /**
   * Append more properties after the roll has been thrown into chat.
   * @param {ChatMessage} message     The message being posted in chat.
   */
  static _appendMoreDamageRollData(message) {
    if (message.flags.dnd5e?.roll?.type !== "damage") return;

    const indices = message.flags[MODULE].damage.indices;
    let currentType = indices[0];
    let idx = 0;

    const roll = message.rolls[0];

    const values = {};
    for (const term of roll.terms) {
      if (!(term instanceof Die) && !(term instanceof NumericTerm)) continue;

      // If still looping over indices, use those, do nothing else.
      const ind = indices[idx];
      if (ind) {
        values[ind] = (values[ind] ?? 0) + term.total;
        currentType = ind;
        idx++;
        continue;
      }

      // If the term has flavor, use this as the damage type if it is valid, otherwise use the default type.
      const fl = term.options.flavor;
      let type;
      if (!fl) {
        type = currentType;
      } else {
        // If a term has valid damage type, update the current type. If it is not valid, use the default type.
        const dType = CONFIG.DND5E.damageTypes[fl];
        type = dType ? fl : indices[0];
        if (dType) currentType = type;
      }
      values[type] = (values[type] ?? 0) + term.total;
      idx++;
    }
    message.updateSource({[`flags.${MODULE}.damage`]: {values}, "flags.core.canPopout": true});
  }
}