import {DEPEND, MODULE} from "../../const.mjs";
import {columnDialog} from "../customDialogs.mjs";
import {
  _addTokenDismissalToEffect,
  _basicFormContent,
  _constructGenericEffectData,
  _constructLightEffectData,
  _constructSpellSlotOptions,
  _getDependencies,
  _spawnHelper
} from "../itemMacros.mjs";

export const ITEMACRO_FEATURES = {
  ARCANE_RECOVERY,
  BURNING_WEAPON,
  DIVINE_SMITE,
  DWARVEN_FORTITUDE,
  EXPERIMENTAL_ELIXIR,
  EYES_OF_NIGHT,
  FONT_OF_MAGIC,
  HARNESS_DIVINE_POWER,
  LAY_ON_HANDS,
  RELENTLESS_ENDURANCE,
  STARRY_FORM,
  STEPS_OF_NIGHT,
  TENTACLE_OF_THE_DEEPS,
  TWILIGHT_SANCTUARY,
  WARMING_RESPITE,
};

async function EYES_OF_NIGHT(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.WG)) return item.use();
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
    label: item.name,
    origin: item.uuid,
    changes: [{
      key: "system.attributes.movement.fly",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      value: actor.system.attributes.movement.walk
    }],
    duration: {seconds: 60},
    icon: item.img,
    "flags.core.statusId": item.name.slugify({strict: true}),
    "flags.visual-active-effects.data": {
      intro: "<p>You have a flying speed equal to your walking speed.</p>",
      content: item.system.description.value
    }
  }]);
}

async function TWILIGHT_SANCTUARY(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.WG)) return item.use();

  // CONSTS
  const id = item.name.slugify({strict: true});
  const file = "jb2a.markers.circle_of_stars.orangepurple";
  const error = "Please target a token.";
  const target = game.user.targets.first();

  // find Sequencer effect
  const e = actor.effects.find(e => e.flags.core?.statusId === id);

  if (!e) {
    const use = await item.use();
    if (!use) return;

    const [eff] = await actor.createEmbeddedDocuments("ActiveEffect", [{
      icon: item.img,
      label: item.name,
      origin: item.uuid,
      "duration.seconds": 60,
      "flags.visual-active-effects.data": {
        intro: "<p>When a creature ends their turn within your twilight sanctuary, you may choose to grant them temporary hit points or end the charmed or frightened condition on them.</p>",
        content: item.system.description.value
      },
      "flags.core.statusId": id
    }]);

    return new Sequence()
      .effect().attachTo(token).persist().name(item.name).file(file).size(canvas.grid.size * 8)
      .scaleIn(0, 800, {ease: "easeOutCubic"}).rotateIn(180, 1200, {ease: "easeOutCubic"})
      .scaleOut(0, 500, {ease: "easeOutCubic"}).fadeOut(500, {ease: "easeOutCubic"})
      .tieToDocuments(eff).play();
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
    const updates = {actor: {"system.attributes.hp.temp": total}}
    const options = {
      permanent: true,
      description: `${actor.name} is granting you ${total} temporary hit points.`
    }
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

async function DIVINE_SMITE(item, speaker, actor, token, character, event, args) {
  const options = _constructSpellSlotOptions(actor);
  if (!options.length) {
    ui.notifications.warn("You have no spell slots remaining.");
    return;
  }
  const content = `
  <form>
    <div class="form-group">
      <label>Spell Slot:</label>
      <div class="form-fields">
        <select id="divine-smite-slot" autofocus>${options}</select>
        <input type="checkbox" id="divine-smite-extra">
        <label for="divine-smite-extra" style="white-space: nowrap;">Extra die</label>
      </div>
    </div>
  </form>`;

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      smite: {
        label: "Smite!",
        icon: "<i class='fa-solid fa-gavel'></i>",
        callback: rollDamage
      }
    }
  }).render(true);

  async function rollDamage(html, event) {
    const slot = html[0].querySelector("#divine-smite-slot").value;
    const extra = html[0].querySelector("#divine-smite-extra").checked;
    const level = slot === "pact" ? actor.system.spells["pact"].level : Number(slot.at(-1));
    const dice = Math.min(5, 1 + level) + (extra ? 1 : 0);
    const formula = `${dice}d8`;

    const roll = await new Item.implementation({
      type: "feat",
      name: item.name,
      system: {damage: {parts: [[formula, "radiant"]]}}
    }, {parent: actor}).rollDamage({event});
    if (!roll) return;
    const value = actor.system.spells[slot].value - 1;
    return actor.update({[`system.spells.${slot}.value`]: value});
  }
}

