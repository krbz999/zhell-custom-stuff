import {MODULE} from "../../const.mjs";

class PartyFeatures extends Application {
  constructor() {
    super();

    // The group actor with the party in it (second uuid is for test world).
    this.groupActor = fromUuidSync("Actor.VRA6OxigX4V5GYn7") ?? fromUuidSync("Actor.z23wHCaG0LYmaqKF");
    this.features = ["intervention", "inspiration", "fragment"];
    this.maximums = {intervention: 1, inspiration: 7, fragment: 1};
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [MODULE, "party-features", "closing"],
      template: "modules/zhell-custom-stuff/templates/partyFeatures.hbs",
      id: "zhell-custom-stuff-party-features",
      minimizable: false,
      minimizeable: false,
    });
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.isGM = game.user.isGM;
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action]").forEach(n => n.addEventListener("click", this._onClickButton.bind(this)));
  }

  /** @override */
  async close(...args) {
    this.element[0].classList.toggle("closing", true);
    await new Promise(r => setTimeout(r, 1000));
    return super.close(...args);
  }

  /** @override */
  async render(...args) {
    await super.render(...args);
    let el = null;
    while (!el) {
      el = this.element[0] ?? null;
      await new Promise(r => setTimeout(r, 100));
    }
    el.classList.toggle("closing", false);
    return this;
  }

  /**
   * Get the assigned actors that are in the group actor.
   * @returns {Set<Actor>}      The assigned actors that are members of this Group.
   */
  get partyMembers() {
    const party = this.groupActor.system.members;
    const players = new Set(game.users.map(u => u.character).filter(u => u));
    return party.intersection(players);
  }

  /**
   * Get the alias used as speaker for chat messages.
   * @returns {string}      The alias.
   */
  get alias() {
    return "The Pantheon";
  }

  /**
   * Handle clicking a feature, reset, or close button.
   * @param {PointerEvent} event      The initiating click event.
   */
  _onClickButton(event) {
    switch (event.currentTarget.dataset.action) {
      case "intervention": this.intervention(); break;
      case "inspiration": this.inspiration(); break;
      case "fragment": this.fragment(); break;
      case "reset": this.resetFeatures(); break;
      case "close": this.close(); break;
    }
  }

  /**
   * Return whether a party feature can be used.
   * @param {string} feature      The key of the party feature.
   * @returns {boolean}           Whether the feature has uses left.
   */
  canUseFeature(feature) {
    if (!this.features.includes(feature)) {
      ui.notifications.warn(`The feature "${feature}" is not a valid party feature key.`);
      return null;
    }

    if (!(this.groupActor.flags[MODULE].partyFeatureUses[feature].value > 0)) {
      ui.notifications.warn(`The feature '${this.groupActor.flags[MODULE].partyFeatureUses[feature].label}' has no uses left!`);
      return null;
    }

    return true;
  }

  /**
   * Reset the remaining uses on the party features to their maximum.
   * @returns {Actor}     The group actor having their flags updated.
   */
  async resetFeatures() {
    await this.close();
    await ChatMessage.create({
      content: "The party's shared features have reset!",
      speaker: {alias: this.alias}
    });
    return this.groupActor.setFlag(MODULE, "partyFeatureUses", {
      intervention: {value: this.maximums.intervention, max: this.maximums.intervention, label: "Divine Intervention"},
      inspiration: {value: this.maximums.inspiration, max: this.maximums.inspiration, label: "Divine Inspiration"},
      fragment: {value: this.maximums.fragment, max: this.maximums.fragment, label: "Time Fragment"}
    });
  }

  /**
   * Perform Divine Intervention.
   * @returns {Actor}     The group actor having its flags altered.
   */
  async intervention() {
    const usage = this.canUseFeature("intervention");
    if (!usage) return null;

    await this.close();

    const uses = this.groupActor.flags[MODULE].partyFeatureUses.intervention;
    const targetValue = Math.floor(this.partyMembers.reduce((acc, a) => acc + a.system.abilities.pty.value, 0) / 2);
    const data = {
      name: "Divine Intervention",
      description: "<p>The party can perform divine intervention."
        + " Doing so, all players must call upon their deities to intervene on their behalf when their need is great."
        + " They must describe the assistance they seek, and select a player to roll a d100."
        + " If they roll a number equal to or lower than half the sum of their piety scores (rounded down), a deity intervenes in some way."
        + " The DM chooses the nature of the intervention.</p>"
        + "<p>If a deity intervenes, this feature cannot be used again for 9 days. It can otherwise be used again after the next dawn.</p>",
      img: "icons/magic/holy/chalice-glowing-yellow-blue.webp",
      footer: `Target value: ${targetValue} or lower`
    };
    const content = await renderTemplate("modules/zhell-custom-stuff/templates/partyFeatureMessage.hbs", data);
    await ChatMessage.create({content, speaker: {alias: this.alias}});
    await new Roll("1d100").toMessage({flavor: data.name, speaker: {alias: this.alias}});
    return this.groupActor.setFlag(MODULE, "partyFeatureUses.intervention.value", uses.value - 1);
  }

  /**
   * Perform Divine Inspiration.
   * @returns {Actor}     The group actor having its flags altered.
   */
  async inspiration() {
    const usage = this.canUseFeature("inspiration");
    if (!usage) return null;

    await this.close();

    const uses = this.groupActor.flags[MODULE].partyFeatureUses.inspiration;
    const data = {
      name: "Divine Inspiration",
      img: "icons/magic/holy/chalice-glowing-gold-water.webp",
      footer: `Uses ${uses.value - 1} / ${uses.max}`,
      description: "<p>When you perform an ability check, you can choose to use your piety score instead of the normal ability score."
        + " You must do this before you roll.</p>"
        + "<p>The party can choose to do this a total number of times equal to the amount of divine boons they have received."
        + " When Divine Intervention resets after performing a successful intervention, the party regains all expended uses of this feature.</p>"
    };
    const content = await renderTemplate("modules/zhell-custom-stuff/templates/partyFeatureMessage.hbs", data);
    await ChatMessage.create({content, speaker: {alias: this.alias}});
    return this.groupActor.setFlag(MODULE, "partyFeatureUses.inspiration.value", uses.value - 1);
  }

  /**
   * Perform Time Fragment.
   * @returns {Actor}     The group actor having its flags altered.
   */
  async fragment() {
    const usage = this.canUseFeature("fragment");
    if (!usage) return null;

    await this.close();

    const uses = this.groupActor.flags[MODULE].partyFeatureUses.fragment;
    const data = {
      name: "Time Fragment",
      img: "icons/magic/holy/chalice-glowing-gold.webp",
      footer: `Uses ${uses.value - 1} / ${uses.max}`,
      description: "<p>One fragment of J'Lynh hid in the Temple of Emissary, guarded by the 'Lady Grace',"
        + " and with the temple grounds' timely destruction, one tiny mote has been bestowed upon the party.</p>"
        + "<p>If the need is great, the party can choose to ignore one single attack roll, damage roll, ability check,"
        + " or saving throw that they or a creature that they can see has rolled. The party must choose to do so"
        + " immediately after the roll, and before any results of it are applied.</p>"
        + "<p>If doing so, the creature immediately rerolls and must use the new roll, and this feature cannot"
        + " be used again until Divine Intervention has reset.</p>"
    };
    const content = await renderTemplate("modules/zhell-custom-stuff/templates/partyFeatureMessage.hbs", data);
    await ChatMessage.create({content, speaker: {alias: this.alias}});
    return this.groupActor.setFlag(MODULE, "partyFeatureUses.fragment.value", uses.value - 1);
  }
}

export function renderPartyFeatures() {
  return new PartyFeatures().render(true);
}
