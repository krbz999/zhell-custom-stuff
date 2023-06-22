import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function SUMMON_CELESTIAL(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG, DEPEND.CN, DEPEND.EM)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return ui.notifications.warn("You are already concentrating on 'Summon Celestial'.");

  return Dialog.wait({
    title: item.name,
    content: `<p>Pick the type of celestial to summon.</p>`,
    buttons: {
      avenger: {
        label: "Avenger",
        icon: "<i class='fa-solid fa-sword'></i>",
        callback: summon
      },
      defender: {
        label: "Defender",
        icon: "<i class='fa-solid fa-shield'></i>",
        callback: summon
      }
    }
  });

  async function summon(html, event) {
    const use = await item.use();
    if (!use) return;

    const type = event.currentTarget.dataset.button;
    const data = actor.getRollData();
    const level = ItemMacroHelpers._getSpellLevel(use);

    const updates = {
      token: {name: `${actor.name.split(" ")[0]}'s Celestial Spirit`},
      embedded: {
        Item: {
          [type === "avenger" ? "Radiant Mace" : "Radiant Bow"]: warpgate.CONST.DELETE,
          "Healing Touch": {"system.damage.parts": [[`2d8 + ${level}`, "healing"]]}
        }
      },
      actor: {
        "system.attributes.hp": {value: 40 + 10 * level, max: 40 + 10 * level},
        "system.attributes.ac.flat": 11 + level + (type === "defender" ? 2 : 0)
      }
    };
    if (type === "avenger") {
      updates.embedded.Item["Radiant Bow"] = {
        "system.attackBonus": `-@mod + ${data.attributes.spellmod}`,
        "system.damage.parts": [[`1d10 + @mod + ${level}`, "radiant"]]
      };
    } else {
      updates.embedded.Item["Radiant Mace"] = {
        "system.attackBonus": `-@mod + ${data.attributes.spellmod}`,
        "system.damage.parts": [[`2d6 + @mod + ${level}`, "radiant"], ["1d10", "temphp"]]
      };
    }
    const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

    // then spawn the actor:
    await actor.sheet?.minimize();
    const [spawn] = await ItemMacroHelpers._spawnHelper("Celestial Spirit", updates, {}, options);
    await actor.sheet?.maximize();
    const effect = CN.isActorConcentratingOnItem(actor, item);
    if (!spawn) return effect.delete();
    return ItemMacroHelpers._addTokenDismissalToEffect(effect, spawn);
  }
}
