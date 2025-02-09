export async function whisperDialog() {
  const options = [];
  for (const user of game.users) {
    if (user === game.user) continue;
    const selected = canvas.tokens.controlled.some(token => token.actor?.testUserPermission(user, "OWNER"));
    options.push({ selected, value: user.id, label: user.name });
  }

  const usersHTML = new foundry.data.fields.SetField(new foundry.data.fields.StringField()).toFormGroup(
    { label: "Users", classes: ["stacked"] },
    { name: "users", options: options, type: "checkboxes" },
  ).outerHTML;

  const textHTML = new foundry.data.fields.HTMLField().toFormGroup(
    { label: "Message" },
    { name: "message", value: "", height: 200 },
  ).outerHTML;

  const content = `<fieldset>${usersHTML}${textHTML}</fieldset>`;

  const callback = (event, button) => {
    const { users, message } = new FormDataExtended(button.form).object;
    ChatMessage.implementation.create({ content: message, whisper: users });
  };

  foundry.applications.api.DialogV2.prompt({
    rejectClose: false,
    content: content,
    ok: { callback: callback },
    position: { width: 400, height: "auto" },
    window: { title: "Whisper Users" },
  });
}
