export default async function whisperDialog() {
  const options = [];
  for (const user of game.users) {
    if (user.isSelf) continue;
    options.push({
      selected: canvas.ready && canvas.tokens.controlled.some(token => token.actor?.testUserPermission(user, "OWNER")),
      value: user.id,
      label: user.name,
    });
  }

  const usersHTML = foundry.applications.fields.createFormGroup({
    label: game.i18n.localize("DOCUMENT.Users"),
    hint: "Select users to whisper to. If selecting none, whisper to self.",
    stacked: true,
    input: foundry.applications.fields.createMultiSelectInput({ options, name: "users", type: "checkboxes", sort: true }),
  }).outerHTML;

  const textHTML = foundry.applications.elements.HTMLProseMirrorElement.create({
    name: "message", value: "", height: 300,
  }).outerHTML;

  const result = await foundry.applications.api.Dialog.input({
    content: `<fieldset>${usersHTML}<hr>${textHTML}</fieldset>`,
    ok: { icon: "fa-solid fa-message" },
    position: {
      width: 600,
      height: "auto",
    },
    window: {
      title: "Whisper Users",
      icon: "fa-solid fa-message",
    },
  });
  if (!result || !result.message) return null;
  return foundry.utils.getDocumentClass("ChatMessage").create({
    content: result.message, whisper: result.users.length ? result.users : [game.user.id],
  });
}