async function HARNESS_DIVINE_POWER(item, speaker, actor, token, character, event, args) {
  const data = actor.getRollData();
  const maxLevel = Math.ceil(data.attributes.prof / 2);

  const options = _constructSpellSlotOptions(actor, {missing: true, maxLevel});

  if (!options.length) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return;
  }

  const uses = item.system.uses.value;
  if (!uses) {
    ui.notifications.warn("You have no uses left of Harness Divine Power.");
    return;
  }

  const resourceItem = actor.items.get(item.system.consume.target);
  const resource = resourceItem.system.uses.value;
  if (!resource) {
    ui.notifications.warn("You have no uses left of Channel Divinity.");
    return;
  }

  const content = _basicFormContent({label: "Spell Slot:", type: "select", options});

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      run: {
        icon: "<i class='fa-solid fa-hand-sparkles'></i>",
        label: "Recover",
        callback: harness
      }
    }
  }).render(true);

  async function harness(html, event) {
    const key = html[0].querySelector("select").value;
    const path = `system.spells.${key}.value`;
    const newValue = foundry.utils.getProperty(actor, path) + 1;
    await actor.update({[path]: newValue});
    await actor.updateEmbeddedDocuments("Item", [
      {_id: resourceItem.id, "system.uses.value": resource - 1},
      {_id: item.id, "system.uses.value": uses - 1}
    ]);
    return ChatMessage.create({speaker, content: `${actor.name} recovered a spell slot using ${item.name}.`});
  }
}

async function LAY_ON_HANDS(item, speaker, actor, token, character, event, args) {
  const value = item.system.uses.value;
  if (!value) {
    ui.notifications.warn(`${item.name} has no uses left.`);
    return;
  }

  const range = HandlebarsHelpers.rangePicker({hash: {min: 1, max: value, value: 1, step: 1, name: item.name.slugify({strict: true})}});

  const content = `
  ${item.system.description.value}
  <form>
    <div class="form-group">
      <label>Hit points to restore:</label>
      <div class="form-fields">${range}</div>
    </div>
  </form>`;

  const buttons = {
    heal: {
      icon: "<i class='fa-solid fa-hand-holding-heart'></i>",
      label: "Heal! (1+)",
      callback: heal
    },
    cure: {
      icon: "<i class='fa-solid fa-virus'></i>",
      label: "Cure! (5)",
      callback: cure
    }
  }
  if (value < 5) delete buttons.cure;

  return new Dialog({
    title: item.name,
    content,
    buttons,
    render: (html) => {
      const target = html[0].querySelector(".range-value");
      html[0].querySelector("input").addEventListener("change", function(event) {
        target.innerText = event.currentTarget.value;
      });
    }
  }).render(true);

  async function heal(html, event) {
    const number = Number(html[0].querySelector("input").value);
    await new Roll(`${number}`).toMessage({speaker, flavor: item.name});
    return item.update({"system.uses.value": value - number});
  }

  async function cure(html, event) {
    await ChatMessage.create({speaker, content: `${actor.name} cures a disease or poison.`});
    return item.update({"system.uses.value": value - 5});
  }
}

