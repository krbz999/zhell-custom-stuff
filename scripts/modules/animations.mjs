import {database} from "../../sources/animations.mjs";
import {MODULE} from "../const.mjs";

export class AnimationsHandler {
  static async onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.flags.dnd5e?.origin;
    if (!uuid) return;

    const item = await fromUuid(uuid);
    if (!item || !(item instanceof Item)) return;

    const token = item.actor.token?.object ?? item.actor.getActiveTokens()[0];

    let check;
    let x = 0;
    let y = 0;
    let wait = 0;
    while ((!templateDoc.object || !x) && (wait < 2000)) {
      await new Promise(r => setTimeout(r, 50));
      x = templateDoc.object.x;
      y = templateDoc.object.y;
      wait += 50;
    }

    // BREATH WEAPON.
    check = item.flags[MODULE]?.breathWeapon?.type;
    if (check) {
      const file = check;
      return new Sequence()
        .effect().file(file).atLocation(templateDoc).stretchTo(templateDoc)
        .play();
    }

    // SCORCHING CLEAVER.
    check = item.name.includes("Erupting Slash");
    if (check) {
      const file = "jb2a.fire_jet.orange";
      return new Sequence()
        .effect().file(file).atLocation(templateDoc).stretchTo(templateDoc)
        .play();
    }

    // CALL LIGHTNING.
    check = item.name.includes("Call Lightning");
    if (check) {
      const file = "jb2a.lightning_strike.blue.0";
      return new Sequence().effect().file(file).atLocation({x, y}).scale(2).play();
    }

    // JEWEL OF THE LIVING LIGHTNING.
    check = item.name.includes("Jewel of the Living Lightning");
    if (check) {
      const file = "zhell.effects.spells.lightningBolt.yellow.0";
      await new Sequence()
        .effect().file(file).fadeIn(200).fadeOut(200).duration(2000).atLocation(templateDoc).stretchTo(templateDoc)
        .play();
      if (!token) return;
      const [x, y] = ZHELL.token.detection.getFurthestPointOnTemplateFromPosition(token.center, templateDoc, "move");
      return token.document.update({x, y});
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
      return new Sequence()
        .effect().file(file).fadeIn(200).fadeOut(200).attachTo(templateDoc).tieToDocuments(templateDoc).persist().belowTokens()
        .play();
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
    const {name, actor} = item;
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
      if (!target || !token) return;
      const file = "jb2a.arrow.physical.white.01";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }

    // CROSSBOWS in general.
    check = ["handcrossbow", "heavycrossbow", "lightcrossbow"].includes(item.system.baseItem);
    if (check) {
      if (!target || !token) return;
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
    const {name, actor} = item;
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
        const seq = new Sequence();
        for (const t of game.user.targets) {
          seq
            .effect().attachTo(t).file(file1).scaleIn(0, 500)
            .effect().attachTo(t).file(file2).scaleIn(0, 500).fadeOut(500);
        }
        return seq.play();
      } else if (token) {
        return new Sequence()
          .effect().attachTo(token).file(file2).scaleIn(0, 500).fadeOut(500)
          .play();
      }
    }

    // HEALING WORD (Devinn).
    check = name.includes("Healing Word") && actor.name.includes("Devinn");
    if (check) {
      if (!target) return;
      const file = "jb2a.cure_wounds.400px.red";
      const seq = new Sequence();
      for (const t of game.user.targets) seq.effect().attachTo(t).file(file).scaleIn(0, 500);
      return seq.play();
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
    const {name, actor} = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    let check;

    // ELIXIR CANNON
    check = item.name.includes("Experimental Elixir") && (item.type === "consumable");
    if (check) {
      if (!target || !token) return;
      const file = "jb2a.throwable.throw.flask";
      const file2 = "jb2a.explosion.05";
      return new Sequence()
        .effect().stretchTo(target).atLocation(token).file(file).fadeIn(200).fadeOut(200).waitUntilFinished()
        .effect().attachTo(target).file(file2).scaleToObject(1.5, {uniform: true, considerTokenScale: true})
        .play();
    }

    // CALL OF THE PACK/CLUTCH.
    check = name.startsWith("Call of the ") && actor.name.includes("Mordus");
    if (check) {
      if (!token) return;
      const file = "assets/images/tiles/symbols/holy/hav_draconiz_gold.webp";
      return new Sequence()
        .effect().file(file).duration(2000).atLocation(token).scaleIn(.5, 2000).size(2.5, {gridUnits: true}).fadeIn(500).fadeOut(500)
        .play();
    }

    // SPOTLIGHT.
    check = name.includes("Spotlight") && actor.name.includes("Arkorow");
    if (check) {
      if (!token) return;
      const file = "jb2a.template_circle.out_pulse.01.burst.bluewhite";
      return new Sequence().effect().file(file).atLocation(token).scale(0.75).play();
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
      const has = Sequencer.EffectManager.getEffects({name}).length > 0;
      if (has) return Sequencer.EffectManager.endEffects({name});
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

  // SET UP SEQUENCER DB.
  static _sequencerSetup() {
    Sequencer.Database.registerEntries("zhell", database);
  }

  // ADD DICE.
  static _initD20(dice3d) {
    dice3d.addSystem({id: MODULE, name: "The Rollsmith - Package Jam 2022"}, false);
    dice3d.addDicePreset({
      type: "d20",
      labels: "",
      modelFile: "assets/animations/dice/dice_20.gltf",
      system: MODULE
    });
  }
}
