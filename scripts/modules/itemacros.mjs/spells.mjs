import { MODULE } from "../../const.mjs";
import { drawCircle } from "../animations.mjs";
import { _redisplayItem } from "../combatHelpers.mjs";
import { elementalDialog, imageAnchorDialog } from "../customDialogs.mjs";
import {
  _addTokenDismissalToEffect,
  _basicFormContent,
  _constructGenericEffectData,
  _constructLightEffectData,
  _getDependencies,
  _getItemDuration,
  _getSpellLevel,
  _spawnHelper,
  _teleportationHelper
} from "../itemMacros.mjs";

export const ITEMACRO_SPELLS = {
  FLAMING_SPHERE,
  MISTY_STEP,
  THUNDER_STEP,
  SPIRIT_SHROUD,
  FAR_STEP,
  ARMOR_OF_AGATHYS,
  ABSORB_ELEMENTS,
  CALL_LIGHTNING,
  BREATH_WEAPON,
  FATHOMLESS_EVARDS_BLACK_TENTACLES,
  CREATE_OR_DESTROY_WATER,
  SHIELD,
  RAINBOW_RECURVE,
  CROWN_OF_STARS,
  VORTEX_WARP,
  WIELDING,
  SPIRITUAL_WEAPON,
  MAGE_ARMOR,
  MOONBEAM,
  FIND_FAMILIAR
};

async function FLAMING_SPHERE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("warpgate", "concentrationnotifier", "effectmacro")) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return CN.redisplayCard(actor, item);

  const use = await item.use();
  if (!use) return;

  const updates = { token: { name: `${actor.name.split(" ")[0]}'s Flaming Sphere` } }
  const options = { crosshairs: { drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1 } };

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await _spawnHelper("Flaming Sphere", updates, {}, options);
  await actor.sheet?.maximize();
  const effect = CN.isActorConcentratingOnItem(actor, item);
  if (!spawn) return effect.delete();
  return _addTokenDismissalToEffect(effect, spawn);
}

async function SPIRITUAL_WEAPON(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("effectmacro", "warpgate")) return item.use();
  const isActive = actor.effects.find(e => {
    return e.getFlag("core", "statusId") === item.name.slugify();
  });
  if (isActive) {
    const level = isActive.getFlag(MODULE, "spellLevel");
    return _redisplayItem(item, level);
  }

  const use = await item.use();
  if (!use) return;
  const level = _getSpellLevel(use);
  const effectData = _constructGenericEffectData({ item, level });
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);

  const updates = { token: { name: `${actor.name.split(" ")[0]}'s Spiritual Weapon` } }
  const options = { crosshairs: { drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1 } };

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await _spawnHelper("Spiritual Weapon", updates, {}, options);
  await actor.sheet?.maximize();
  if (!spawn) return effect.delete();
  return _addTokenDismissalToEffect(effect, spawn);
}

async function MISTY_STEP(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("sequencer", "jb2a_patreon", "warpgate")) return item.use();
  const vanish = "jb2a.misty_step.01.blue";
  const appear = "jb2a.misty_step.02.blue";
  const distance = 30;

  const use = await item.use();
  if (!use) return;

  return _teleportationHelper({ item, actor, token, vanish, appear, distance });
}

async function THUNDER_STEP(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("sequencer", "jb2a_patreon", "warpgate")) return item.use();
  const vanish = "jb2a.thunderwave.center.blue";
  const appear = "jb2a.thunderwave.center.blue";
  const distance = 90;

  const use = await item.use();
  if (!use) return;

  return _teleportationHelper({ item, actor, token, vanish, appear, distance });
}

async function FAR_STEP(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("sequencer", "jb2a_patreon", "warpgate", "concentrationnotifier")) return item.use();
  const vanish = "jb2a.misty_step.01.purple";
  const appear = "jb2a.misty_step.02.purple";
  const distance = 60;

  const conc = CN.isActorConcentratingOnItem(actor, item);

  if (!conc) {
    const use = await item.use();
    if (!use) return;
  }

  return _teleportationHelper({ item, actor, token, vanish, appear, distance });
}