async function BURNING_WEAPON(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.BAB, DEPEND.VAE)) return item.use();

  const effect = actor.effects.find(e => e.flags?.core?.statusId === item.name.slugify({strict: true}));
  if (effect) return effect.delete();

  const weapons = actor.itemTypes.weapon.filter(i => i.system.equipped);
  if (!weapons.length) {
    ui.notifications.warn("You have no equipped weapons.");
    return;
  }

  const resourceItem = actor.items.get(item.system.consume.target);
  const resource = resourceItem.system.uses.value;
  if (!resource) {
    ui.notifications.warn("You have no uses left of Channel Divinity.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  // exactly one weapon
  if (weapons.length === 1) return createEffect(weapons[0].id);

  // multiple weapons
  const weaponSelect = weapons.reduce((acc, {id, name}) => {
    return acc + `<option value="${id}">${name}</option>`;
  }, "");
  const content = _basicFormContent({label: "Weapon:", type: "select", options: weaponSelect});

  return new Dialog({
    title: item.name,
    content,
    buttons: {
      go: {
        icon: "<i class='fa-solid fa-fire'></i>",
        label: "Flame On!",
        callback: (html) => {
          const id = html[0].querySelector("select").value;
          return createEffect(id);
        }
      }
    }
  }).render(true);

  async function createEffect(id) {
    const lightData = {
      bright: 20,
      dim: 40,
      color: "#e05d06",
      "animation.type": "torch",
      "animation.speed": 1
    };
    const babonusData = babonus.createBabonus({
      type: "damage",
      name: item.name,
      description: item.system.description.value,
      bonuses: {bonus: `@abilities.cha.mod[fire]`},
      filters: {customScripts: `return item.id === "${id}";`}
    }).toObject();
    const flags = {
      [`babonus.bonuses.${babonusData.id}`]: babonusData,
      "flags.core.statusId": item.name.slugify({strict: true})
    };
    const effectData = _constructLightEffectData({item, lightData, flags});
    return actor.createEmbeddedDocuments("ActiveEffect", effectData);
  }
}

async function WARMING_RESPITE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.WG)) return item.use();

  const targets = game.user.targets;
  if (!targets.size) {
    ui.notifications.warn("You need at least one target to use this feature!");
    return null;
  }

  const use = await item.use();
  if (!use) return;

  const levels = actor.getRollData().classes.paladin.levels;
  const updates = {actor: {"system.attributes.hp.temp": levels}}
  const options = {
    permanent: true,
    description: `${actor.name} is granting you ${levels} temporary hit points.`
  }

  ui.notifications.info("Granting temporary hit points to your targets!");
  for (const target of targets) {
    if (target.actor.system.attributes.hp.temp < levels) {
      warpgate.mutate(target.document, updates, {}, options);
    }
  }
}

async function RELENTLESS_ENDURANCE(item, speaker, actor, token, character, event, args) {
  if (actor.system.attributes.hp.value > 0) {
    ui.notifications.warn("You have not been reduced to zero hit points.");
    return;
  }
  const use = await item.use();
  if (!use) return;
  return actor.update({"system.attributes.hp.value": 1});
}

async function ARCANE_RECOVERY(item, speaker, actor, token, character, event, args) {
  const maxSum = Math.ceil(actor.getRollData().classes.wizard.levels / 2);

  // bail out if you can't use this item again.
  const available = item.system.uses.value > 0;
  if (!available) {
    ui.notifications.warn("DND5E.AbilityUseUnavailableHint", {localize: true});
    return;
  }

  // creating the form.
  const levels = Object.entries(actor.system.spells).reduce((acc, [key, values]) => {
    const level = key === "pact" ? values.level : Number(key.at(-1));
    if (!level.between(1, 6) || values.max < 1) return acc;
    const slots = Array.fromRange(values.max).reduce((ac, n) => {
      const cd = (n < values.value) ? "checked disabled" : "";
      return ac + `<input type="checkbox" data-key="${key}" data-level="${level}" ${cd}>`
    }, "");
    const label = key === "pact" ? "Pact Slots" : game.i18n.localize("DND5E.SpellLevel" + level);
    return acc + `<div class="form-group"><label>${label}</label><div class="form-fields">${slots}</div></div>`;
  }, "");

  if (!levels.length) {
    ui.notifications.warn("You are not missing any valid spell slots.");
    return;
  }

  const use = await item.use();
  if (!use) return;

  let spent = 0;

  const dialog = new Dialog({
    title: item.name,
    content: `
    <p name="header">Recovering spell slots: <strong>${spent}</strong> / ${maxSum}.</p>
    <form>${levels}</form>`,
    buttons: {
      recover: {
        icon: '<i class="fa-solid fa-hand-sparkles"></i>',
        label: "Recover",
        callback: recover
      }
    },
    render: listeners
  }).render(true);

  async function listeners(html) {
    const head = html[0].querySelector("[name=header]");
    html[0].querySelectorAll("[type=checkbox]").forEach(n => n.addEventListener("change", function(event) {
      const {checked, dataset} = event.currentTarget;
      spent = checked ? (spent + Number(dataset.level)) : spent - Number(dataset.level);
      const hint = `Recovering spell slots: <strong>${spent}</strong> / ${maxSum}`;
      head.innerHTML = hint;
    }));
  }

  async function recover(html, event) {
    if (!spent.between(1, maxSum)) {
      ui.notifications.warn("Invalid number of slots to recover.");
      spent = 0;
      return dialog.render(true);
    }

    const inputs = html[0].querySelectorAll("input:not(:disabled):checked");
    const update = actor.toObject().system.spells;
    for (const input of inputs) update[input.dataset.key].value++;
    await actor.update({"system.spells": update});
    return ChatMessage.create({speaker, content: `${actor.name} recovered spell slots using ${item.name}`});
  }
}

