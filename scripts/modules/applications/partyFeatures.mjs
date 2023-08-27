import {MODULE} from "../../const.mjs";

export class PartyFeatures extends Application {
  constructor() {
    super();
    this.groupActor = game.actors.get(game.settings.get(MODULE, "identifierSettings").partyFeatures.actorId);
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [MODULE, "party-features"],
      template: "modules/zhell-custom-stuff/templates/partyFeatures.hbs",
      id: "zhell-custom-stuff-party-features"
    });
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    const model = this.model;

    const icons = {
      intervention: "fa-solid fa-ankh",
      inspiration: "fa-solid fa-star-half-alt",
      fragment: "fa-solid fa-hourglass-start"
    };

    data.features = this.features.map(key => {
      return {
        tooltip: `ZHELL.PartyFeature${key.capitalize()}`,
        label: key.capitalize(),
        icon: icons[key],
        uses: model[key],
        key: key,
        disabled: model[key].value === 0
      };
    });
    data.isGM = game.user.isGM;
    return data;
  }

  /**
   * Get base data for the party features.
   * @type {object}
   */
  get model() {
    const flag = foundry.utils.getProperty(this.groupActor, `flags.${MODULE}.partyFeatureUses`);
    return new PartyFeaturesModel(flag ?? {}).toObject();
  }

  /**
   * Get keys for party features.
   * @type {string[]}
   */
  get features() {
    return Object.keys(this.model);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll("[data-action]").forEach(n => n.addEventListener("click", this._onClickButton.bind(this)));
  }

  /** @override */
  async close(options = {}) {
    const e = this.element;
    e[0].style.pointerEvents = "none";
    return new Promise(resolve => {
      e.fadeOut(1000, () => {
        resolve(super.close(options));
      });
    });
  }

  /** @override */
  _injectHTML(html) {
    $("body").append(html);
    this._element = html;
    html.hide().fadeIn(1000);
  }

  /**
   * Get the assigned actors that are in the group actor.
   * @type {Set<Actor>}
   */
  get partyMembers() {
    const party = this.groupActor.system.members;
    const players = new Set(game.users.map(u => u.character).filter(u => u));
    return party.intersection(players);
  }

  /**
   * Get the alias used as speaker for chat messages.
   * @type {string}
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
      return false;
    }
    return true;
  }

  /**
   * Reset the remaining uses on the party features to their maximum.
   * @returns {Promise<Actor>}      The group actor having their flags updated.
   */
  async resetFeatures() {
    this.close();
    ChatMessage.create({
      content: "The party's shared features have reset!",
      speaker: {alias: this.alias}
    });
    return this.groupActor.setFlag(MODULE, "partyFeatureUses", new PartyFeaturesModel({}).toObject());
  }

  /**
   * Perform Divine Intervention.
   * @returns {Promise<Actor>}      The group actor having its flags altered.
   */
  async intervention() {
    const key = "intervention";
    if (!this.canUseFeature(key)) return null;
    this.close();
    const uses = this.model[key];
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
   * @returns {Promise<Actor>}      The group actor having its flags altered.
   */
  async inspiration() {
    const key = "inspiration";
    if (!this.canUseFeature(key)) return null;
    this.close();
    const uses = this.model[key];
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
   * @returns {Promise<Actor>}      The group actor having its flags altered.
   */
  async fragment() {
    const key = "fragment";
    if (!this.canUseFeature(key)) return null;
    this.close();
    const uses = this.model[key];
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

  /**
   * Render this application.
   * @returns {PartyFeatures}     An instance of this application.
   */
  static renderPartyFeatures() {
    return new PartyFeatures().render(true);
  }
}

/** Utility model for storing keys and maximum uses. */
class PartyFeaturesModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      intervention: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({initial: 1}),
        max: new foundry.data.fields.NumberField({initial: 1})
      }),
      inspiration: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({initial: 7}),
        max: new foundry.data.fields.NumberField({initial: 7})
      }),
      fragment: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({initial: 1}),
        max: new foundry.data.fields.NumberField({initial: 1})
      }),
    };
  }
}
