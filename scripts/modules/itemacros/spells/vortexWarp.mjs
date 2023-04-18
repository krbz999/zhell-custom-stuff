import {DEPEND} from "../../../const.mjs";
import {drawCircle} from "../../animations.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function VORTEX_WARP(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG, DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const target = game.user.targets.first();
  if (!target) {
    ui.notifications.warn("You need to target a token.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const range = 30 * (level + 1);

  const p = drawCircle(token, range);

  await actor.sheet?.minimize();

  const pos = await warpgate.crosshairs.show({
    size: target.document.height,
    label: "Pick target location",
    rememberControlled: true,
    interval: ((target.document.height % 2) === 0) ? 1 : -1,
    drawIcon: false,
    texture: target.document.texture.src,
    tileTexture: false
  });
  canvas.app.stage.removeChild(p);
  if (pos.cancelled) return actor.sheet?.maximize();

  const offset = (target.document.height * canvas.scene.grid.size) / 2;

  const update = {token: {x: pos.x - offset, y: pos.y - offset, alpha: 0}};
  const options = {
    updateOpts: {token: {animate: false}},
    name: item.name,
    permanent: true,
    description: `${token.document.name} is attempting to move ${target.document.name} out of the way using ${item.name}. You can choose to fail the saving throw.`
  };

  const callbacks = {
    post: async (tokenDoc, updates) => {
      return new Sequence()
        .wait(500)
        .effect().atLocation(tokenDoc).file("jb2a.misty_step.02")
        .animation().delay(1000).on(tokenDoc).fadeIn(1000).waitUntilFinished().play();
    }
  }
  ui.notifications.info(`Attempting to warp ${target.document.name}!`);
  await actor.sheet?.maximize();
  return warpgate.mutate(target.document, update, callbacks, options);
}