async function DWARVEN_FORTITUDE(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;
  return actor.rollHitDie(undefined, {dialog: false});
}

async function EXPERIMENTAL_ELIXIR(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.ET, DEPEND.RG)) return item.use();
  const rollData = actor.getRollData();
  const {files} = await FilePicker.browse("public", "icons/consumables/potions");
  const randomName = [
    "Daily Pick-Me-Up",
    "Rainbow Elixir",
    "The Arepoan Picnic Drink",
    "Arkonade",
    "Something-ade",
    "The Murharbor Special",
    "The Sunny Capital",
    "Green Tree's Mix"
  ];
  const randomFlavor = [
    "This one's grape flavored!",
    "This one's strawberry!",
    "This one's Pina Colada.",
    "Oh hey! This one could be a pretty good Margherita!",
    "This one's blue-raspberry. Not sure what the 'blue' flavor is caused by but it's DEFINITELY blue.",
    "Err... this one came out kind of thick, sorry.",
    "Oh yikes! I'm pretty sure this one can double as a rubbing alcohol.",
    "Ignore the odd smokey flavor to this one; not sure how that happened.",
    "Oooo, this one's glowing!",
    "I added some extra ice to this one.",
    "I found a way to boil it like a tea!",
    "This one kind of tastes like a good night's sleep. Super confused on how that worked out."
  ];
  const elixirTypes = foundry.utils.expandObject({
    alacrity: {
      name: "Alacrity",
      data: {
        changes: [{key: "system.attributes.init.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d8"}],
        duration: {seconds: 60},
        icon: "icons/magic/movement/trail-streak-zigzag-yellow.webp",
        "flags.visual-active-effects.data.intro": "<p>You add a <strong>1d8</strong> bonus to initiative rolls for 1 minute.</p>"
      }
    },
    boldness: {
      name: "Boldness",
      data: {
        changes: ["mwak.attack", "rwak.attack", "msak.attack", "rsak.attack", "abilities.save"].map(prop => {
          return {key: `system.bonuses.${prop}`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4"};
        }),
        duration: {seconds: 60},
        icon: "icons/magic/movement/trail-streak-pink.webp",
        "flags.visual-active-effects.data.intro": "<p>You add a <strong>1d4</strong> bonus to attack rolls and saving throws for 1 minute.</p>"
      }
    },
    flight: {
      name: "Flight",
      data: {
        changes: [{key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 10}],
        duration: {seconds: 600},
        icon: "icons/magic/movement/trail-streak-impact-blue.webp",
        "flags.visual-active-effects.data.intro": "<p>You have a flying speed of 10 feet for 10 minutes.</p>"
      }
    },
    healing: {
      name: "Healing",
      data: {
        "flags.visual-active-effects.data.intro": `<p>You regain <strong>2d4 + ${rollData.abilities.int.mod}</strong> hit points.</p>`
      }
    },
    resilience: {
      name: "Resilience",
      data: {
        changes: [{key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1"}],
        duration: {seconds: 600},
        icon: "icons/magic/defensive/shield-barrier-blue.webp",
        "flags.visual-active-effects.data.intro": "<p>You add a <strong>+1</strong> bonus to AC for 10 minutes.</p>"
      }
    },
    swiftness: {
      name: "Swiftness",
      data: {
        changes: [{key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 10}],
        duration: {seconds: 3600},
        icon: "icons/magic/movement/pinwheel-turning-blue.webp",
        "flags.visual-active-effects.data.intro": "<p>Your walking speed increases by 10 feet for 1 hour.</p>"
      }
    },
    transformation: {
      name: "Transformation",
      data: {
        changes: [],
        duration: {seconds: 600},
        icon: "icons/magic/movement/abstract-ribbons-red-orange.webp",
        "flags.visual-active-effects.data.intro": "<p>The drinker's body is transformed as if by the @UUID[Compendium.zhell-catalogs.spells.DRN4UHvQDhzHZ1vD] spell. The drinker determines the transformation caused by the spell, the effects of which last for 10 minutes.</p>"
      }
    }
  });
  const universal = {
    transfer: false,
    flags: {
      [DEPEND.ET]: {transferBlock: {button: false, chat: false, displayCard: false}},
      [MODULE]: {experimentalElixir: true}
    }
  }

  // MAIN DIALOG
  new Dialog({
    title: "Experimental Elixir",
    buttons: {
      experiment: {
        label: "<p>Experiment <br> <em>(once per long rest)</em></p>",
        icon: "<i class='fa-solid fa-flask'></i>",
        callback: async () => {
          const keys = await experimentation();
          if (!keys) return;
          const itemData = keys.reduce((acc, key) => {
            const data = elixirBuilder([key]);
            acc = acc.concat(data);
            return acc;
          }, []);
          await actor.createEmbeddedDocuments("Item", itemData);
          return ChatMessage.create({speaker, content: `${actor.name} created ${keys.length} random single-effect elixirs.`});
        }
      },
      build: {
        label: "<p>Build-an-Elixir <br> <em>(expend a spell slot)</em></p>",
        icon: "<i class='fa-solid fa-cubes'></i>",
        callback: () => {
          buildDialog.render(true);
        }
      }
    }
  }, {classes: ["dialog", "elixir"], height: "auto"}).render(true);

  // BUILD DIALOG
  const content = await TextEditor.enrichHTML(Object.entries(elixirTypes).reduce((acc, [key, {name, data}]) => {
    const text = foundry.utils.getProperty(data, "flags.visual-active-effects.data.intro");
    return acc + `
    <div class="form-group">
      <label for="elixir-${key}"> <strong>${name}.</strong> ${text.slice(3, text.length - 4)}</label>
      <div class="form-fields">
        <input type="checkbox" data-key="${key}" id="elixir-${key}">
      </div>
    </div>`;
  }, "<form>") + "</form>", {async: true});

  const buildDialog = new Dialog({
    title: "Experimental Elixir",
    content,
    buttons: {
      create: {
        icon: "<i class='fa-solid fa-check'></i>",
        label: "Create Elixir",
        callback: async (html) => {
          const keys = [...html[0].querySelectorAll("input:checked")].map(i => i.dataset.key);

          // must pick at least one.
          if (!keys.length) {
            ui.notifications.error("You must select at least one effect.");
            return buildDialog.render();
          }

          // must have valid spell slot.
          const path = `system.spells.spell${keys.length}.value`;
          const value = foundry.utils.getProperty(actor, path);
          if (!value) {
            ui.notifications.warn("You have no spell slots of the appropriate level.");
            return buildDialog.render();
          }

          // create the item on the alchemist.
          const itemData = elixirBuilder(keys);
          await actor.createEmbeddedDocuments("Item", itemData);

          // remove a spell slot.
          await actor.update({[path]: value - 1});
          return ChatMessage.create({speaker, content: `${actor.name} expended a ${keys.length.ordinalString()} level spell slot and created an elixir.`});
        }
      }
    }
  }, {classes: ["dialog", "elixir-builder"]});

  // function to take keys and create experimental elixirs.
  function elixirBuilder(keys = []) {

    // create description.
    let description = keys.reduce((acc, e) => {
      const {name, data} = elixirTypes[e];
      const intro = foundry.utils.getProperty(data, "flags.visual-active-effects.data.intro");
      const text = intro.replaceAll("<p>", "").replaceAll("</p>", "");
      return acc + `<p><strong><em>${name}.</em></strong> ${text}</p>`;
    }, "");
    if (rollData.classes.artificer.levels >= 9) {
      description += `<p><strong><em>Restorative Reagents.</em></strong> The drinker gains <strong>2d6 + ${rollData.abilities.int.mod}</strong> temporary hit points.</p>`;
    }
    // construct damage.parts and rollgroups flags.
    const {parts, flags} = createDamageParts(keys);

    // pick random stuff.
    const name = randomName[Math.floor(Math.random() * randomName.length)];
    const img = files[Math.floor(Math.random() * files.length)];
    const flavor = randomFlavor[Math.floor(Math.random() * randomFlavor.length)];

    // create effect data.
    const effects = createEffects(keys);

    // create item data.
    return [{
      name: `Experimental Elixir: ${name}`,
      type: "consumable",
      img,
      system: {
        description: {value: `<p><em>${flavor}</em></p> <hr> ${description}`},
        weight: 0.5,
        rarity: "common",
        activation: {type: "action", cost: 1},
        uses: {value: 1, max: 1, per: "charges", autoDestroy: true},
        consumableType: "elixir",
        damage: {parts},
        actionType: parts.length > 0 ? "heal" : ""
      },
      effects,
      flags
    }];
  }

  // create damage parts and rollgroup flags.
  function createDamageParts(keys = []) {
    const parts = [];
    if (keys.includes("healing")) parts.push([`2d4 + ${rollData.abilities.int.mod}`, "healing"]);
    if (rollData.classes.artificer.levels >= 9) parts.push([`2d6 + ${rollData.abilities.int.mod}`, "temphp"]);
    const flags = (parts.length > 1) ? foundry.utils.expandObject({
      "rollgroups.config.groups": [
        {parts: [0], label: "Healing"},
        {parts: [1], label: "Temporary HP"}
      ]
    }) : {};
    return {parts, flags};
  }

  // function to turn key into effect data.
  function createEffects(keys = []) {
    return keys.reduce((acc, key) => {
      // filter out elixirTypes datas without a changes array.
      if (!elixirTypes[key].data.changes) return acc;
      const elixData = foundry.utils.mergeObject(elixirTypes[key].data, universal);
      elixData.label = `Experimental Elixir: ${elixirTypes[key].name}`;
      acc.push(elixData);
      return acc;
    }, []);
  }

  // function to roll random dice and get elixir keys.
  async function experimentation() {
    const use = await item.use();
    if (!use) return;

    // roll a number of d8s, and for each 8 roll once more (rerolling 8s).
    const elixRoll = new Roll("(@scale.alchemist.elixirs)d8x8rr8", rollData);
    const {rolls} = await elixRoll.toMessage({speaker, flavor: `${actor.name} rolls random elixirs`});

    // for each active die, map to an elixir type.
    const elixirKeys = Object.keys(elixirTypes);
    return rolls[0].dice[0].results.filter(i => i.active).map(i => (elixirKeys[i.result - 1]));
  }
}

async function TENTACLE_OF_THE_DEEPS(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.WG)) return item.use();
  const isActive = actor.effects.find(e => {
    return e.flags.core?.statusId === item.name.slugify({strict: true});
  });
  if (isActive) return item.displayCard();

  const use = await item.use();
  if (!use) return;
  const effectData = _constructGenericEffectData({item});
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);

  const updates = {token: {name: `${actor.name.split(" ")[0]}'s Fathomless Tentacle`}}
  const options = {crosshairs: {drawIcon: false, icon: "icons/svg/dice-target.svg", interval: -1}};

  // then spawn the actor:
  await actor.sheet?.minimize();
  const [spawn] = await _spawnHelper("Fathomless Tentacle", updates, {}, options);
  await actor.sheet?.maximize();
  if (!spawn) return effect.delete();
  return _addTokenDismissalToEffect(effect, spawn);
}

