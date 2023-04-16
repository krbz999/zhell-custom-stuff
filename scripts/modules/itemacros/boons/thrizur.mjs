import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const thrizur = {GOODHUNTER};

/**
 * When concentrating on Hunter's Mark, display a dialog to use a reaction or attempt to extend
 * the duration of the concentration. The DC for the check to extend it increases by 1 for each
 * success. The reaction ends the concentration and allows the actor to take the damage instead.
 */
async function GOODHUNTER(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.CN)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);

  // case 1: not even conc on True Strike.
  if (!isConc) return item.use();

  // case 2: conc, prompt to use reaction or extend.
  const currentDC = isConc.flags.world?.goodhunter ?? 10;
  new Dialog({
    title: "Goodhunter's True Strike",
    buttons: {
      extend: {
        icon: "<i class='fa-solid fa-clock'></i>",
        label: `Attempt to extend <br> Current DC: ${currentDC}`,
        callback: extend
      },
      react: {
        icon: "<i class='fa-solid fa-heart-broken'></i>",
        label: "Take damage",
        callback: react
      }
    }
  }).render(true);

  async function extend(html, event) {
    const test = await actor.rollAbilityTest("con", {event, targetValue: currentDC, critical: null, fumble: null});
    if (!test) return;
    if (test.total < currentDC) return isConc.delete();
    else {
      await ChatMessage.create({speaker, content: `${actor.name} extends ${item.name} by another round.`});
      return isConc.update({
        "duration.rounds": isConc.duration.rounds + 1,
        "flags.world.goodhunter": currentDC + 1
      });
    }
  }

  async function react() {
    new Dialog({
      title: "Goodhunter: Take the damage",
      content: `
      <form>
        <button id="goodhunter-hit-die"><i class="fa-solid fa-die-d10"></i> Roll Hit Die</button>
        <div class="form-group">
          <label>Damage to take:</label>
          <div class="form-fields">
            <input type="number" id="goodhunter-damage-taken" value="50" autofocus>
          </div>
        </div>
      </form>`,
      buttons: {
        apply: {
          icon: "<i class='fa-solid fa-heart'></i>",
          label: "Apply Damage",
          callback: async (html) => {
            const value = html[0].querySelector("#goodhunter-damage-taken").valueAsNumber;
            await isConc.delete();
            await actor.applyDamage(value);
            return ChatMessage.create({speaker, content: `${actor.name} took the ${value} damage.`});
          }
        }
      },
      render: (html) => {
        const hdBtn = html[0].querySelector("#goodhunter-hit-die");
        hdBtn.addEventListener("click", async () => {
          await actor.rollHitDie(undefined, {dialog: false});
          hdBtn.disabled = true;
        });
      }
    }).render(true);
  }
}
