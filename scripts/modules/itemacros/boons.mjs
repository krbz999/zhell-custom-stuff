import { DEPEND, MODULE } from "../../const.mjs";
import { imageAnchorDialog } from "../customDialogs.mjs";
import {
  _basicFormContent,
  _getDependencies
} from "../itemMacros.mjs";

export const ITEMACRO_BOONS = {
  FIND_FRIEND,
  GOODHUNTER,
  PAST_KNOWLEDGE,
  SHOW_OF_FORCE,
  SIZE_UP,
  SONG_OF_WITHERTIDE,
  SPREAD_THE_KNOWLEDGE,
};

async function GOODHUNTER(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.CN)) return item.use();

  const isConc = CN.isActorConcentratingOnItem(actor, item);

  // case 1: not even conc on True Strike.
  if (!isConc) return item.use();

  // case 2: conc, prompt to use reaction or extend.
  const currentDC = isConc.flags.world?.goodhunter ?? 10;
  new Dialog({
    title: "Goodhunter's True Strike",
    buttons: {
      extend: {
        icon: "<i class='fa-solid fa-clock'></i>",
        label: `Attempt to extend <br> Current DC: ${currentDC}`,
        callback: extend
      },
      react: {
        icon: "<i class='fa-solid fa-heart-broken'></i>",
        label: "Take damage",
        callback: react
      }
    }
  }).render(true);

  async function extend(_, event) {
    const test = await actor.rollAbilityTest("con", { event, targetValue: currentDC });
    if (!test) return;
    if (test.total < currentDC) return isConc.delete();
    else {
      await ChatMessage.create({ speaker, content: `${actor.name} extends ${item.name} by another round.` });
      return isConc.update({
        "duration.rounds": isConc.duration.rounds + 1,
        "flags.world.goodhunter": currentDC + 1
      });
    }
  }

  async function react() {
    new Dialog({
      title: "Goodhunter: Take the damage",
      content: `
      <form>
        <button id="goodhunter-hit-die"><i class="fa-solid fa-die-d10"></i> Roll Hit Die</button>
        <div class="form-group">
          <label>Damage to take:</label>
          <div class="form-fields">
            <input type="number" id="goodhunter-damage-taken" value="50" autofocus>
          </div>
        </div>
      </form>`,
      buttons: {
        apply: {
          icon: "<i class='fa-solid fa-heart'></i>",
          label: "Apply Damage",
          callback: async (html) => {
            const value = html[0].querySelector("#goodhunter-damage-taken").valueAsNumber;
            await isConc.delete();
            await actor.applyDamage(value);
            return ChatMessage.create({ speaker, content: `${actor.name} took the ${value} damage.` });
          }
        }
      },
      render: (html) => {
        const hdBtn = html[0].querySelector("#goodhunter-hit-die");
        hdBtn.addEventListener("click", async () => {
          await actor.rollHitDie(undefined, { dialog: false });
          hdBtn.disabled = true;
        });
      }
    }).render(true);
  }
}

