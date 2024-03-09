import {TargetSequencePicker} from "../../applications/targetSequencePicker.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function JUMPING_JOLT(item, speaker, actor, token) {
  const use = await item.use();
  if (!use) return;

  const level = ItemMacroHelpers._getSpellLevel(use);

  const tokenIds = await TargetSequencePicker.wait({
    range: 20,
    source: token,
    links: 5,
    unique: true,
    includeSource: false,
    maxDistance: 60
  });
  if (!tokenIds) return;

  for (const [idx] of Object.entries(tokenIds)) {
    const n = Number(idx);
    const nextId = !!tokenIds[n + 1];

    const attack = await item.rollAttack({spellLevel: level});
    const damage = attack ? await item.rollDamage({spellLevel: level}) : null;
    if (!attack || !damage || !nextId) return null;
    const prompt = await Dialog.confirm({content: "<p>Did it hit and jumps to next target?</p>"});
    if (!prompt) return;
  }
}