async function STARRY_FORM(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const has = actor.effects.find(e => e.flags?.core?.statusId === item.name.slugify({strict: true}));
  if (has) return has.delete();

  const use = await item.use();
  if (!use) return;

  const [effectData] = _constructLightEffectData({
    item,
    lightData: {dim: 20, bright: 10},
    intro: "",
    flags: {}
  });

  const title = item.name;
  const content = '<div class="dynamic-tooltip"></div>';
  const buttons = {
    archer: {
      icon: '<i class="fa-solid fa-burst"></i>',
      label: "Archer",
      callback: () => "archer"
    },
    chalice: {
      icon: '<i class="fa-solid fa-trophy"></i>',
      label: "Chalice",
      callback: () => "chalice"
    },
    dragon: {
      icon: '<i class="fa-solid fa-dragon"></i>',
      label: "Dragon",
      callback: () => "dragon"
    }
  }

  const intro = {
    archer: "<p>When you activate this form, and as a bonus action on your subsequent turns while it lasts, you can make a ranged spell attack, hurling a luminous arrow that targets one creature within 60 feet of you. On a hit, the attack deals radiant damage equal to 1d8 + your Wisdom modifier.</p>",
    chalice: "<p>Whenever you cast a spell using a spell slot that restores hit points to a creature, you or another creature within 30 feet of you can regain hit points equal to 1d8 + your Wisdom modifier.</p>",
    dragon: "<p>When you make an Intelligence or a Wisdom check or a Constitution saving throw to maintain concentration on a spell, you can treat a roll of 9 or lower on the d20 as a 10.</p>"
  }

  function render(html) {
    const field = html[0].querySelector(".dynamic-tooltip");
    html[2].querySelectorAll("[data-button]").forEach(btn => {
      btn.addEventListener("mouseover", function() {
        const type = btn.dataset.button;
        field.innerHTML = intro[type];
      });
    });
  }

  // @scale.stars.starry-form-die

  const form = await columnDialog({title, content, buttons, render});
  if (form === "archer") {
    const itemData = {
      name: "Starry Form (Archer)",
      type: "feat",
      img: "icons/weapons/bows/shortbow-recurve-yellow.webp",
      system: {
        description: {value: intro[form]},
        activation: {type: "bonus", cost: 1},
        duration: {units: "inst"},
        target: {value: 1, type: "creature"},
        range: {value: 60, units: "ft"},
        ability: "wis",
        actionType: "rsak",
        attackBonus: "",
        damage: {parts: [["@scale.stars.starry-form-die + @mod", "radiant"]]}
      }
    }
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
    foundry.utils.setProperty(effectData, `flags.${MODULE}`, {itemData, types: ["use", "attack", "damage"]});
  } else if (form === "chalice") {
    const itemData = {
      name: "Starry Form (Chalice)",
      type: "feat",
      img: "icons/magic/holy/chalice-glowing-gold-water.webp",
      system: {
        target: {value: 1, type: "creature"},
        range: {value: 30, units: "ft"},
        ability: "wis",
        actionType: "heal",
        damage: {parts: [["@scale.stars.starry-form-die + @mod", "healing"]]}
      }
    }
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
    foundry.utils.setProperty(effectData, `flags.${MODULE}`, {itemData, types: ["healing"]});
  } else if (form === "dragon") {
    foundry.utils.setProperty(effectData, "flags.visual-active-effects.data.intro", intro[form]);
    effectData.changes = [{key: "flags.dnd5e.concentrationReliable", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: true}];
  } else return;
  await actor.effects.find(e => e.flags.core?.statusId === item.name.slugify({strict: true}))?.delete();
  const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

  const file = "jb2a.markers.circle_of_stars.blue";
  return new Sequence().effect().file(file).attachTo(token).scale(2).fadeIn(500).fadeOut(500).tieToDocuments(effect).persist().play();
}