async function SPREAD_THE_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  // Create spell scrolls from spells of level 1-5 with a cast time of 1 action.
  // The spells should have a combined spell level no higher than n = half character level rounded up.

  // CONSTANTS
  const maxCombinedSpellLevel = Math.min(10, Math.ceil(actor.system.details.level / 2));
  const options = actor.itemTypes.spell.filter(s => {
    return Number(s.system.level).between(1, 5) && s.system.activation?.type === "action";
  }).sort((a, b) => {
    return b.name.localeCompare(a.name);
  }).reduce((acc, spell) => {
    return acc + `<option value="${spell.id}">[${spell.system.level}] ${spell.name}</option>`;
  }, "<option value=''>&mdash; Choose a spell &mdash;</option>");
  const template = _basicFormContent({ label: "Spell:", type: "select", options });

  const dialog = new Dialog({
    content: `
    <p style="text-align: center;" data-total="0" id="levelTrack">Total level: <strong>0 / ${maxCombinedSpellLevel}</strong></p>
    <button style="margin: 0;" name="add-new-row"><i class="fa-solid fa-plus"></i> Pick one more</button>
    <hr>
    <div name="murk-scroll-boon">${template}</div>`,
    title: "Murk Scrolls",
    buttons: {
      create: {
        icon: "<i class='fa-solid fa-scroll'></i>",
        label: "Create Scrolls",
        callback: async (html) => {
          const tracker = html[0].querySelector("#levelTrack");
          const total = Number(tracker.dataset.total);
          if (!total || total > maxCombinedSpellLevel) {
            ui.notifications.error("Invalid selection.");
            return dialog.render();
          }

          const scrollData = [];
          const path = "flags.concentrationnotifier.data.requiresConcentration";

          for (const { value } of html[0].querySelectorAll("select")) {
            if (!value) continue;
            const spell = actor.items.get(value);
            if (!spell) continue;
            const scroll = await Item.implementation.createScrollFromSpell(spell);
            const itemData = game.items.fromCompendium(scroll);
            foundry.utils.mergeObject(itemData.flags, spell.flags);
            if (spell.system.components.concentration) foundry.utils.setProperty(itemData, path, true);
            itemData.name = itemData.name.replace("Spell Scroll:", "Murk Scroll:");
            scrollData.push(itemData);
          }

          const use = await item.use({}, { configureDialog: false });
          if (!use) return;
          const add = await actor.createEmbeddedDocuments("Item", scrollData);
          return ChatMessage.create({ speaker, content: `Created ${add.length} scrolls of Murk.` });
        }
      }
    },
    render: async (html) => {
      const tracker = html[0].querySelector("#levelTrack");
      const form = html[0].querySelector("[name='murk-scroll-boon']");

      html[0].addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (button?.name !== "add-new-row") return;
        const div = document.createElement("DIV");
        div.innerHTML = template;
        form.appendChild(div.children[0]);
        dialog.setPosition();
      });

      form.addEventListener("change", function() {
        const selects = html[0].querySelectorAll("select");
        const ids = Array.from(selects).map(i => i.value);
        const spells = ids.map(id => actor.items.get(id));
        const total = spells.reduce((acc, s) => {
          const level = s?.system.level ?? 0;
          return acc + Number(level);
        }, 0);
        tracker.innerHTML = `Total level: <strong>${total} / ${maxCombinedSpellLevel}</strong>`;
        tracker.setAttribute("data-total", total);
      });
    }
  }).render(true, { height: "auto" });
}

