import {DEPEND, MODULE} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const stars = {STARRY_FORM};

async function STARRY_FORM(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM, DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const status = item.name.slugify({strict: true});
  const has = actor.effects.find(e => e.statuses(status));
  if (has) return has.delete();

  const use = await item.use();
  if (!use) return;

  const [effectData] = ItemMacroHelpers._constructLightEffectData({
    item, lightData: {dim: 20, bright: 10}, intro: "", flags: {}
  });

  const title = item.name;
  const intro = {
    archer: "<p>When you activate this form, and as a bonus action on your subsequent turns while it lasts, you can make a ranged spell attack, hurling a luminous arrow that targets one creature within 60 feet of you. On a hit, the attack deals radiant damage equal to 1d8 + your Wisdom modifier.</p>",
    chalice: "<p>Whenever you cast a spell using a spell slot that restores hit points to a creature, you or another creature within 30 feet of you can regain hit points equal to 1d8 + your Wisdom modifier.</p>",
    dragon: "<p>When you make an Intelligence or a Wisdom check or a Constitution saving throw to maintain concentration on a spell, you can treat a roll of 9 or lower on the d20 as a 10.</p>"
  };
  const buttons = [
    {icon: "burst", key: "archer"},
    {icon: "trophy", key: "chalice"},
    {icon: "dragon", key: "dragon"}
  ].reduce((acc, v) => {
    acc[v.key] = {
      icon: `<i class="fa-solid fa-${v.icon}"></i>`,
      label: v.key.capitalize(),
      callback: () => v.key
    };
    return acc;
  }, {});

  function render(html) {
    html[0].closest(".app").querySelectorAll("[data-button]").forEach(button => {
      button.setAttribute("data-tooltip", intro[button.dataset.button]);
      button.setAttribute("data-tooltip-direction", "LEFT");
    });
  }

  const form = await Dialog.wait({title, buttons, render, close: () => false}, {classes: ["dialog", "column-dialog"]});
  if (form === "archer") {
    const itemData = {
      name: "Starry Form (Archer)",
      type: "feat",
      img: "icons/weapons/bows/shortbow-recurve-yellow.webp",
      system: {
        description: {value: intro[form]},
        activation: {type: "bonus", cost: 1},
        duration: {units: "inst"},
        target: {value: 1, type: "creature"},
        range: {value: 60, units: "ft"},
        ability: "wis",
        actionType: "rsak",
        attackBonus: "",
        damage: {parts: [["@scale.stars.starry-form-die + @mod", "radiant"]]}
      }
    }
    effectData.description = intro[form];
    foundry.utils.setProperty(effectData, `flags.${MODULE}`, {itemData, types: ["use", "attack", "damage"]});
  } else if (form === "chalice") {
    const itemData = {
      name: "Starry Form (Chalice)",
      type: "feat",
      img: "icons/magic/holy/chalice-glowing-gold-water.webp",
      system: {
        target: {value: 1, type: "creature"},
        range: {value: 30, units: "ft"},
        ability: "wis",
        actionType: "heal",
        damage: {parts: [["@scale.stars.starry-form-die + @mod", "healing"]]}
      }
    }
    effectData.description = intro[form];
    foundry.utils.setProperty(effectData, `flags.${MODULE}`, {itemData, types: ["healing"]});
  } else if (form === "dragon") {
    effectData.description = intro[form];
    effectData.changes = [{key: "flags.dnd5e.concentrationReliable", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: true}];
  } else return;
  // Delete any pre-existing starry form and create the new one.
  await actor.effects.find(e => e.statuses.has(status))?.delete();
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

  const file = "jb2a.markers.circle_of_stars.blue";
  return new Sequence()
    .effect().file(file).attachTo(token).scale(2).fadeIn(500).fadeOut(500).tieToDocuments(effect).persist()
    .play({remote: true});
}
