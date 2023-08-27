import {TargetSequencePicker} from "./modules/applications/targetSequencePicker.mjs";

export class Lucian {
  // jb2a file for Ashen Blade charging.
  static ASHEN_BLADE_CHARGING = "jb2a.particles.swirl.red";

  // jb2a file for Ashen Blade attack.
  static ASHEN_BLADE_ATTACK_IMPACT = "jb2a.impact.ground_crack.orange";
  static ASHEN_BLADE_ATTACK_SWING = "jb2a.greatsword.melee.fire.dark_purple";

  // jb2a file for Gathering Storm.
  static GATHERING_STORM = "jb2a.sleep.cloud.01.blue";

  // jb2a file for Hellish Rebuke.
  static HELLISH_REBUKE = "jb2a.explosion.01.orange";

  // jb2a file for overlay ambience during sight restriction.
  static DARK_OVERLAY = "jb2a.screen_overlay.01.bad_omen.dark_black";

  // jb2a file for Piercing Spikes.
  static THROW_SPIKE = "jb2a.spear.throw.01";

  // jb2a file for Siphon Divinity.
  static SIPHON_DIVINITY = "jb2a.healing_generic.burst.purplepink";

  // jb2a file for Jumping Jolt.
  static JUMPING_JOLT = "jb2a.chain_lightning.secondary.blue02";

  // jb2a file for Ashardalon's Stride.
  static ASHARDALON = "jb2a.flames.orange.03.2x2";

  /* ------------------------------ */
  /*                                */
  /*         INITIALIZATION         */
  /*                                */
  /* ------------------------------ */

  static init() {
    if (!game.user.isGM) return;

    globalThis.lucian = {
      init: Lucian.rollLucianInitiative,
      jolt: Lucian.jumpingJolt,
      siphon: Lucian.siphonDivinity
    };

    Hooks.on("createActiveEffect", Lucian.chargeAshenBlade);
    Hooks.on("createActiveEffect", Lucian.gatheringStorm);
    Hooks.on("createActiveEffect", Lucian.ashardalon);
    Hooks.on("dnd5e.useItem", Lucian.hellishRebuke);
    Hooks.on("dnd5e.rollAttack", Lucian.attackAshenBlade);
  }

  /* ------------------------------ */
  /*                                */
  /*            FUNCTIONS           */
  /*                                */
  /* ------------------------------ */

  static async rollLucianInitiative(token) {
    const data = [];
    for (let i = 0; i < 2; i++) {
      const roll = await token.actor.getInitiativeRoll().evaluate();
      data.push({
        actorId: token.actor.id,
        defeated: false,
        hidden: false,
        initiative: roll.total,
        sceneId: token.scene.id,
        tokenId: token.id
      });
    }
    return game.combat.createEmbeddedDocuments("Combatant", data);
  }

  static async chargeAshenBlade(effect, data, options, userId) {
    if (!effect.name.includes("Ashen Blade")) return;
    // hook on effect creation and add visual animation. Tie it to the effect.
    const token = effect.parent.getActiveTokens()[0];
    return new Sequence().effect().file(Lucian.ASHEN_BLADE_CHARGING).attachTo(token).persist().fadeIn(500).fadeOut(500).tieToDocuments(effect).play();
  }

  static async attackAshenBlade(item) {
    if (!item.name.includes("Ashen Blade")) return;
    // hook on attack rolls and play animation on the target.
    const token = item.actor.getActiveTokens()[0];
    const target = game.user.targets.first();
    await item.actor.effects.getName("Charging the Ashen Blade")?.delete();

    const c = token.center;
    const hitRay = new Ray(c, target.center);
    const gridSize = canvas.grid.size;

    const newPos = {
      x: c.x + (Math.cos(hitRay.angle) * (hitRay.distance - gridSize)),
      y: c.y + (Math.sin(hitRay.angle) * (hitRay.distance - gridSize))
    };

    return new Sequence()
      .effect().file(Lucian.ASHEN_BLADE_ATTACK_SWING).atLocation(newPos).stretchTo(target).waitUntilFinished()
      .effect().file(Lucian.ASHEN_BLADE_ATTACK_IMPACT).attachTo(target)
      .play();
  }

  // ITEM MACRO
  static async siphonDivinity(item, speaker, actor, token) {
    const pact = actor.system.spells.pact;
    if (pact.value >= pact.max) {
      ui.notifications.warn("You are not missing any pact slots.");
      return null;
    }

    const use = await item.use();
    if (!use) return;

    const value = Math.clamped(pact.value + 1, 0, pact.max);
    new Sequence().effect().file(Lucian.SIPHON_DIVINITY).attachTo(token).play();
    return actor.update({"system.spells.pact.value": value});
  }

  static async gatheringStorm(effect, data, options, userId) {
    if (!effect.name.includes("Gathering Storm")) return;
    // hook on effect creation and add visual animation. Tie it to the effect.
    const token = effect.parent.getActiveTokens()[0];
    return new Sequence().effect().file(Lucian.GATHERING_STORM).attachTo(token).persist().fadeIn(500).fadeOut(500).tieToDocuments(effect).scale(0.5).opacity(0.5).play();
  }

  static async hellishRebuke(item) {
    if (!item.name.includes("Hellish Rebuke")) return;
    const target = game.user.targets.first();
    return new Sequence().effect().file(Lucian.HELLISH_REBUKE).attachTo(target).play();
  }

  // ITEM MACRO
  static async jumpingJolt(item, speaker, actor, token) {
    const use = await item.use();
    if (!use) return;
    const level = use.flags.dnd5e.use.spellLevel;

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

      new Sequence().effect().file(Lucian.JUMPING_JOLT).atLocation(previous).stretchTo(current).play();

      if (!nextId) return;
      const prompt = await Dialog.confirm({content: "Did it hit and jumps to next target?"});
      if (!prompt) return;
    }
  }

  static async ashardalon(effect) {
    if (!effect.name.includes("Ashardalon")) return;
    const token = effect.parent.getActiveTokens()[0];
    return new Sequence().effect().file(Lucian.ASHARDALON).attachTo(token).belowTokens().persist().fadeIn(500).fadeOut(500).tieToDocuments(effect).play();
  }
}