async function SHOW_OF_FORCE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.SEQ, DEPEND.JB2A, DEPEND.EM, DEPEND.VAE)) return item.use();

  const use = await item.use();
  if (!use) return;

  const onCreate = async function() {
    const easing = function(pt) { return 1 - cos((pt * Math.PI) / 2); }
    await Sequencer.Preloader.preload([
      "jb2a.token_border.circle.static.blue.004",
      "jb2a.lightning_strike.blue.5"
    ]);

    // lightning strikes
    await new Sequence()
      .effect().file("jb2a.lightning_strike.blue.5").atLocation(token)
      .effect().file("jb2a.lightning_strike.blue.5").atLocation(token).mirrorX()
      .wait(1000)
      .play();

    await token.document.update({ width: 2, height: 2 }, { animation: { duration: 500, easing } });

    return new Sequence()
      .wait(500)
      .effect().file("jb2a.token_border.circle.static.blue.004")
      .fadeIn(500).attachTo(token).name("Show of Force").persist()
      .play();
  }

  const onDelete = async function() {
    const easing = function(pt) { return 1 - cos((pt * Math.PI) / 2); }
    await Sequencer.EffectManager.endEffects({ name: "Show of Force" });
    await token.document.update({ height: 1, width: 1 }, { animation: { duration: 500, easing } });
  }

  const onDisable = async function() {
    await effect.callMacro("onDelete");
    await effect.delete();
  }

  // when create effect, trigger sequence and mutation. When delete effect, remove mutation and end sequences.
  const effectData = [{
    icon: item.img,
    label: item.name,
    duration: { seconds: 60 },
    origin: item.uuid,
    flags: {
      "core.statusId": item.name.slugify({ strict: true }),
      "visual-active-effects.data": {
        intro: "<p>Your size is increased to Large, your movement speed increases by 10 feet, you deal an additional <strong>1d4</strong> damage with melee weapons, and your melee weapon attacks are critical hits on a roll of 19 or 20.</p>"
      },
      effectmacro: {
        onCreate: { script: `(${onCreate.toString()})()` },
        onDelete: { script: `(${onDelete.toString()})()` },
        onDisable: { script: `(${onDisable.toString()})()` }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 10 },
      { key: "system.bonuses.mwak.damage", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" },
      { key: "flags.dnd5e.weaponCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 19 },
      { key: "system.traits.size", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "lg" },
    ]
  }];
  return actor.createEmbeddedDocuments("ActiveEffect", effectData);
}

async function SIZE_UP(item, speaker, actor, token, character, event, args) {
  const use = await item.use();
  if (!use) return;

  const target = game.user.targets.first();
  if (!target) {
    ui.notifications.warn("If you had a target, you'd know immediately.");
    return;
  }
  const mine = actor.system.abilities;
  const theirs = target.actor.system.abilities;

  let content = "";

  for (const abi of ["str", "con"]) {
    const name = CONFIG.DND5E.abilities[abi];
    if (mine[abi].value === theirs[abi].value) content += `<p>Your ${name} scores are equal.</p>`;
    else if (mine[abi].value > theirs[abi].value) content += `<p>Your ${name} score is highest.</p>`;
    else content += `<p>Their ${name} score is highest.</p>`;
  }
  const whisper = ChatMessage.getWhisperRecipients("GM");
  return ChatMessage.create({ content, speaker, whisper });
}

async function SONG_OF_WITHERTIDE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.EM, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();

  const active = CN.isActorConcentratingOnItem(actor, item);
  const file1 = "jb2a.markers.music.blueyellow";
  const file2 = "jb2a.fire_ring.500px.blue";

  if (!active) return startEffect();

  new Dialog({
    title: "Song of Withertide",
    content: "<p>You can erupt the storm, or simply end concentration.</p>",
    buttons: {
      erupt: {
        icon: "<i class='fa-solid fa-icicles'></i>",
        label: "Erupt",
        callback: async () => endEffect(true)
      },
      dismiss: {
        icon: "<i class='fa-solid fa-times'></i>",
        label: "Dismiss",
        callback: async () => endEffect(false)
      }
    }
  }).render(true);

  async function startEffect() {
    const use = await item.use();
    if (!use) return;
    const effect = await CN.waitForConcentrationStart(actor, { item, max_wait: 1000 });
    if (!effect) return;
    await Sequencer.Preloader.preload([file1, file2]);

    return new Sequence()
      .effect() // music markers
      .file(file1).name("Song of Withertide").persist().attachTo(token)
      .fadeIn(1000).fadeOut(1000).elevation(token.document.elevation - 1)
      .tieToDocuments(effect)
      .effect() // blue ring
      .file(file2).name("Song of Withertide").persist().attachTo(token)
      .fadeIn(1000).fadeOut(1000).elevation(token.document.elevation + 1)
      .size(canvas.grid.size * 13).scaleIn(0, 3000).rotateIn(360, 5000)
      .tieToDocuments(effect)
      .play();
  }

  async function endEffect(rollDamage = false) {
    if (rollDamage) await CN.redisplayCard(actor);
    return active.delete();
  }
}

