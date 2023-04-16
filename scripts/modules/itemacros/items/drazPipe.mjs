import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

/**
 * Simply show a smoke animation.
 */
export function PIPE(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A) || !token) return item.use();
  const file = "jb2a.smoke.puff.centered.dark_green.1";
  return new Sequence()
    .effect().file(file).atLocation(token, {
      offset: {x: canvas.grid.size / 3, y: -canvas.grid.size / 4}
    }).size(canvas.grid.size).play();
}
