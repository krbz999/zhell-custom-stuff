import {DEPEND, MODULE} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function RAINBOW_RECURVE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN, DEPEND.RG)) return item.use();

  let effect = CN.isActorConcentratingOnItem(actor, item);
  let d;

  const colors = [
    {color: "red", text: "The target takes an additional 3d8 fire damage."},
    {color: "orange", text: "The target takes an additional 3d8 acid damage."},
    {color: "yellow", text: "The target takes an additional 3d8 lightning damage."},
    {color: "green", text: "The target takes an additional 3d8 poison damage."},
    {color: "blue", text: "The target takes an additional 3d8 cold damage."},
    {color: "indigo", text: "The target is paralyzed. It can make a Constitution saving throw at the end of each of its turns, ending the paralyzed condition on a success."},
    {color: "violet", text: "The target is blinded. It must then make a Wisdom saving throw at the start of your next turn. A successful save ends the blinded condition. If it fails that save, the creature is transported to another plane of existence of the GM's choosing and is no longer blinded. (Typically, a creature that is on a plane that is not its home plane is banished home, while other creatures are usually cast into the Astral or Ethereal Planes.)"}
  ];

  // if not concentrating, cast the spell.
  if (!effect) {
    const use = await item.use({}, {createMessage: false});
    if (!use) return;
    effect = await CN.waitForConcentrationStart(actor, {item, max_wait: 1000});
    if (!effect) return;
  }
  return chooseArrow();

  async function _checkForRemainingArrows() {
    const arrows = effect.flags[MODULE]?.arrowFired ?? {};
    const available = colors.filter(c => !arrows[c.color]);
    if (!available.length) {
      await effect.delete();
      return false;
    }
    return available;
  }

  // dialog to choose arrow.
  async function chooseArrow() {
    const available = await _checkForRemainingArrows();
    if (!available) return;

    const content = available.reduce((acc, {color, text}) => {
      return acc + `
      <button data-tooltip="${text}" data-tooltip-direction="LEFT" data-arrow="${color}">
        ${color.capitalize()}
      </button>`;
    }, "<div class='dialog-buttons'>") + "</div>";

    d = new Dialog({
      title: item.name,
      content,
      buttons: {},
      render: (html) => {
        html[0].querySelectorAll("[data-arrow]").forEach(n => n.addEventListener("click", shootArrow));
      }
    }, {classes: ["dialog", "column-dialog"]});
    return d.render(true);
  }

  // create item clone.
  async function shootArrow(event) {
    const arrow = event.currentTarget.dataset.arrow;
    await d.close();
    const groups = [{label: "Force", parts: [0]}];

    const addGroup = {
      red: {label: "Fire", parts: [1]},
      orange: {label: "Acid", parts: [2]},
      yellow: {label: "Lightning", parts: [3]},
      green: {label: "Poison", parts: [4]},
      blue: {label: "Cold", parts: [5]}
    }[arrow] ?? false;
    if (addGroup) groups.push(addGroup);

    const addSave = {indigo: "con", violet: "wis"}[arrow] ?? false;

    await effect.setFlag(DEPEND.CN, "data", {
      "itemData.flags.rollgroups.config.groups": groups
    });

    const card = await CN.redisplayCard(actor);

    // add new saving throw button.
    if (addSave) {
      const div = document.createElement("DIV");
      div.innerHTML = card.content;
      const oldSave = div.querySelector("button[data-action=save]");
      const dc = actor.system.attributes.spelldc;

      const saveType = CONFIG.DND5E.abilities[addSave].label;
      const newSaveButton = document.createElement("button");
      newSaveButton.setAttribute("data-action", "save");
      newSaveButton.setAttribute("data-ability", addSave);
      newSaveButton.innerHTML = game.i18n.format("CN.ButtonSavingThrow", {dc, saveType});
      oldSave.after(newSaveButton);
      await card.update({content: div.innerHTML});
    }
    await effect.setFlag(MODULE, `arrowFired.${arrow}`, true);
    return _checkForRemainingArrows();
  }
}
