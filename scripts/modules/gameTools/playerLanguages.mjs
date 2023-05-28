/**
 * Show a chat message with all the player's known languages in a table format.
 * @param {string} [folderId]           The folder that contains all the actors.
 * @param {boolean} [whisper]           Whether the message should be whispered to the GM.
 * @returns {Promise<ChatMessage>}      The created chat message.
 */
export async function playerLanguages({folderId = "v0ikCyAle4wCJBFk", whisper = false} = {}) {
  // Display all players' languages.

  const players = game.actors.filter(a => a.folder?.id === folderId);

  const tableBody = players.reduce((actor_acc, actor) => {
    const {value, custom} = actor.system.traits.languages;
    let langA = value.map(i => CONFIG.DND5E.languages[i]);
    let langB = custom?.length ? custom.split(";").map(c => c.trim()) : [];
    let languages = [...langA, ...langB];
    return actor_acc + languages.reduce((lang_acc, lang, i) => {
      const leftCol = (i === 0) ? actor.name : "";
      return lang_acc + `<tr><td>${leftCol}</td><td>${lang}</td></tr>`;
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

  const messageData = {content, "flags.core.canPopout": true};
  if (whisper) messageData.whisper = [game.user.id];

  return ChatMessage.create(messageData);
}
