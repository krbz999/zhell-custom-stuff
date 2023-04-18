import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function CHAOS_BOLT(item, speaker, actor, token, character, event, args) {
  /* Dialog to allow for attack rerolls in case of Seeking Spell. */
  const castOrAttack = await Dialog.wait({
    title: "Is this a casting, or a reroll of an attack?",
    buttons: {
      cast: {icon: '<i class="fas fa-check"></i>', label: "Cast", callback: () => "cast"},
      attack: {icon: '<i class="fas fa-times"></i>', label: "Reroll", callback: () => "reroll"}
    }
  });

  /* Bail out of dialog was cancelled. */
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

    const damageTypes = [
      "acid", "cold", "fire", "force", "lightning",
      "poison", "psychic", "thunder"
    ];

    /* Async dialog */
    const buttons = {}
    const entries = damageTypes.map(type => [type, CONFIG.DND5E.damageTypes[type]]);
    for (const {result} of damage.dice[0].results) {
      buttons[entries[result - 1][0]] = {
        label: entries[result - 1][1],
        callback: () => entries[result - 1]
      }
    }
    const dmgType = await Dialog.wait({title: "Choose damage type.", buttons});
    let flavor = "<p><strong>Chaos Bolt</strong></p>";
    flavor += `<p>Damage type: ${dmgType[1]}</p>`;
    const chain = totals.length > new Set(totals).size;
    if (chain) flavor += '<p style="text-align: center;"><strong><em>Chaining!</em></strong></p>';
    await ChatMessage.create({content: flavor, speaker});
    return chain;
  }
}
