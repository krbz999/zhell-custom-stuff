export const draconiz = {SHOW_OF_FORCE, SIZE_UP};

/**
 * Turn the token to Large with an animation, creating an effect on the actor with an
 * attached Effect Macro to toggle the size and the other attributes.
 */
async function SHOW_OF_FORCE(item) {
  const use = await item.use();
  if (!use) return;

  // when create effect, trigger mutation. When delete effect, remove mutation.
  const effectData = [{
    icon: item.img,
    name: item.name,
    duration: {seconds: 60},
    origin: item.uuid,
    statuses: [item.name.slugify({strict: true})],
    description: "<p>Your size is increased to Large, your movement speed increases by 10 feet, you deal an additional <strong>1d4</strong> damage with melee weapons, and your melee weapon attacks are critical hits on a roll of 19 or 20.</p>",
    changes: [
      {key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 10},
      {key: "system.bonuses.mwak.damage", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1d4"},
      {key: "flags.dnd5e.weaponCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 19},
      {key: "system.traits.size", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "lg"},
    ]
  }];
  return item.actor.createEmbeddedDocuments("ActiveEffect", effectData);
}

/**
 * Display a message for the user comparing Strength and Constitution with their target.
 */
async function SIZE_UP(item) {
  const use = await item.use();
  if (!use) return;

  const target = game.user.targets.first();
  if (!target?.actor) {
    ui.notifications.warn("If you had a target, you'd know immediately.");
    return null;
  }

  if (["vehicle", "group"].includes(target.actor.type)) {
    ui.notifications.warn("You can only compare your abilities to that of another creature.");
    return null;
  }

  const mine = item.actor.system.abilities;
  const theirs = target.actor.system.abilities;

  let content = "";

  for (const abi of ["str", "con"]) {
    const name = CONFIG.DND5E.abilities[abi].label;
    if (mine[abi].value === theirs[abi].value) content += `<p>Your ${name} scores are equal.</p>`;
    else if (mine[abi].value > theirs[abi].value) content += `<p>Your ${name} score is highest.</p>`;
    else content += `<p>Their ${name} score is highest.</p>`;
  }
  const whisper = ChatMessage.implementation.getWhisperRecipients("GM");
  return ChatMessage.implementation.create({
    content: content,
    speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
    whisper: whisper
  });
}