async function FIND_FRIEND(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.SEQ, DEPEND.WG, DEPEND.JB2A)) return item.use();

  // jb2a assets.
  const assets = [
    "jb2a.portals.vertical.vortex.green", // 1
    "jb2a.explosion.green.1", // 2
    "jb2a.explosion.greenorange.1", // 3
    "jb2a.explosion.tealyellow.1" // 4
  ];

  const prefix = "assets/images/players/arkorow/";
  const data = {
    top: [
      "dog",
      "octopus",
      "raccoon"
    ].map(n => ({ name: n, src: `${prefix}${n}.webp` })),
    bottom: [
      "crow",
      "frog",
      "lizard",
      "rat",
      "sandpiper",
      "seagull"
    ].map(n => ({ name: n, src: `${prefix}${n}.webp` }))
  }

  // get whether the actor has a mutation.
  const hasMutation = await warpgate.mutationStack(token.document).getName(item.name);
  if (hasMutation) return ui.notifications.info("You are already transformed.");

  await Promise.all([...data.top, ...data.bottom].map(({ src }) => loadTexture(src)));
  const use = await item.use();
  if (!use) return;
  return imageAnchorDialog({ title: item.name, ...data, label: "Show us the meaning of haste!", callback: _onMutate });

  function _generateUpdateObjects(nameSteed, nameShape) {
    // movement speeds.
    const shapeMovement = {
      crow: { walk: 10, fly: 50, swim: 0, climb: 0 },
      frog: { walk: 20, fly: 0, swim: 20, climb: 0 },
      lizard: { walk: 20, fly: 0, swim: 0, climb: 20 },
      rat: { walk: 20, fly: 0, swim: 0, climb: 0 },
      sandpiper: { walk: 40, fly: 30, swim: 10, climb: 0 },
      seagull: { walk: 10, fly: 30, swim: 20, climb: 0 }
    }
    const steedMovement = {
      dog: { walk: 60, fly: 0, swim: 0, climb: 0 },
      octopus: { walk: 5, fly: 0, swim: 30, climb: 5 },
      raccoon: { walk: 30, fly: 0, swim: 0, climb: 20 }
    }
    // updates to the shape and steed that are constant no matter the choice.
    const constantShape = {
      actor: {
        "system.attributes.hp": { value: 4, max: 4 },
        "system.attributes.ac": { calc: "natural", flat: 12 },
        "system.traits.size": "tiny",
        "system.abilities": { "str.value": 2, "dex.value": 14, "con.value": 10 }
      },
      token: { width: 0.5, height: 0.5 }
    }
    const constantSteed = {
      token: {
        alpha: 0,
        displayName: CONST.TOKEN_DISPLAY_MODES.NONE,
        displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
        flags: { world: { findFriend: actor.id } }
      }
    }
    // the items that the steed should NOT have.
    const embedded = {
      dog: {
        "Amorphous": warpgate.CONST.DELETE,
        "Pack Tactics": warpgate.CONST.DELETE,
        "Ink Cloud": warpgate.CONST.DELETE,
        "Tentacle": warpgate.CONST.DELETE,
        "Scratch": warpgate.CONST.DELETE
      },
      octopus: {
        "Keen Senses": warpgate.CONST.DELETE,
        "Pack Tactics": warpgate.CONST.DELETE,
        "Bite": warpgate.CONST.DELETE,
        "Scratch": warpgate.CONST.DELETE
      },
      raccoon: {
        "Keen Senses": warpgate.CONST.DELETE,
        "Amorphous": warpgate.CONST.DELETE,
        "Bite": warpgate.CONST.DELETE,
        "Ink Cloud": warpgate.CONST.DELETE,
        "Tentacle": warpgate.CONST.DELETE
      }
    }

    const updatesSteed = foundry.utils.mergeObject({
      "token.texture.src": prefix + nameSteed + ".webp",
      "token.name": nameSteed.titleCase(),
      "actor.img": prefix + nameSteed + ".webp",
      "actor.name": nameSteed.titleCase(),
      "actor.system.attributes.movement": steedMovement[nameSteed],
      "embedded.Item": embedded[nameSteed]
    }, constantSteed);

    const updatesShape = foundry.utils.mergeObject({
      "token.texture.src": prefix + nameShape + ".webp",
      "token.texture.scaleX": 1,
      "token.texture.scaleY": 1,
      "actor.system.attributes.movement": shapeMovement[nameShape],
      "actor.img": prefix + nameShape + ".webp"
    }, constantShape);

    return { updatesSteed, updatesShape };
  }

  async function _onMutate(html) {
    // get the steed and shape from the dialog.
    const steedA = html[0].querySelector(".image-selector .top-selection a.active");
    const shapeA = html[0].querySelector(".image-selector .bottom-selection a.active");

    const { name: nameSteed } = steedA.dataset;
    const { name: nameShape } = shapeA.dataset;

    // pick position.
    await actor.sheet?.minimize();
    const { x, y, cancelled } = await warpgate.crosshairs.show({ drawIcon: false });
    if (cancelled) return actor.sheet?.maximize();

    // construct updates.
    const { updatesShape, updatesSteed } = _generateUpdateObjects(nameSteed, nameShape);

    // spawn steed at:
    const location = { x, y: y - canvas.grid.size }
    const [steedId] = await warpgate.spawnAt(location, "Find Friend", updatesSteed);

    // steed effects
    await new Sequence()
      .effect()
      .file(assets[0]).atLocation(location).duration(3000).elevation(-1).snapToGrid().scale(0)
      .animateProperty("sprite", "scale.x", { from: 0, to: 1, delay: 200, duration: 500, ease: "easeInOutCubic" })
      .animateProperty("sprite", "scale.y", { from: 0, to: 1, duration: 700, ease: "easeInOutCubic" })
      .animateProperty("sprite", "scale.x", { from: 1, to: 0, delay: 2500, duration: 500, ease: "easeInElastic" })
      .animateProperty("sprite", "scale.y", { from: 1, to: 0, delay: 2300, duration: 700, ease: "easeInElastic" })
      .effect()
      .delay(3000).file(assets[1]).atLocation(location).snapToGrid().scale({ x: 0.2, y: 0.2 })
      .animation()
      .delay(1000).on(steedId).opacity(1.0).fadeIn(200).moveTowards({ x, y }).duration(200).snapToGrid().waitUntilFinished()
      .effect()
      .attachTo(steedId).file(assets[2]).scale(0.5)
      .effect()
      .file(assets[3]).attachTo(token).size(canvas.grid.size).waitUntilFinished(-2000)
      .play();
    await warpgate.mutate(token.document, updatesShape, {}, { name: item.name });
    await actor.sheet?.maximize();
    return actor.createEmbeddedDocuments("ActiveEffect", [{
      icon: item.img,
      label: item.name,
      origin: actor.uuid,
      duration: { seconds: actor.system.attributes.prof * 60 * 60 },
      "flags.core.statusId": item.name.slugify({ strict: true }),
      "flags.visual-active-effects.data": {
        intro: "<p>You are transformed using Find Friend.</p>",
        content: item.system.description.value
      },
      "flags.effectmacro.onDelete.script": `(${async function() {
        const name = effect.label;
        await warpgate.revert(token.document, name);
        const sequence = new Sequence();
        sequence.effect().file("jb2a.explosion.tealyellow.1").attachTo(token).size(canvas.grid.size * 1.5).waitUntilFinished(-2000);
        const steedToken = canvas.scene.tokens.find(i => i.flags.world?.findFriend === actor.id);
        if (steedToken) sequence.effect().file("jb2a.explosion.greenorange.1").atLocation(steedToken.object.center).scale(0.5);
        await sequence.play();
        return warpgate.dismiss(steedToken?.id);
      }})()`
    }]);
  }
}

