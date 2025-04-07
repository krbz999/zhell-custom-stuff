const { HTMLField, SetField, StringField } = foundry.data.fields;

export default async function whisperDialog() {
  const options = [];
  for (const user of game.users) {
    if (user.isSelf) continue;
    const selected = canvas.tokens.controlled.some(token => token.actor?.testUserPermission(user, "OWNER"));
    options.push({ selected, value: user.id, label: user.name });
  }

  const usersHTML = new SetField(new StringField()).toFormGroup(
    { label: "Users", classes: ["stacked"] },
    { name: "users", options: options, type: "checkboxes", sort: true },
  ).outerHTML;

  const textHTML = new HTMLField().toFormGroup(
    { label: "Message" },
    { name: "message", value: "", height: 200 },
  ).outerHTML;

  const result = await foundry.applications.api.Dialog.input({
    content: `<fieldset>${usersHTML}${textHTML}</fieldset>`,
    ok: {
      label: "Confirm",
      icon: "fa-solid fa-message",
    },
    position: {
      width: 400,
      height: "auto",
    },
    window: {
      title: "Whisper Users",
      icon: "fa-solid fa-message",
    },
  });
  if (!result) return;
  return foundry.utils.getDocumentClass("ChatMessage").create({
    content: result.message, whisper: result.users,
  });
}
