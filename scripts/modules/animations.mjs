import { database } from "../../sources/animations.mjs";
import { MODULE } from "../const.mjs";

export class ZHELL_ANIMATIONS {
  static onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if (!uuid) return;

    const item = fromUuidSync(uuid);
    if (!item || !(item instanceof Item)) return;

    const token = item.actor.token?.object ?? item.actor.getActiveTokens()[0];

    let check;

    // BREATH WEAPON.
    check = item.getFlag(MODULE, "breath-weapon.type");
    if (check) {
      const file = check;
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // SCORCHING CLEAVER.
    check = item.name.includes("Erupting Slash");
    if (check) {
      const file = "jb2a.fire_jet.orange";
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // CALL LIGHTNING.
    check = item.name.includes("Call Lightning");
    if (check) {
      const file = "jb2a.lightning_strike.blue.0";
      return new Sequence().effect().file(file).atLocation(templateDoc).scale(2).play();
    }

    // JEWEL OF THE LIVING LIGHTNING.
    check = item.name.includes("Jewel of the Living Lightning");
    if (check) {
      const file = "zhell.effects.spells.lightningBolt.yellow.0";
      return new Sequence().effect().file(file).fadeIn(200).fadeOut(200).duration(2000).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // BURNING HANDS.
    check = item.name.includes("Burning Hands");
    if (check) {
      const file = "jb2a.burning_hands.01.orange";
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // STAR DUST.
    check = item.name.includes("Star Dust");
    if (check) {
      const file = "jb2a.side_impact.part.slow.star.pinkyellow";
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // EVARD'S BLACK TENTACLES.
    check = item.name.includes("Black Tentacles");
    if (check) {
      const file = "jb2a.arms_of_hadar.dark_purple";
      return new Sequence().effect().file(file).fadeIn(200).fadeOut(200).attachTo(templateDoc).tieToDocuments(templateDoc).persist().play();
    }

    // FIREBALL.
    check = item.name === "Fireball";
    if (check) {
      const beam = "jb2a.fireball.beam.orange";
      const expl = "jb2a.fireball.explosion.orange";

      const seq = new Sequence();
      if (token) seq.effect().file(beam).atLocation(token).stretchTo(templateDoc).playbackRate(2).waitUntilFinished();
      return seq.effect().file(expl).atLocation(templateDoc).play();
    }
  }

  static onItemRollAttack(item, roll, ammoUpdate) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();
    const ammo = actor.items.get(ammoUpdate[0]?._id);

    let check;

    // ELDRITCH BLAST.
    check = name.includes("Eldritch Blast");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.eldritch_blast";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // FIRE BOLT.
    check = name.includes("Fire Bolt");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.fire_bolt.orange";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // RADIANT FLAME.
    check = name.includes("Radiant Flame");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.chain_lightning.secondary.yellow";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // BOW OF THE OUTCAST.
    check = name.includes("Bow of the Outcast");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.arrow.physical";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // GUIDING BOLT.
    check = name.includes("Guiding Bolt");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.bullet";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // BOWS in general.
    check = ["shortbow", "longbow"].includes(item.system.baseItem);
    if (check) {
      if (!target || !token || !ammo) return;
      const file = "jb2a.arrow.physical.white.01";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // CROSSBOWS in general.
    check = ["handcrossbow", "heavycrossbow", "lightcrossbow"].includes(item.system.baseItem);
    if (check) {
      if (!target || !token || !ammo) return;
      const file = "jb2a.bolt.physical.white02";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // ICE KNIFE.
    check = item.name.includes("Ice Knife");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.spell_projectile.ice_shard.blue";
      return new Sequence().effect().file(file).atLocation(token).stretchTo(target).play();
    }

    // PAST KNOWLEDGE.
    check = item.name.includes("Energy Burst");
    if (check) {
      if (!target || !token) return;
      const type = item.system.damage.parts[0][1] === "necrotic" ? "dark_bluewhite" : "red";
      const file = `jb2a.guiding_bolt.02.${type}`;
      return new Sequence().effect().file(file).playbackRate(1.5).atLocation(token.center).stretchTo(target).play();
    }
  }

  static onItemRollDamage(item, roll) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    let check;

    // HEALING WORD (Arkorow).
    check = name.includes("Healing Word") && actor.name.includes("Arkorow");
    if (check) {
      const file1 = "jb2a.healing_generic.400px.yellow";
      const file2 = "jb2a.butterflies.few.bright_orange";
      if (target) {
        return new Sequence()
          .effect().attachTo(target).file(file1).scaleIn(0, 500)
          .effect().attachTo(target).file(file2).scaleIn(0, 500).fadeOut(500)
          .play();
      } else if (token) {
        return new Sequence().effect().attachTo(token).file(file2).scaleIn(0, 500).fadeOut(500).play();
      }
    }

    // HEALING WORD (Devinn).
    check = name.includes("Healing Word") && actor.name.includes("Devinn");
    if (check) {
      if (!target) return;
      const file = "jb2a.cure_wounds.400px.red";
      return new Sequence().effect().attachTo(target).file(file).scaleIn(0, 500).play();
    }

    // ELDRITCH SMITE.
    check = name.includes("Eldritch Smite");
    if (check) {
      if (!target) return;
      const file = "jb2a.divine_smite.target.purplepink";
      return new Sequence().effect().attachTo(target).file(file).play();
    }

    // DIVINE SMITE.
    check = name.includes("Divine Smite");
    if (check) {
      if (!target) return;
      const file = "jb2a.divine_smite.target.greenyellow";
      return new Sequence().effect().attachTo(target).file(file).play();
    }

    // LIGHTNING TENDRIL.
    check = name.includes("Lightning Tendril");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.chain_lightning.secondary.blue";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }
  }

  static onItemUse(item) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    let check;

    // CALL OF THE PACK/CLUTCH.
    check = name.startsWith("Call of the ") && actor.name.includes("Mordus");
    if (check) {
      if (!token) return;
      const file = "assets/images/tiles/symbols/holy/hav_draconiz_gold.webp";
      return new Sequence().effect()
        .file(file).duration(2000).atLocation(token).scaleIn(.5, 2000)
        .size(2.5, { gridUnits: true }).fadeIn(500).fadeOut(500).play();
    }

    // SPOTLIGHT.
    check = name.includes("Spotlight") && actor.name.includes("Arkorow");
    if (check) {
      if (!token) return;
      const file = "jb2a.template_circle.out_pulse.01.burst.bluewhite";
      return new Sequence().effect().file(file).atLocation(token).scale(0.75).play();
    }

    // PIPE (Drazvik).
    check = name.includes("Pipe") && actor.name.includes("Drazvik");
    if (check) {
      if (!token) return;
      const file = "jb2a.smoke.puff.centered.dark_green.1";
      return new Sequence().effect().file(file).atLocation(token, {
        offset: { x: canvas.grid.size / 3, y: -canvas.grid.size / 4 }
      }).size(canvas.grid.size).play();
    }

    // TOLL THE DEAD.
    check = name.includes("Toll the Dead");
    if (check) {
      if (!target) return;
      const file = "jb2a.toll_the_dead.purple.complete";
      return new Sequence().effect().file(file).scale(0.5).atLocation(target).play();
    }

    // PALADIN AURA.
    check = name.includes("Aura of Protection");
    if (check) {
      if (!token) return;
      const name = `paladin-aura-${token.document.id}`;
      const file = "jb2a.extras.tmfx.border.circle.outpulse.01.normal";
      const has = !!Sequencer.EffectManager.getEffects({ name }).length;
      if (has) return Sequencer.EffectManager.endEffects({ name });
      return new Sequence().effect().attachTo(token).file(file).persist().name(name).tint("#ff7300").play();
    }
  }

  static onRollSkill(actor, roll, skill) {
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    let check;

    // STEALTH.
    check = skill === "ste";
    if (check) {
      if (!token) return;
      const file = "jb2a.sneak_attack.";
      return new Sequence().effect().file(file).attachTo(token).play();
    }
  }
}

// COLLAPSIBLES.
export function _setupCollapsibles() {
  document.addEventListener("click", (event) => {
    event.target.closest(".zhell-collapsible-header")?.closest(".zhell-collapsible")?.classList.toggle("active");
  });
}

// ADD DICE.
export function _initD20(dice3d) {
  dice3d.addSystem({ id: "zhell-custom-stuff", name: "The Rollsmith - Package Jam 2022" }, false);
  dice3d.addDicePreset({
    type: "d20",
    labels: "",
    modelFile: "assets/animations/dice/dice_20.gltf",
    system: "zhell-custom-stuff"
  });
}

// SET UP SEQUENCER DB.
export function _sequencerSetup() {
  Sequencer.Database.registerEntries("zhell", database);
}

// CUSTOM JOURNAL PAGE STUFF.
export function _classesPageListeners(app, html) {
  if (app.object.parent.name !== "Index: Available Classes") return;
  const selector = "a.content-link[data-pack='zhell-catalogs.spells']";
  html[0].querySelectorAll(selector).forEach(s => {
    const A = document.createElement("A");
    A.classList.add("spell-desc-toggle");
    A.setAttribute("data-action", "toggleDescription");
    A.setAttribute("data-uuid", s.dataset.uuid);
    A.innerHTML = "<i class='fa-solid fa-plus'></i>";
    s.after(A);
  });

  html[0].querySelectorAll("[data-action=toggleDescription]").forEach(a => {
    a.addEventListener("click", async () => {
      const uuid = a.dataset.uuid;
      const shown = html[0].querySelector(`.spell-description[data-uuid='${uuid}']`);
      if (shown) return shown.remove();
      const spell = await fromUuid(uuid);
      const desc = spell.system.description.value;
      const DIV = document.createElement("DIV");
      DIV.innerHTML = desc;
      DIV.classList.add("spell-description");
      DIV.setAttribute("data-uuid", uuid);
      a.after(DIV);
    });
  });
}

export function _equipmentPageListeners(app, html) {
  if (app.object.parent.name !== "Index: Table Rules") return;
  if (app.object.name !== "Equipment") return;
  html[0].addEventListener("click", (event) => {
    event.target.closest(".zhell-equipment-tables :is(h1, h2, h3)")?.classList.toggle("collapsed");
  });
}

// ROTATE TOKENS WHEN THEY MOVE.
export function _rotateTokensOnMovement(doc, update, options) {
  if (doc.lockRotation) return;
  if (options.animate === false) return;
  if (!foundry.utils.hasProperty(update, "x") && !foundry.utils.hasProperty(update, "y")) return;
  const ray = new Ray(doc, { x: update.x ?? doc.x, y: update.y ?? doc.y });
  update.rotation = ray.angle * 180 / Math.PI - 90;
}

// draw a circle around a token placeable.
export function drawCircle(token, radius) {
  const { x, y } = token.center;
  const tokenRadius = Math.abs(token.document.x - x);
  const pixels = radius / canvas.scene.grid.distance * canvas.scene.grid.size + tokenRadius;
  const color = game.user.color.replace("#", "0x");
  const p = new PIXI.Graphics()
    .beginFill(color, 0.5).drawCircle(x, y, pixels).endFill()
    .beginHole().drawCircle(x, y, pixels - 5).endHole();
  canvas.app.stage.addChild(p);
  return p;
}