async function FONT_OF_MAGIC(item, speaker, actor, token, character, event, args) {
  const conversionMap = {1: 2, 2: 3, 3: 5, 4: 6, 5: 7};
  const style = `
  <style>
  .font-of-magic .dialog-buttons {
    flex-direction: column;
    gap: 5px;
  }
  </style>`;
  const spellPoints = item.system.uses;
  const spellSlots = actor.toObject().system.spells;

  // array of spell levels for converting points to slots.
  const validLevelsWithSpentSpellSlots = Object.entries(spellSlots).filter(([key, entry]) => {
    const k = key === "pact" ? entry.level : key.at(-1);
    const cost = conversionMap[k];
    if (!cost || (cost > spellPoints.value)) return false;
    return (entry.max > 0 && entry.value < entry.max);
  });
  // array of spell levels for converting slots to points.
  const spellLevelsWithAvailableSlots = Object.entries(spellSlots).filter(([key, entry]) => {
    return (entry.value > 0) && (entry.max > 0);
  });

  const isMissingPoints = spellPoints.value < spellPoints.max;
  const isMissingSlots = validLevelsWithSpentSpellSlots.length > 0;

  // has unspent spell slots.
  const hasAvailableSpellSlots = spellLevelsWithAvailableSlots.length > 0;
  // has sp equal to or higher than the minimum required.
  const hasAvailableSorceryPoints = spellPoints.value >= Math.min(...Object.values(conversionMap));

  const canConvertSlotToPoints = hasAvailableSpellSlots && isMissingPoints;
  const canConvertPointsToSlot = hasAvailableSorceryPoints && isMissingSlots;
  if (!canConvertPointsToSlot && !canConvertSlotToPoints) {
    ui.notifications.warn("You have no options available.");
    return null;
  }

  // set up available buttons.
  const buttons = {};
  if (canConvertSlotToPoints) buttons["slotToPoint"] = {
    icon: "<i class='fa-solid fa-arrow-left'></i> <br>",
    label: "Convert a spell slot to sorcery points",
    callback: slotToPoints
  }
  if (canConvertPointsToSlot) buttons["pointToSlot"] = {
    icon: "<i class='fa-solid fa-arrow-right'></i> <br>",
    label: "Convert sorcery points to a spell slot",
    callback: pointsToSlot
  }
  new Dialog({title: item.name, buttons}).render(true);

  // Convert spell slot to sorcery points.
  async function slotToPoints() {
    // build buttons for each level where value, max > 0.
    const slotToPointsButtons = Object.fromEntries(spellLevelsWithAvailableSlots.map(([key, vals]) => {
      const k = key === "pact" ? "Pact Slot" : CONFIG.DND5E.spellLevels[key.at(-1)];
      return [key, {
        callback: () => key,
        label: `
        <div class="flexrow">
          <span>${k} (${vals.value}/${vals.max})</span>
          <span>(+${vals.level ?? key.at(-1)} points)</span>
        </div>`
      }];
    }));

    const retKey = await Dialog.wait({
      title: "Slot to Sorcery Points",
      buttons: slotToPointsButtons,
      close: () => null,
      content: style + `
      <p>Pick a spell slot level to convert one spell slot to sorcery points (<strong>${spellPoints.value}/${spellPoints.max}</strong>).
      You regain a number of sorcery points equal to the level of the spell slot.</p>`
    }, {
      classes: ["dialog", "font-of-magic"]
    });
    if (!retKey) return null;

    await actor.update({[`system.spells.${retKey}.value`]: spellSlots[retKey].value - 1});
    const level = retKey === "pact" ? spellSlots["pact"].level : retKey.at(-1);
    const newPointsValue = Math.clamped(spellPoints.value + Number(level), 0, spellPoints.max);
    await item.update({"system.uses.value": newPointsValue});
    return ChatMessage.create({
      speaker,
      content: `${actor.name} regained ${newPointsValue - spellPoints.value} sorcery points.`
    });
  }

  // Convert sorcery points to spell slot.
  async function pointsToSlot() {
    const pointsToSlotButtons = Object.fromEntries(validLevelsWithSpentSpellSlots.map(([key, vals]) => {
      const k = key === "pact" ? "Pact Slot" : CONFIG.DND5E.spellLevels[key.at(-1)];
      const cost = conversionMap[vals.level ?? key.at(-1)];
      return [key, {
        callback: () => key,
        label: `
        <div class="flexrow">
          <span>${k} (${vals.value}/${vals.max})</span>
          <span>(&minus;${cost} points)</span>
        </div>`
      }];
    }));

    const retKey = await Dialog.wait({
      title: "Sorcery Points to Slot",
      buttons: pointsToSlotButtons,
      close: () => null,
      content: style + `<p>Pick a spell slot level to regain from sorcery points (<strong>${spellPoints.value}/${spellPoints.max}</strong>).</p>`
    }, {
      classes: ["dialog", "font-of-magic"]
    });
    if (!retKey) return null;

    await actor.update({[`system.spells.${retKey}.value`]: spellSlots[retKey].value + 1});
    const level = retKey === "pact" ? spellSlots["pact"].level : retKey.at(-1);
    await item.update({"system.uses.value": Math.clamped(spellPoints.value - conversionMap[level], 0, spellPoints.max)});
    const str = retKey === "pact" ? "Pact Slot" : `${CONFIG.DND5E.spellLevels[level]} spell slot`;
    return ChatMessage.create({
      speaker,
      content: `${actor.name} regained a ${str}.`
    });
  }
}
