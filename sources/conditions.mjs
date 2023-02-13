import { DEPEND } from "../scripts/const.mjs";

/*
  1000: Bless
  1100: Bane
  1200: Haste
  1300: Slow
  1400: Fly
  1500: Invisible
*/
export const SPELL_EFFECTS = [
  {
    id: "bane", label: "ZHELL.StatusConditionBane", sort: 1100,
    icon: "assets/images/conditions/bane.webp",
    duration: { seconds: 60 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are under the effects of the Bane spell.</p>"
            + "<p>You subtract <strong>1d4</strong> from all saving throws and attack rolls.</p>"
        }
      }
    },
    changes: [
      { key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1d4" },
      { key: "system.bonuses.msak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1d4" },
      { key: "system.bonuses.mwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1d4" },
      { key: "system.bonuses.rsak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1d4" },
      { key: "system.bonuses.rwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1d4" }
    ]
  },
  {
    id: "bless", label: "ZHELL.StatusConditionBless", sort: 1000,
    icon: "assets/images/conditions/bless.webp",
    duration: { seconds: 60 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are under the effects of the Bless spell.</p>"
            + "<p>You add a <strong>1d4</strong> bonus to all saving throws and attack rolls.</p>"
        }
      }
    },
    changes: [
      { key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" },
      { key: "system.bonuses.msak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" },
      { key: "system.bonuses.mwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" },
      { key: "system.bonuses.rsak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" },
      { key: "system.bonuses.rwak.attack", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1d4" }
    ]
  },
  {
    id: "haste", label: "ZHELL.StatusConditionHaste", sort: 1200,
    icon: "assets/images/conditions/haste.webp",
    duration: { seconds: 60 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are under the effects of the Haste spell.</p>"
            + "<p>Your movement speed is doubled, you have a +2 bonus to AC, and you have advantage on Dexterity saving throws.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 2 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 2 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 2 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 2 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 2 }
    ]
  },
  {
    id: "slow", label: "ZHELL.StatusConditionSlow", sort: 1300,
    icon: "assets/images/conditions/slowed.webp",
    duration: { seconds: 60 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are under the effects of the Slow spell.</p>"
            + "<p>Your movement speed is halved, and you subtract 2 from your AC and Dexterity saving throws.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -2 },
      { key: "system.abilities.dex.bonuses.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -2 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }
    ]
  },
  {
    id: "invisible", label: "ZHELL.StatusConditionInvisible", sort: 1500,
    icon: "assets/images/conditions/invisible.webp",
    duration: { seconds: 3600 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are invisible.</p>"
            + "<p>You are impossible to see, and are considered heavily obscured.</p>"
            + "<p>Attack rolls against you have disadvantage, and your attack rolls have advantage.</p>"
        }
      }
    }
  },
  {
    id: "fly", label: "ZHELL.StatusConditionFlying", sort: 1400,
    icon: "assets/images/conditions/flying.webp",
    duration: { seconds: 600 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are under the effects of the Fly spell.</p>"
            + "<p>You have a flying speed of 60 feet.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 60 }
    ]
  }
];
/*
  100: Dead
  200: Charmed, Frightened (250), Poisoned (280)
  300: Blinded, Deafened (330), Muted (360)
  400: Prone, Grappled (430), Restrained (450)
  500: Incapacitated, Stunned (540), Unconscious (560)
  600: Paralyzed, Petrified (650)
  700: Invisible, Flying (750)
  1600: Reaction
*/
export const STATUS_EFFECTS = [
  {
    id: "blind", label: "ZHELL.StatusConditionBlinded", sort: 300,
    icon: "assets/images/conditions/blinded.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You cannot see, and you automatically fail any ability checks that require sight.</p>"
            + "<p>Attack rolls against you have advantage, and your attack rolls have disadvantage.</p>"
        }
      }
    }
  },
  {
    id: "charm", label: "ZHELL.StatusConditionCharmed", sort: 200,
    icon: "assets/images/conditions/charmed.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You cannot attack the charmer or target them with harmful abilities or magical effects.</p>"
            + "<p>The charmer has advantage on any ability check to interact socially with you.</p>"
        }
      }
    }
  },
  {
    id: "dead", label: "ZHELL.StatusConditionDead", sort: 100,
    icon: "assets/images/conditions/dead.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro: "<p>You have met an unfortunate end.</p>"
        }
      }
    }
  },
  {
    id: "deaf", label: "ZHELL.StatusConditionDeafened", sort: 330,
    icon: "assets/images/conditions/deafened.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro: "<p>You cannot hear and automatically fail any ability checks that require hearing.</p>"
        }
      }
    }
  },
  {
    id: "mute", label: "ZHELL.StatusConditionMuted", sort: 360,
    icon: "assets/images/conditions/muted.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You cannot speak and cannot cast spells with a verbal component.</p>"
            + "<p>You automatically fail any ability checks that require speech.</p>"
        }
      }
    }
  },
  {
    id: "fear", label: "ZHELL.StatusConditionFrightened", sort: 250,
    icon: "assets/images/conditions/frightened.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You have disadvantage on all attack rolls and ability checks while the source of your fear is within your line of sight.</p>"
            + "<p>You cannot willingly move closer to the source of your fear.</p>"
        }
      }
    }
  },
  {
    id: "grappled", label: "ZHELL.StatusConditionGrappled", sort: 430,
    icon: "assets/images/conditions/grappled.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro: "<p>Your speed is zero.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 }
    ]
  },
  {
    id: "incapacitated", label: "ZHELL.StatusConditionIncapacitated", sort: 500,
    icon: "assets/images/conditions/incapacitated.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro: "<p>You cannot take actions or reactions.</p>"
        }
      }
    }
  },
  {
    id: "paralysis", label: "ZHELL.StatusConditionParalyzed", sort: 600,
    icon: "assets/images/conditions/paralyzed.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are incapacitated, and you cannot move or speak.</p>"
            + "<p>You automatically fail Strength and Dexterity saving throws.</p>"
            + "<p>Attack rolls against you have advantage, and any attacks against you is a critical hit if the attacker is within 5 feet of you.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 }
    ]
  },
  {
    id: "petrified", label: "ZHELL.StatusConditionPetrified", sort: 650,
    icon: "assets/images/conditions/petrified.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are inanimate, incapacitated, and unaware of your surroundings.</p>"
            + "<p>Your weight is increased by a factor of ten, you cannot move or speak, and attack rolls against you have advantage.</p>"
            + "<p>You automatically fail all Strength and Dexterity saving throws.</p>"
            + "<p>You have resistance to all damage, and you are immune to poison and disease.</p>"
        }
      }
    }
  },
  {
    id: "poison", label: "ZHELL.StatusConditionPoisoned", sort: 280,
    icon: "assets/images/conditions/poisoned.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro: "<p>You have disadvantage on all attack rolls and ability checks.</p>"
        }
      }
    }
  },
  {
    id: "prone", label: "ZHELL.StatusConditionProne", sort: 400,
    icon: "assets/images/conditions/prone.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You can only crawl unless you expend half your movement to stand up.</p>"
            + "<p>You have disadvantage on attack rolls, and any attack roll has advantage against you if the attacker is within 5 feet of you; it otherwise has disadvantage.</p>"
        }
      }
    }
  },
  {
    id: "restrain", label: "ZHELL.StatusConditionRestrained", sort: 450,
    icon: "assets/images/conditions/restrained.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>Your speed is zero, attack rolls against you have advantage, and your attack rolls have disadvantage.</p>"
            + "<p>You have disadvantage on Dexterity saving throws.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 }
    ]
  },
  {
    id: "stun", label: "ZHELL.StatusConditionStunned", sort: 540,
    icon: "assets/images/conditions/stunned.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are incapacitated, cannot move, and can speak only falteringly.</p>"
            + "<p>You automatically fail Strength and Dexterity saving throws, and attack rolls against you have advantage.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 }
    ]
  },
  {
    id: "unconscious", label: "ZHELL.StatusConditionUnconscious", sort: 560,
    icon: "assets/images/conditions/unconscious.webp",
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You are incapacitated, cannot move or speak, you fall prone, and you automatically fail all Strength and Dexterity saving throws.</p>"
            + "<p>Attack rolls against you have advantage, and any attack that hits you is a critical hit if the attacker is within 5 feet of you.</p>"
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0, priority: 60 }
    ]
  },
  {
    id: "reaction", label: "ZHELL.StatusConditionReaction", sort: 1600,
    icon: "assets/images/conditions/reaction.webp",
    duration: { rounds: 1 },
    flags: {
      [DEPEND.VAE]: {
        data: {
          intro:
            "<p>You have spent your reaction.</p>"
            + "<p>You cannot take another reaction until the start of your next turn.</p>"
        }
      },
      effectmacro: {
        onCombatEnd: { script: `(${function() { return effect.delete() }})()` },
        onCombatStart: { script: `(${function() { return effect.delete() }})()` },
        onTurnStart: { script: `(${function() { return effect.delete() }})()` }
      }
    }
  }
];
