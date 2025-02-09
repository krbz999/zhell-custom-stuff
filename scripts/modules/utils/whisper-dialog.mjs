const { HTMLField, SetField, StringField } = foundry.data.fields;

export default async function whisperDialog() {
  const options = [];
  for (const user of game.users) {
    if (user === game.user) continue;
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

  const result = await foundry.applications.api.DialogV2.prompt({
    rejectClose: false,
    content: `<fieldset>${usersHTML}${textHTML}</fieldset>`,
    ok: {
      callback: (event, button) => new FormDataExtended(button.form).object,
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
  return getDocumentClass("ChatMessage").create({ content: result.message, whisper: result.users });
}
