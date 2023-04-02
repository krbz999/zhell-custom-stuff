import {DEPEND, MODULE} from "../../../const.mjs";
import {columnDialog} from "../../customDialogs.mjs";
import {_constructLightEffectData, _getDependencies} from "../../itemMacros.mjs";

export const stars = {STARRY_FORM};

async function STARRY_FORM(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const has = actor.effects.find(e => e.flags.core?.statusId === item.name.slugify({strict: true}));
  if (has) return has.delete();

  const use = await item.use();
  if (!use) return;

  const [effectData] = _constructLightEffectData({
    item, lightData: {dim: 20, bright: 10}, intro: "", flags: {}
  });

  const title = item.name;
  const content = '<div class="dynamic-tooltip"></div>';
  const buttons = {
    archer: {
      icon: '<i class="fa-solid fa-burst"></i>',
      label: "Archer",
      callback: () => "archer"
    },
    chalice: {
      icon: '<i class="fa-solid fa-trophy"></i>',
      label: "Chalice",
      callback: () => "chalice"
    },
    dragon: {
      icon: '<i class="fa-solid fa-dragon"></i>',
      label: "Dragon",
      callback: () => "dragon"
    }
  }

  const intro = {
    archer: "<p>When you activate this form, and as a bonus action on your subsequent turns while it lasts, you can make a ranged spell attack, hurling a luminous arrow that targets one creature within 60 feet of you. On a hit, the attack deals radiant damage equal to 1d8 + your Wisdom modifier.</p>",
    chalice: "<p>Whenever you cast a spell using a spell slot that restores hit points to a creature, you or another creature within 30 feet of you can regain hit points equal to 1d8 + your Wisdom modifier.</p>",
    dragon: "<p>When you make an Intelligence or a Wisdom check or a Constitution saving throw to maintain concentration on a spell, you can treat a roll of 9 or lower on the d20 as a 10.</p>"
  }

  function render(html) {
    const field = html[0].querySelector(".dynamic-tooltip");
    html[2].querySelectorAll("[data-button]").forEach(btn => {
      btn.addEventListener("mouseover", function(event) {
        const type = event.currentTarget.dataset.button;
        field.innerHTML = intro[type];
      });
    });
  }

  // @scale.stars.starry-form-die

  const form = await columnDialog({title, content, buttons, render});
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
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
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
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
    foundry.utils.setProperty(effectData, `flags.${MODULE}`, {itemData, types: ["healing"]});
  } else if (form === "dragon") {
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
    effectData.changes = [{key: "flags.dnd5e.concentrationReliable", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: true}];
  } else return;
  await actor.effects.find(e => e.flags.core?.statusId === item.name.slugify({strict: true}))?.delete();
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

  const file = "jb2a.markers.circle_of_stars.blue";
  return new Sequence().effect().file(file).attachTo(token).scale(2).fadeIn(500).fadeOut(500).tieToDocuments(effect).persist().play();
}
