import {DEPEND} from "../../../const.mjs";
import {ImageAnchorPicker} from "../../applications/imageAnchorPicker.mjs";
import {_getDependencies} from "../../itemMacros.mjs";

export const arepo = {SONG_OF_WITHERTIDE, FIND_FRIEND};

/**
 * Either use the item with an attached animation, or when concentrating on the item
 * initiate a dialog to either erupt or dismiss the concentration.
 */
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
    const effect = await CN.waitForConcentrationStart(actor, {item, max_wait: 1000});
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

/**
 * Initiate a dialog to choose a new form for the actor and the form the steed should
 * take. Then summon the steed and change forms. When the associated effect is deleted
 * the actor reverts, and the steed is dismissed.
 */
async function FIND_FRIEND(item, speaker, actor, token, character, event, args) {
  if (!_getDependencies(DEPEND.SEQ, DEPEND.WG, DEPEND.JB2A, DEPEND.EM)) return item.use();

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
    ].map(n => ({name: n, src: `${prefix}${n}.webp`})),
    bottom: [
      "crow",
      "frog",
      "lizard",
      "rat",
      "sandpiper",
      "seagull"
    ].map(n => ({name: n, src: `${prefix}${n}.webp`}))
  }

  // get whether the actor has a mutation.
  const hasMutation = await warpgate.mutationStack(token.document).getName(item.name);
  if (hasMutation) return ui.notifications.info("You are already transformed.");

  await Promise.all([...data.top, ...data.bottom].map(({src}) => loadTexture(src)));
  const use = await item.use();
  if (!use) return;
  return new ImageAnchorPicker({title: item.name, ...data, label: "Show us the meaning of haste!", callback: _onMutate}).render(true);

  function _generateUpdateObjects(nameSteed, nameShape) {
    // movement speeds.
    const shapeMovement = {
      crow: {walk: 10, fly: 50, swim: 0, climb: 0},
      frog: {walk: 20, fly: 0, swim: 20, climb: 0},
      lizard: {walk: 20, fly: 0, swim: 0, climb: 20},
      rat: {walk: 20, fly: 0, swim: 0, climb: 0},
      sandpiper: {walk: 40, fly: 30, swim: 10, climb: 0},
      seagull: {walk: 10, fly: 30, swim: 20, climb: 0}
    };
    const steedMovement = {
      dog: {walk: 60, fly: 0, swim: 0, climb: 0},
      octopus: {walk: 5, fly: 0, swim: 30, climb: 5},
      raccoon: {walk: 30, fly: 0, swim: 0, climb: 20}
    };
    // updates to the shape and steed that are constant no matter the choice.
    const constantShape = {
      actor: {
        "system.attributes.hp": {value: 4, max: 4},
        "system.attributes.ac": {calc: "natural", flat: 12},
        "system.traits.size": "tiny",
        "system.abilities": {"str.value": 2, "dex.value": 14, "con.value": 10}
      },
      token: {width: 0.5, height: 0.5}
    };
    const constantSteed = {
      token: {
        alpha: 0,
        displayName: CONST.TOKEN_DISPLAY_MODES.NONE,
        displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
        flags: {world: {findFriend: actor.id}}
      }
    };
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
    };

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

    return {updatesSteed, updatesShape};
  }

  async function _onMutate(event, {top, middle, bottom}) {
    // get the steed and shape from the dialog.
    const nameSteed = top[0];
    const nameShape = bottom[0];

    // pick position.
    await actor.sheet?.minimize();
    const {x, y, cancelled} = await warpgate.crosshairs.show({drawIcon: false});
    if (cancelled) return actor.sheet?.maximize();

    // construct updates.
    const {updatesShape, updatesSteed} = _generateUpdateObjects(nameSteed, nameShape);

    // spawn steed at:
    const location = {x, y: y - canvas.grid.size}
    const [steedId] = await warpgate.spawnAt(location, "Find Friend", updatesSteed);

    // steed effects
    await new Sequence()
      .effect()
      .file(assets[0]).atLocation(location).duration(3000).elevation(-1).scale(0)
      .animateProperty("sprite", "scale.x", {from: 0, to: 1, delay: 200, duration: 500, ease: "easeInOutCubic"})
      .animateProperty("sprite", "scale.y", {from: 0, to: 1, duration: 700, ease: "easeInOutCubic"})
      .animateProperty("sprite", "scale.x", {from: 1, to: 0, delay: 2500, duration: 500, ease: "easeInElastic"})
      .animateProperty("sprite", "scale.y", {from: 1, to: 0, delay: 2300, duration: 700, ease: "easeInElastic"})
      .effect()
      .delay(3000).file(assets[1]).atLocation(location).scale({x: 0.2, y: 0.2})
      .animation()
      .delay(1000).on(steedId).opacity(1.0).fadeIn(200).moveTowards({x, y}).duration(200).waitUntilFinished()
      .effect()
      .attachTo(steedId).file(assets[2]).scale(0.5)
      .effect()
      .file(assets[3]).attachTo(token).size(canvas.grid.size).waitUntilFinished(-2000)
      .play();
    await warpgate.mutate(token.document, updatesShape, {}, {name: item.name});
    await actor.sheet?.maximize();
    return actor.createEmbeddedDocuments("ActiveEffect", [{
      icon: item.img,
      label: item.name,
      origin: actor.uuid,
      duration: {seconds: actor.system.attributes.prof * 60 * 60},
      "flags.core.statusId": item.name.slugify({strict: true}),
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
      }.toString()})()`
    }]);
  }
}