async function SPIRIT_SHROUD(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("concentrationnotifier", "visual-active-effects")) return item.use();

  const use = await item.use();
  if (!use) return;

  return new Dialog({
    title: "Spirit Shroud",
    content: "<p style='text-align:center'>Pick a damage type.</p>",
    buttons: {
      cold: {
        icon: "<i class='fa-solid fa-snowflake'></i>",
        label: "Cold",
        callback: () => flagEffect("cold")
      },
      necrotic: {
        icon: "<i class='fa-solid fa-skull'></i>",
        label: "Necrotic",
        callback: () => flagEffect("necrotic")
      },
      radiant: {
        icon: "<i class='fa-solid fa-holly-berry'></i>",
        label: "Radiant",
        callback: () => flagEffect("radiant")
      }
    }
  }).render(true);

  async function flagEffect(type) {
    const effect = CN.isActorConcentratingOnItem(actor, item);
    const level = effect.getFlag("concentrationnotifier", "data.castData.castLevel");
    const value = `+${Math.ceil(level / 2) - 1}d8[${type}]`;
    const mode = CONST.ACTIVE_EFFECT_MODES.ADD;
    const changes = [
      { key: "system.bonuses.mwak.damage", mode, value },
      { key: "system.bonuses.msak.damage", mode, value }
    ];
    return effect.update({ changes });
  }
}

async function ARMOR_OF_AGATHYS(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  const level = _getSpellLevel(use);
  return actor.applyTempHP(5 * level);
}

async function ABSORB_ELEMENTS(item, speaker, actor, token, character, event, args) {
  return elementalDialog({
    types: ["acid", "cold", "fire", "lightning", "thunder"],
    callback: resolve,
    content: "Choose the damage type.",
    title: item.name
  });

  async function resolve(s) {
    const use = await item.use();
    if (!use) return;
    const level = _getSpellLevel(use);

    const mode = CONST.ACTIVE_EFFECT_MODES.ADD;
    const value = `+${level}d6[${s}]`;
    const effectData = [{
      changes: [
        { key: "system.traits.dr.value", mode, value: s },
        { key: "system.bonuses.mwak.damage", mode, value },
        { key: "system.bonuses.msak.damage", mode, value }
      ],
      icon: item.img,
      label: item.name,
      origin: item.uuid,
      duration: { rounds: 1 },
      "flags.core.statusId": item.name.slugify(),
      "flags.visual-active-effects.data": {
        intro: `<p>You have ${s} resistance and deal ${level}d6 additional ${s} damage on your first melee attack before this effect expires.</p>`,
        content: item.system.description.value
      }
    }];
    return actor.createEmbeddedDocuments("ActiveEffect", effectData);
  }
}

async function CALL_LIGHTNING(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("concentrationnotifier", "visual-active-effects")) return item.use();
  const concentrating = CN.isActorConcentratingOnItem(actor, item);
  if (!concentrating) {
    const use = await item.use();
    if (!use) return;
  }
  return lightningStrike();

  async function lightningStrike() {
    const template = dnd5e.canvas.AbilityTemplate.fromItem(item);
    template.document.updateSource({ distance: 5 });
    return template.drawPreview();
  }
}

async function BREATH_WEAPON(item, speaker, actor, token, character, event, args) {
  const breaths = {
    acid: "jb2a.breath_weapons.fire.cone.green.02",
    cold: "jb2a.breath_weapons.cold.cone.blue",
    fire: "jb2a.breath_weapons.fire.cone.orange.02",
    lightning: "jb2a.breath_weapons.fire.cone.blue.02",
    poison: "jb2a.breath_weapons.poison.cone.green"
  }

  return elementalDialog({
    types: Object.keys(breaths),
    callback: resolve,
    content: "Choose the damage type.",
    title: item.name
  });

  async function resolve(s) {
    const type = breaths[s];
    await item.setFlag(MODULE, "breath-weapon.type", type);
    return item.use();
  }
}

async function FATHOMLESS_EVARDS_BLACK_TENTACLES(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;
  return actor.applyTempHP(actor.getRollData().classes.warlock.levels);
}

async function MOONBEAM(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("warpgate", "concentrationnotifier", "effectmacro")) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return CN.redisplayCard(actor, item);

  const use = await item.use();
  if (!use) return;

  const updates = { token: { name: `${actor.name.split(" ")[0]}'s Moonbeam` } }
  const options = { crosshairs: { drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1 } };

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await _spawnHelper("Moonbeam", updates, {}, options);
  await actor.sheet?.maximize();
  const effect = CN.isActorConcentratingOnItem(actor, item);
  if (!spawn) return effect.delete();
  return _addTokenDismissalToEffect(effect, spawn);
}

