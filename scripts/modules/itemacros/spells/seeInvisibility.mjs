import {DEPEND} from "../../../const.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function SEE_INVISIBILITY(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.EM)) return item.use();

  const data = ItemMacroHelpers._constructDetectionModeEffectData({
    item,
    modes: [{
      id: "seeInvisibility",
      range: token.document.sight.range ?? 60,
      enabled: true
    }]
  });
  foundry.utils.mergeObject(data[0], {
    description: "You can see invisible creatures.",
    [`flags.${DEPEND.VAE}.data.content`]: item.system.description.value
  });
  return actor.createEmbeddedDocuments("ActiveEffect", data);
}
