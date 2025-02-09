import { MODULE } from "../../const.mjs";

/**
 * Roll on the carousing table.
 * @param {string} [tableName]        The name of the table to draw from.
 * @param {string} [catalogName]      The name of the compendium that contains the rolltable.
 * @returns {Promise<object>}         The object with the roll and drawn results.
 */
export async function carousing({ tableName, catalogName } = {}) {
  tableName ??= "Carousing";
  catalogName ??= "rolltables";
  const table = await ZHELL.utils.getDocument(tableName, catalogName, false);
  return table.draw({
    roll: new Roll("1d100 + @level", { level: getAverageLevel() }),
    rollMode: CONST.DICE_ROLL_MODES.PRIVATE,
  });
}

/**
 * Roll on the rarity and category tables.
 * @param {string} [catalogName]        The name of the compendium that contains the rolltable.
 * @returns {Promise<ChatMessage>}      The object with the roll and drawn results.
 */
export async function randomLoot({ catalogName } = {}) {
  catalogName ??= "rolltables";

  const tableRarity = await ZHELL.utils.getDocument("Random Loot: Rarity", catalogName, false);
  const tableType = await ZHELL.utils.getDocument("Random Loot: Type", catalogName, false);
  const roll = new Roll("1d100 + @level", { level: getAverageLevel() });
  const rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

  const rarity = await tableRarity.draw({ roll, rollMode, displayChat: false });
  const type = await tableType.draw({ rollMode, displayChat: false });

  return ChatMessage.create({
    content: `
    <hr>
    <div style="text-align: center"><strong>RANDOM<br>LOOT</strong></div>
    <hr>
    <div class="flexrow">
      <div><strong>Rarity</strong></div>
      <div style="text-align: center">${rarity.results[0].getChatText()}</div>
      <div style="text-align: center">${rarity.roll.total}</div>
    </div>
    <div class="flexrow">
      <div><strong>Type</strong></div>
      <div style="text-align: center">${type.results[0].getChatText()}</div>
      <div style="text-align: center">${type.roll.total}</div>
    </div>
    <hr>`,
    whisper: [game.user.id],
  });
}

/**
 * Get the average level of the party.
 * @returns {number}
 */
function getAverageLevel() {
  const id = game.settings.get(MODULE, "identifierSettings").players.folderId;
  const players = game.folders.get(id).contents.filter(a => {
    game.users.some(u => u.character === a);
  });
  const combinedLevel = players.reduce((acc, a) => acc + a.system.details.level, 0);
  return Math.floor(combinedLevel / players.length);
}

/**
 * Show a chat message with all the player's known languages in a table format.
 * @param {boolean} [whisper]           Whether the message should be whispered to the GM.
 * @returns {Promise<ChatMessage>}      The created chat message.
 */
export async function playerLanguages({ whisper = false } = {}) {
  const id = game.settings.get(MODULE, "identifierSettings").players.folderId;
  const players = game.folders.get(id).contents.filter(a => {
    return game.users.some(u => u.character === a);
  });

  const tableBody = players.reduce((actor_acc, actor) => {
    const { value, custom } = actor.system.traits.languages;
    let langB = custom?.length ? custom.split(";").map(c => c.trim()) : [];
    let languages = new Set([...value, ...langB]);
    return actor_acc + languages.reduce((lang_acc, lang, i) => {
      const leftCol = (i === 0) ? actor.name : "";
      const label = dnd5e.documents.Trait.keyLabel(`languages:${lang}`);
      return lang_acc + `<tr><td>${leftCol}</td><td>${label}</td></tr>`;
    }, "");
  }, "");

  const content = `
  <table style="border: none;">
    <thead>
      <tr>
        <td>Name</td>
        <td>Languages</td>
      </tr>
    </thead>
    <tbody>${tableBody}</tbody>
  </table>`;

  return ChatMessage.create({
    content: content,
    whisper: whisper ? [game.user.id] : [],
    "flags.core.canPopout": true,
  });
}
