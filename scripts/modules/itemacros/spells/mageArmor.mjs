import {DEPEND} from "../../../const.mjs";
import {ImageAnchorPicker} from "../../applications/imageAnchorPicker.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export async function MAGE_ARMOR(item, speaker, actor, token, character, event, args) {
  if (!ItemMacroHelpers._getDependencies(DEPEND.WG)) return item.use();

  const mutName = `${item.name} (${actor.name})`;
  const identifier = `${item.name.slugify({strict: true})}-${actor.name.slugify({strict: true})}`;

  const hasArmor = canvas.scene.tokens.filter(token => {
    return token.actor.effects.find(e => {
      return e.flags.world?.mageArmor === identifier;
    });
  });

  if (hasArmor.length) {
    hasArmor.forEach(token => warpgate.revert(token, mutName));
    ui.notifications.info("Dismissing Mage Armor on all previous targets.");
  }

  const use = await item.use();
  if (!use) return;

  const top = canvas.scene.tokens.reduce((acc, t) => {
    if (t.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE) return acc;
    acc.push({name: t.id, src: t.texture.src});
    return acc;
  }, []);

  return new ImageAnchorPicker({label: "Cast!", title: item.name, callback: _mageArmor, top}).render(true);

  async function _mageArmor(event, {top}) {
    const tokenId = top[0];
    const target = canvas.scene.tokens.get(tokenId);
    ui.notifications.info(`Applying Mage Armor to ${target.name}!`);
    return warpgate.mutate(target, {
      embedded: {
        ActiveEffect: {
          [identifier]: {
            name: item.name,
            icon: item.img,
            origin: actor.uuid,
            duration: ItemMacroHelpers._getItemDuration(item),
            changes: [{key: "system.attributes.ac.calc", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "mage"}],
            statuses: [identifier],
            description: "Your AC is increased by Mage Armor.",
            "flags.world.mageArmor": identifier,
            "flags.visual-active-effects.data.content": item.system.description.value
          }
        }
      }
    }, {}, {name: mutName, comparisonKeys: {ActiveEffect: "flags.world.mageArmor"}});
  }
}
