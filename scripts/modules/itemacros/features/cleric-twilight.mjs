export const twilight = {TWILIGHT_SANCTUARY};

async function TWILIGHT_SANCTUARY(item) {
  // Constants.
  const status = item.name.slugify({strict: true});

  if (!item.actor.statuses.has(status)) {
    const use = await item.use();
    if (!use) return;

    return item.actor.createEmbeddedDocuments("ActiveEffect", [{
      icon: item.img,
      name: item.name,
      origin: item.uuid,
      statuses: [status],
      description: "When a creature ends their turn within your twilight sanctuary, you may choose to grant them temporary hit points or end the charmed or frightened condition on them.",
      "duration.seconds": 60,
      "flags.visual-active-effects.data.content": item.system.description.value,
    }]);
  }

  const target = game.user.targets.first();
  if (!target) {
    ui.notifications.error("Please target a token.");
    return null;
  }

  return new Dialog({
    title: item.name,
    content: `<p style="text-align: center;">Current target: <strong><em>${target.document.name}</em></strong></p>`,
    buttons: {
      hp: {
        icon: "<i class='fa-solid fa-heart'></i>",
        label: "Grant temp HP",
        callback: grantTempHP
      },
      effect: {
        icon: "<i class='fa-solid fa-check'></i>",
        label: "End an effect",
        callback: removeEffect
      }
    }
  }).render(true);


  async function grantTempHP() {
    const name = target.document.name.split(" ")[0];
    const {total} = await item.rollDamage({options: {fastForward: true, flavor: `Temporary hit points for ${name}`}}) ?? {};
    if (!total) return;
    const temp = target.actor.system.attributes.hp.temp ?? 0;
    if (total > temp) {
      ui.notifications.info(`Granting temporary hit points to ${name}!`);
      return ZHELL.token.healToken({tokenId: target.id, amount: total, temp: true});
    }
  }

  async function removeEffect() {
    const content = `${item.actor.name} ends the charmed or frightened condition on ${target.name}.`;
    return ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
      content: content
    });
  }
}
