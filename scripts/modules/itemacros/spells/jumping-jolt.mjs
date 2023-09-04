import {DEPEND} from "../../../const.mjs";
import {TargetSequencePicker} from "../../applications/targetSequencePicker.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function JUMPING_JOLT(item, speaker, actor, token) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);
  const file = "jb2a.chain_lightning.secondary.blue02";

  const tokenIds = await TargetSequencePicker.wait({
    range: 20,
    source: token,
    links: 5,
    unique: true,
    includeSource: false,
    maxDistance: 60
  });
  if (!tokenIds) return;

  for (const [idx, id] of Object.entries(tokenIds)) {
    const n = Number(idx);
    const previous = (n === 0) ? token.document : canvas.scene.tokens.get(tokenIds[n - 1]);
    const current = canvas.scene.tokens.get(id);
    const nextId = !!tokenIds[n + 1];

    const attack = await item.rollAttack({spellLevel: level});
    const damage = await item.rollDamage({spellLevel: level});

    new Sequence().effect().file(file).atLocation(previous).stretchTo(current).play();

    if (!nextId) return;
    const prompt = await Dialog.confirm({content: "<p>Did it hit and jumps to next target?</p>"});
    if (!prompt) return;
  }
}