async function CREATE_OR_DESTROY_WATER(item, speaker, actor, token, character, event, args) {
  new Dialog({
    title: item.name,
    buttons: {
      container: {
        icon: "<i class='fa-solid fa-glass-water'></i>",
        label: "Create/destroy water in a container",
        callback: container
      },
      rain: {
        icon: "<i class='fa-solid fa-cloud-showers-water'></i>",
        label: "Conjure rain in a cube",
        callback: createDestroy
      },
      fog: {
        icon: "<i class='fa-solid fa-smog'></i>",
        label: "Destroy fog in a cube",
        callback: createDestroy
      }
    }
  }).render(true);

  async function container() {
    return item.use();
  }

  async function createDestroy() {
    return item.use();
    /*const clone = item.clone({
      "system.target.value": null,
      "system.target.width": null,
      "system.target.untis": null,
      "system.target.type": null
    }, {keepId: true});
    clone.prepareFinalAttributes();
    const use = await clone.use();
    if (!use) return;
    const level = _getSpellLevel(use);
    const cube = 5 * level + 25;
    const template = dnd5e.canvas.AbilityTemplate.fromItem(item);
    template.document.updateSource({ t: "ray", distance: cube, width: cube });
    return template.drawPreview();*/
  }
}

async function SHIELD(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  return actor.createEmbeddedDocuments("ActiveEffect", [{
    changes: [{ key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 5 }],
    icon: item.img,
    label: item.name,
    origin: item.uuid,
    duration: { rounds: 1 },
    "flags.core.statusId": item.name.slugify(),
    "flags.visual-active-effects.data": {
      intro: "<p>You have a +5 bonus to your AC and immunity to damage from the Magic Missile spell.</p>",
      content: item.system.description.value
    },
    "flags.effectmacro.onTurnStart.script": `(${function() { return effect.delete(); }})()`
  }]);
}

async function RAINBOW_RECURVE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("concentrationnotifier", "rollgroups")) return item.use();

  let effect = CN.isActorConcentratingOnItem(actor, item);

  const colors = [
    { color: "red", text: "The target takes an additional 3d8 fire damage." },
    { color: "orange", text: "The target takes an additional 3d8 acid damage." },
    { color: "yellow", text: "The target takes an additional 3d8 lightning damage." },
    { color: "green", text: "The target takes an additional 3d8 poison damage." },
    { color: "blue", text: "The target takes an additional 3d8 cold damage." },
    { color: "indigo", text: "The target is paralyzed. It can make a Constitution saving throw at the end of each of its turns, ending the paralyzed condition on a success." },
    { color: "violet", text: "The target is blinded. It must then make a Wisdom saving throw at the start of your next turn. A successful save ends the blinded condition. If it fails that save, the creature is transported to another plane of existence of the GM's choosing and is no longer blinded. (Typically, a creature that is on a plane that is not its home plane is banished home, while other creatures are usually cast into the Astral or Ethereal Planes.)" }
  ];

  // if not concentrating, cast the spell.
  if (!effect) {
    const use = await item.use({}, { createMessage: false });
    if (!use) return;
    effect = await CN.waitForConcentrationStart(actor, { item, max_wait: 1000 });
    if (!effect) return;
  }
  return chooseArrow();

  async function _checkForRemainingArrows() {
    const arrows = effect.getFlag(MODULE, "arrow-fired") ?? {};
    const available = colors.filter(c => !arrows[c.color]);
    if (!available.length) {
      await effect.delete();
      return false;
    }
    return available;
  }

  // dialog to choose arrow.
  async function chooseArrow() {
    const available = await _checkForRemainingArrows();
    if (!available) return;

    const options = available.reduce((acc, c) => {
      return acc + `<option value="${c.color}">${c.color.titleCase()}</option>`;
    }, "<option>&mdash;</option>");

    return Dialog.prompt({
      title: item.name,
      content: _basicFormContent({ label: "Select arrow:", type: "select", options }) + "<p id='arrow-desc'></p>",
      rejectClose: false,
      label: "Shoot!",
      callback: async (html) => {
        const arrow = html[0].querySelector("select").value;
        return shootArrow(arrow);
      },
      options: { classes: ["dialog", "auto-height-dialog"] },
      render: (html) => {
        const s = html[0].querySelector("select");
        const p = html[0].querySelector("#arrow-desc");
        s.addEventListener("change", function() {
          const d = colors.find(c => c.color === s.value);
          p.innerText = d.text;
        });
      }
    });
  }

  // create item clone.
  async function shootArrow(arrow) {
    const groups = [{ label: "Force", parts: [0] }];

    const addGroup = {
      red: { label: "Fire", parts: [1] },
      orange: { label: "Acid", parts: [2] },
      yellow: { label: "Lightning", parts: [3] },
      green: { label: "Poison", parts: [4] },
      blue: { label: "Cold", parts: [5] }
    }[arrow] ?? false;
    if (addGroup) groups.push(addGroup);

    const addSave = { indigo: "con", violet: "wis" }[arrow] ?? false;

    await effect.setFlag("concentrationnotifier", "data", {
      "itemData.flags.rollgroups.config.groups": groups
    });

    const card = await CN.redisplayCard(actor);

    // add new saving throw button.
    if (addSave) {
      const div = document.createElement("DIV");
      div.innerHTML = card.content;
      const oldSave = div.querySelector("button[data-action=save]");
      const dc = actor.system.attributes.spelldc;

      const saveType = CONFIG.DND5E.abilities[addSave];
      const newSaveButton = document.createElement("button");
      newSaveButton.setAttribute("data-action", "save");
      newSaveButton.setAttribute("data-ability", addSave);
      newSaveButton.innerHTML = game.i18n.format("CN.CARD.PROMPT.SAVE", { dc, saveType });
      oldSave.after(newSaveButton);
      await card.update({ content: div.innerHTML });
    }
    await effect.setFlag(MODULE, `arrow-fired.${arrow}`, true);
    return _checkForRemainingArrows();
  }
}

