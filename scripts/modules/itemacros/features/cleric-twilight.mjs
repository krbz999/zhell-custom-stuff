import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const twilight = {EYES_OF_NIGHT, STEPS_OF_NIGHT, TWILIGHT_SANCTUARY};

async function EYES_OF_NIGHT(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG)) return item.use();
  const range = 120;
  const mod = Math.max(actor.system.abilities.wis.mod, 1);
  if (!game.user.targets.size.between(1, mod)) {
    ui.notifications.error(`Please target between 1 and ${mod} creatures.`);
    return;
  }

  const name = `Darkvision (${range}ft)`;
  const updates = {
    actor: {"system.attributes.senses.darkvision": range},
    token: {sight: {visionMode: "darkvision", range, ...CONFIG.Canvas.visionModes.darkvision.vision.defaults}}
  }
  const options = {
    name,
    description: `You are being granted ${range} feet of darkvision.`
  }

  const use = await item.use();
  if (!use) return;
  ui.notifications.info("Granting darkvision to your targets!");
  for (const target of game.user.targets) warpgate.mutate(target.document, updates, {}, options);
}

async function STEPS_OF_NIGHT(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  return actor.createEmbeddedDocuments("ActiveEffect", [{
    name: item.name,
    origin: item.uuid,
    changes: [{
      key: "system.attributes.movement.fly",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      value: actor.system.attributes.movement.walk
    }],
    duration: {seconds: 60},
    icon: item.img,
    statuses: [item.name.slugify({strict: true})],
    description: "You have a flying speed equal to your walking speed.",
    "flags.visual-active-effects.data.content": item.system.description.value
  }]);
}

async function TWILIGHT_SANCTUARY(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.WG)) return item.use();

  // Constants.
  const status = item.name.slugify({strict: true});
  const file = "jb2a.markers.circle_of_stars.orangepurple";
  const error = "Please target a token.";
  const target = game.user.targets.first();

  if (!actor.statuses.has(status)) {
    const use = await item.use();
    if (!use) return;

    const [eff] = await actor.createEmbeddedDocuments("ActiveEffect", [{
      icon: item.img,
      name: item.name,
      origin: item.uuid,
      statuses: [status],
      description: "When a creature ends their turn within your twilight sanctuary, you may choose to grant them temporary hit points or end the charmed or frightened condition on them.",
      "duration.seconds": 60,
      "flags.visual-active-effects.data.content": item.system.description.value,
    }]);

    return new Sequence()
      .effect().attachTo(token).persist().name(item.name).file(file).size(canvas.grid.size * 8)
      .scaleIn(0, 800, {ease: "easeOutCubic"}).rotateIn(180, 1200, {ease: "easeOutCubic"})
      .scaleOut(0, 500, {ease: "easeOutCubic"}).fadeOut(500, {ease: "easeOutCubic"})
      .tieToDocuments(eff)
      .play({remote: true});
  }

  new Dialog({
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
    if (!target) return ui.notifications.error(error);
    const {total} = await item.rollDamage({options: {fastForward: true}}) ?? {};
    if (!total) return;
    const temp = target.actor.system.attributes.hp.temp ?? 0;
    const updates = {actor: {"system.attributes.hp.temp": total}};
    const options = {
      permanent: true,
      description: `${actor.name} is granting you ${total} temporary hit points.`
    };
    if (total > temp) {
      ui.notifications.info(`Granting temporary hit points to ${target.document.name}!`);
      return warpgate.mutate(target.document, updates, {}, options);
    }
  }

  async function removeEffect() {
    if (!target) return ui.notifications.error(error);
    const content = `${actor.name} ends the charmed or frightened condition on ${target.name}.`;
    return ChatMessage.create({speaker, content});
  }
}
