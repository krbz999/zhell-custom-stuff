import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function CHAOS_BOLT(item, speaker, actor, token, character, event, args) {
  /* Dialog to allow for attack rerolls in case of Seeking Spell. */
  const castOrAttack = await Dialog.wait({
    title: "Is this a casting, or a reroll of an attack?",
    buttons: {
      cast: {icon: '<i class="fa-solid fa-check"></i>', label: "Cast", callback: () => "cast"},
      attack: {icon: '<i class="fa-solid fa-times"></i>', label: "Reroll", callback: () => "reroll"}
    }
  });

  /* Bail out if dialog was cancelled. */
  if (!castOrAttack) return;

  /**
   * If "cast" was selected, cast the spell normally, and save a flag noting its most recent level.
   * To be used in damage rolls and if reroll is ever selected.
   */
  if (castOrAttack === "cast") {
    const use = await item.use();
    if (!use) return;
    item._recentLevel = ItemMacroHelpers._getSpellLevel(use);
  }

  return throwChaos();

  /* The main function. */
  async function throwChaos() {
    const attack = await item.rollAttack();
    if (!attack) return;

    const spellLevel = item._recentLevel ?? 1;
    const damage = await item.rollDamage({spellLevel});
    if (!damage) return;

    const isChaining = await decideDamage(damage);
    if (isChaining) return throwChaos();
  }

  /**
   * Function to decide on damage depending on the dice results.
   * User gets no prompt if there is no decision to be made.
   */
  async function decideDamage(damage) {
    const totals = damage.dice[0].results.map(r => r.result);
    const types = {
      1: "acid",
      2: "cold",
      3: "fire",
      4: "force",
      5: "lightning",
      6: "poison",
      7: "psychic",
      8: "thunder"
    };

    /* Async dialog */
    const buttons = damage.dice[0].results.reduce((acc, {result}) => {
      const key = types[result];
      const label = CONFIG.DND5E.damageTypes[key];
      acc[key] = {label, callback: _rollDamage};
      return acc;
    }, {});
    return Dialog.wait({title: "Choose damage type.", buttons});

    async function _rollDamage(html, event) {
      const key = event.currentTarget.dataset.button;
      const type = CONFIG.DND5E.damageTypes[key];
      let flavor = "<p><strong>Chaos Bolt</strong></p>";
      flavor += `<p>Damage type: ${type}</p>`;
      const chain = totals.length > new Set(totals).size;
      if (chain) flavor += '<p style="text-align: center;"><strong><em>Chaining!</em></strong></p>';
      await ChatMessage.create({content: flavor, speaker});
      return chain;
    }
  }
}