async function CROWN_OF_STARS(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("concentrationnotifier")) return item.use();
  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (!isConc) {
    const use = await item.use();
    if (!use) return;
    const conc = await CN.waitForConcentrationStart(actor, { item });
    if (!conc) return;
    const level = _getSpellLevel(use);
    const motes = 2 * level - 7;
    return conc.setFlag(MODULE, "crown-of-stars", motes);
  }

  const motes = isConc.getFlag(MODULE, "crown-of-stars") ?? 1;
  if (motes < 1) return isConc.delete();
  await CN.redisplayCard(actor);
  return (motes - 1 === 0) ? isConc.delete() : isConc.setFlag(MODULE, "crown-of-stars", motes - 1)
}

async function VORTEX_WARP(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("warpgate", "sequencer", "jb2a_patreon")) return item.use();

  const target = game.user.targets.first();
  if (!target) {
    ui.notifications.warn("You need to target a token.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  const level = _getSpellLevel(use);
  const range = 30 * (level + 1);

  const p = drawCircle(token, range);

  const pos = await warpgate.crosshairs.show({
    size: target.document.height,
    label: "Pick target location",
    rememberControlled: true,
    interval: target.document.height % 2 === 0 ? 1 : -1,
    drawIcon: false,
    texture: target.document.texture.src,
    tileTexture: false
  });
  canvas.app.stage.removeChild(p);
  if (pos.cancelled) return;

  const offset = (target.document.height * canvas.scene.grid.size) / 2

  const update = { token: { x: pos.x - offset, y: pos.y - offset, alpha: 0 } };
  const options = {
    token: { animate: false }, // fix this when badger fixes the discrepancy; nest in 'updateOpts'.
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
  return warpgate.mutate(target.document, update, callbacks, options);
}

async function WIELDING(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("concentrationnotifier", "visual-active-effects", "effectmacro")) return item.use();
  const isConc = CN.isActorConcentratingOnItem(actor, item);
  if (isConc) return;

  const use = await item.use();
  if (!use) return;
  const level = _getSpellLevel(use);

  const target = game.user.targets.first();

  function getWeaponOptions(actorDoc) {
    const pre = actorDoc === actor ? "" : "[Target] ";
    return actorDoc?.itemTypes.weapon.reduce((acc, e) => {
      return acc + `<option value="${e.uuid}">${pre}${e.name}</option>`;
    }, "") ?? "";
  }
  const options = getWeaponOptions(actor) + getWeaponOptions(target?.actor);
  const content = _basicFormContent({ type: "select", options, label: "Choose weapon:" });

  const uuid = await Dialog.prompt({
    title: item.name,
    label: "Cast",
    rejectClose: false,
    content,
    callback: (html) => html[0].querySelector("select").value
  });
  if (!uuid) return CN.isActorConcentratingOnItem(actor, item)?.delete();

  const weapon = await fromUuid(uuid);
  const att = (weapon.system.attunement === 0) ? 0 : (level < 5) ? 1 : 2;
  const itemData = foundry.utils.mergeObject(weapon.toObject(), {
    "system.proficient": true,
    "system.ability": actor.system.attributes.spellcasting,
    "system.equipped": true,
    "system.attunement": att
  });
  delete itemData.system.consume;
  delete itemData.system.uses;
  const conc = CN.isActorConcentratingOnItem(actor, item);
  await conc.createMacro("onDelete", function() {
    const id = effect.getFlag("world", "storedFlag");
    return actor.effects.get(id)?.delete();
  });

  const [{ id }] = await actor.createEmbeddedDocuments("ActiveEffect", [{
    icon: itemData.img,
    label: `${itemData.name} (${item.name})`,
    "flags.core.statusId": item.name.slugify(),
    origin: actor.uuid,
    duration: foundry.utils.duplicate(conc.duration),
    "flags.visual-active-effects.data": {
      intro: `<p>You are in control of ${itemData.name}.</p><p class="zhell-custom-buttons"><a data-type="use">${itemData.name}</a></p>`,
      content: itemData.system.description.value
    },
    [`flags.${MODULE}.itemData`]: itemData
  }]);

  return conc.setFlag("world", "storedFlag", id);
}

async function MAGE_ARMOR(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("warpgate")) return item.use();

  const mutName = `${item.name} (${actor.name})`;
  const statusId = `${item.name.slugify()}-${actor.name.slugify()}`;

  const hasArmor = canvas.scene.tokens.filter(token => {
    return token.actor.effects.find(e => {
      return e.getFlag("core", "statusId") === statusId;
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
    acc.push({ name: t.id, src: t.texture.src });
    return acc;
  }, []);

  return imageAnchorDialog({ label: "Cast!", title: item.name, callback: _mageArmor, top });

  async function _mageArmor(html) {
    const tokenId = html[0].querySelector(".image-selector .top-selection a.active").dataset.name;
    const token = canvas.scene.tokens.get(tokenId);
    return warpgate.mutate(token, {
      embedded: {
        ActiveEffect: {
          [statusId]: {
            label: item.name,
            icon: item.img,
            origin: actor.uuid,
            duration: _getItemDuration(item),
            changes: [{ key: "system.attributes.ac.calc", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "mage" }],
            "flags.core.statusId": statusId,
            "flags.visual-active-effects.data": {
              intro: "<p>Your AC is increased by Mage Armor.</p>",
              content: item.system.description.value
            }
          }
        }
      }
    }, {}, { name: mutName, comparisonKeys: { ActiveEffect: "flags.core.statusId" } });
  }
}

async function FIND_FAMILIAR(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies("warpgate")) return item.use();
  const isDevinn = actor.name.includes("Devinn") && "Alyk";
  const isDrazvik = actor.name.includes("Draz") && "Vrax";
  const use = await item.use();
  if (!use) return;
  return _spawnHelper(isDevinn ? isDevinn : isDrazvik ? isDrazvik : "dummy");
}

async function __(item, speaker, actor, token, character, event, args) {
  return imageAnchorDialog({
    label: "Steve",
    title: "Steve?",
    callback: () => {},
    top: canvas.scene.tokens.map(t => ({ name: t.name, src: t.texture.src })),
    middle: canvas.scene.tokens.map(t => ({ name: t.name, src: t.texture.src })),
    bottom: canvas.scene.tokens.map(t => ({ name: t.name, src: t.texture.src })),
    allowMultiple: true
  });
}