async function PAST_KNOWLEDGE(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.VAE, DEPEND.CN, DEPEND.SEQ, DEPEND.JB2A)) return item.use();
  const use = await item.use();
  if (!use) return;

  return Dialog.wait({
    title: item.name,
    content: "<p>Choose the damage type of the energy bursts.</p>",
    buttons: {
      necrotic: {
        label: "Necrotic",
        icon: '<i class="fa-solid fa-skull"></i>',
        callback: () => _createEffectData("necrotic")
      },
      fire: {
        label: "Fire",
        icon: '<i class="fa-solid fa-fire"></i>',
        callback: () => _createEffectData("fire")
      }
    }
  });

  async function _createEffectData(type) {
    const buttons = ["use", "attack", "damage"].reduce((acc, e, i) => {
      const append = !i ? "" : ` (${e.titleCase()} Roll)`
      return acc + `<a data-type="${e}">Energy Burst${append}</a>`;
    }, "<p class='zhell-custom-buttons'>") + "</p>";
    const effectData = [{
      label: item.name,
      icon: item.img,
      origin: item.uuid,
      duration: { seconds: 60 },
      changes: [{ key: "flags.dnd5e.concentrationBonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2" }],
      flags: {
        core: { statusId: item.name.slugify({ strict: true }) },
        "visual-active-effects.data": {
          forceInclude: true,
          intro: `<p>You have assumed the form of Yebraztos the Scrollkeeper.</p>${buttons}`,
          content: item.system.description.value
        },
        [MODULE]: {
          itemData: {
            name: "Energy Burst",
            type: "feat",
            img: "icons/magic/fire/beam-jet-stream-embers.webp",
            system: {
              description: { value: item.system.description.value },
              activation: { type: "bonus", cost: 1 },
              duration: { units: "inst" },
              target: { value: 1, type: "creature" },
              range: { value: 60, units: "ft" },
              ability: "wis",
              actionType: "rsak",
              damage: { parts: [["2d8 + @mod", type]] }
            }
          }
        }
      }
    }];
    const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", effectData);
    const color = { necrotic: "purple", fire: "orange" }[type];
    const file = `jb2a.token_border.circle.spinning.${color}.006`;
    return new Sequence().effect().file(file).attachTo(token).scaleToObject(2).tieToDocuments(effect).persist().fadeIn(500).fadeOut(500).play();
  }
}
