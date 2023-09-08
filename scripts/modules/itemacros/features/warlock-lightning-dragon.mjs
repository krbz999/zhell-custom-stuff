import {ImageAnchorPicker} from "../../applications/imageAnchorPicker.mjs";
import {ItemMacroHelpers} from "../../itemMacros.mjs";

export const warlockLightningDragon = {
  //LORD_OF_THUNDER,
  LIGHTNING_STEPS
};

/**
 * Lord of Thunder: Chaos.
 * Choose between the 5 options, update the item, then use it.
 */
async function LORD_OF_THUNDER(item, speaker, actor, token, character, event, args) {
  /**
   * Options:
   * - Con save, stunned until end of THEIR next turn.
   * - Str save, pushed 15ft (further) away.
   * - Str save, pulled 15ft closer (if at least 5 feet away).
   * - Dex save, prone.
   * - No save, cannot take reactions, deafened until start of THEIR next turn.
   */

  const buttons = {
    stun: {label: "Stun", callback},
    push: {label: "Push", callback},
    pull: {label: "Pull", callback},
    prone: {label: "Prone", callback},
    deaf: {label: "Deafen", callback}
  };

  return new Dialog({buttons}).render(true);

  async function callback(html, event) {
    const option = event.currentTarget.dataset.button;
    const target = game.user.targets.first();

    if (option === "stun") {
      await _updateSave("con");
      await _createEffect("stun");
    } else if (option === "push") {
      await _updateSave("str");
      await _createEffect();
      await _pushTarget(target);
    } else if (option === "pull") {
      await _updateSave("str");
      await _createEffect();
      await _pullTarget(target);
    } else if (option === "prone") {
      await _updateSave("dex");
      await _createEffect("prone");
    } else if (option === "deaf") {
      await _updateSave(null);
      await _createEffect("reaction", "deaf");
    }
    return item.use({}, {configureDialog: false});
  }

  async function _createEffect(...ids) {
    if (!ids.length) return item.deleteEmbeddedDocuments("ActiveEffect", [], {deleteAll: true});
    const datas = ids.map(id => CONFIG.statusEffects.find(e => e.id === id));
    await item.deleteEmbeddedDocuments("ActiveEffect", [], {deleteAll: true});
    return item.createEmbeddedDocuments("ActiveEffect", [{
      name: datas.map(d => game.i18n.localize(d.name)).join(" / "),
      statuses: ids,
      changes: datas.flatMap(d => d.changes ?? []),
      description: datas.map(d => d.description || "").join(""),
      icon: datas[0].icon,
      flags: datas.reduce((acc, d) => foundry.utils.mergeObject(acc, d.flags), {}),
      transfer: false
    }]);
  }
  async function _updateSave(type) {
    return item.update({"system.save.type": type});
  }
  async function _pushTarget(target) {}
  async function _pullTarget(target) {}
}

async function LIGHTNING_STEPS(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  // Pick friendly target within 5 feet.
  const targets = canvas.scene.tokens.reduce((acc, tokenDoc) => {
    if (token.document === tokenDoc) return acc;
    if (tokenDoc.disposition !== CONST.TOKEN_DISPOSITIONS.FRIENDLY) return acc;
    const dist = babonus.getMinimumDistanceBetweenTokens(token, tokenDoc.object, {gridSpaces: true});
    if (dist <= 5) acc.push({name: tokenDoc.id, src: tokenDoc.texture.src});
    return acc;
  }, []);
  if (!targets.length) {
    ui.notifications.warn("There are no friendly targets within 5 feet of you.");
    return null;
  }
  return new ImageAnchorPicker({top: targets, label: "Teleport!", callback}).render(true);

  async function callback(event, data) {
    const target = canvas.tokens.get(data.top[0]);
    if (!target) return;

    // Pick target location within 60 feet. (Restrict by sight?)
    const p = ItemMacroHelpers.drawCircle(token, 60);
    const {x, y, cancelled} = await ItemMacroHelpers.pickTargetLocation(token, 60);
    canvas.app.stage.removeChild(p);
    if (cancelled) return;

    // Move caster and friendly target instantly and show explosion of lightning.
    return new Sequence()
      .animation().on(token).fadeOut(500)
      .animation().on(target).fadeOut(500).waitUntilFinished()
      .effect().file("jb2a.chain_lightning.primary.blue02").atLocation(token.center).stretchTo({x, y}).waitUntilFinished()
      .effect().file("jb2a.explosion.02.blue").atLocation({x, y})
      .animation().on(token).teleportTo({x, y}).offset({x: -canvas.grid.size / 2, y: -canvas.grid.size / 2}).fadeIn(500)
      .animation().on(target).teleportTo({x, y}).offset({x: canvas.grid.size / 2, y: -canvas.grid.size / 2}).fadeIn(500)
      .play();
  }
}
