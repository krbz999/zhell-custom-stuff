import { MODULE } from "../scripts/const.mjs";

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
    id: "bane", label: "Bane", sort: 1100,
    icon: "assets/images/conditions/bane.webp",
    duration: { seconds: 60 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are under the effects of the Bane spell.
          You subtract <strong>1d4</strong> from all saving throws and attack rolls.`
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
    id: "bless", label: "Bless", sort: 1000,
    icon: "assets/images/conditions/bless.webp",
    duration: { seconds: 60 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are under the effects of the Bless spell.
          You add a <strong>1d4</strong> bonus to all saving throws and attack rolls.`
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
    id: "haste", label: "Haste", sort: 1200,
    icon: "assets/images/conditions/haste.webp",
    duration: { seconds: 60 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are under the effects of the Haste spell.
          Your movement speed is doubled, you have a +2 bonus to AC, and you have advantage on Dexterity saving throws.`
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
    id: "slow", label: "Slow", sort: 1300,
    icon: "assets/images/conditions/slowed.webp",
    duration: { seconds: 60 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are under the effects of the Slow spell.
          Your movement speed is halved, and you subtract 2 from your AC and Dexterity saving throws.`
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
    id: "invisible", label: "Invisible", sort: 1500,
    icon: "assets/images/conditions/invisible.webp",
    duration: { seconds: 3600 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are invisible.
          You are impossible to see, and are considered heavily obscured.
          Attack rolls against you have disadvantage, and your attack rolls have advantage.`
        }
      }
    }
  },
  {
    id: "fly", label: "Flying", sort: 1400,
    icon: "assets/images/conditions/flying.webp",
    duration: { seconds: 600 },
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are under the effects of the Fly spell.
          You have a flying speed of 60 feet.`
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
*/
export const STATUS_EFFECTS = [
  {
    id: "blind", label: "Blinded", sort: 300,
    icon: "assets/images/conditions/blinded.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You cannot see, and you automatically fail any ability checks that require sight.
          Attack rolls against you have advantage, and your attack rolls have disadvantage.`
        }
      }
    }
  },
  {
    id: "charm", label: "Charmed", sort: 200,
    icon: "assets/images/conditions/charmed.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You cannot attack the charmer or target them with harmful abilities or magical effects.
          The charmer has advantage on any ability check to interact socially with you.`
        }
      }
    }
  },
  {
    id: "dead", label: "Dead", sort: 100,
    icon: "assets/images/conditions/dead.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `You have met an unfortunate end.`
        }
      }
    }
  },
  {
    id: "deaf", label: "Deafened", sort: 330,
    icon: "assets/images/conditions/deafened.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `You cannot hear and automatically fail any ability checks that require hearing.`
        }
      }
    }
  },
  {
    id: "mute", label: "Muted", sort: 360,
    icon: "assets/images/conditions/muted.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You cannot speak and cannot cast spells with a verbal component.
          You automatically fail any ability checks that require speech.`
        }
      }
    }
  },
  {
    id: "fear", label: "Frightened", sort: 250,
    icon: "assets/images/conditions/frightened.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You have disadvantage on all attack rolls and ability checks while the source of your fear is within your line of sight.
          You cannot willingly move closer to the source of your fear.`
        }
      }
    }
  },
  {
    id: "grappled", label: "Grappled", sort: 430,
    icon: "assets/images/conditions/grappled.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `Your speed is zero.`
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 }
    ]
  },
  {
    id: "incapacitated", label: "Incapacitated", sort: 500,
    icon: "assets/images/conditions/incapacitated.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `You cannot take actions or reactions.`
        }
      }
    }
  },
  {
    id: "paralysis", label: "Paralyzed", sort: 600,
    icon: "assets/images/conditions/paralyzed.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are incapacitated, and you cannot move or speak.
          You automatically fail Strength and Dexterity saving throws.
          Attack rolls against you have advantage, and any attacks against you is a critical hit if the attacker is within 5 feet of you.`
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 }
    ]
  },
  {
    id: "petrified", label: "Petrified", sort: 650,
    icon: "assets/images/conditions/petrified.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are inanimate, incapacitated, and unaware of your surroundings.
          Your weight is increased by a factor of ten, you cannot move or speak, and attack rolls against you have advantage.
          You automatically fail all Strength and Dexterity saving throws.
          You have resistance to all damage, and you are immune to poison and disease.`
        }
      }
    }
  },
  {
    id: "poison", label: "Poisoned", sort: 280,
    icon: "assets/images/conditions/poisoned.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `You have disadvantage on all attack rolls and ability checks.`
        }
      }
    }
  },
  {
    id: "prone", label: "Prone", sort: 400,
    icon: "assets/images/conditions/prone.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You can only crawl unless you expend half your movement to stand up.
          You have disadvantage on attack rolls, and any attack roll has advantage against you if the attacker is within 5 feet of you; it otherwise has disadvantage.`
        }
      }
    }
  },
  {
    id: "restrain", label: "Restrained", sort: 450,
    icon: "assets/images/conditions/restrained.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          Your speed is zero, attack rolls against you have advantage, and your attack rolls have disadvantage.
          You have disadvantage on Dexterity saving throws.`
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 }
    ]
  },
  {
    id: "stun", label: "Stunned", sort: 540,
    icon: "assets/images/conditions/stunned.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are incapacitated, cannot move, and can speak only falteringly.
          You automatically fail Strength and Dexterity saving throws, and attack rolls against you have advantage.`
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 }
    ]
  },
  {
    id: "unconscious", label: "Unconscious", sort: 560,
    icon: "assets/images/conditions/unconscious.webp",
    flags: {
      "visual-active-effects": {
        data: {
          intro: `
          You are incapacitated, cannot move or speak, you fall prone, and you automatically fail all Strength and Dexterity saving throws.
          Attack rolls against you have advantage, and any attack that hits you is a critical hit if the attacker is within 5 feet of you.`
        }
      }
    },
    changes: [
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 }
    ]
  }
];

export const EXHAUSTION_EFFECTS = [
  {
    id: "exhaustion",
    label: "Exhaustion (1)",
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: {
      [MODULE]: { exhaustion: 1 },
      "visual-active-effects": {
        data: {
          intro: `You have disadvantage on all ability checks.`
        }
      }
    },
    changes: [
      { key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 1 }
    ]
  },
  {
    id: "exhaustion",
    label: "Exhaustion (2)",
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: {
      [MODULE]: { exhaustion: 2 },
      "visual-active-effects": {
        data: {
          intro: `
          You have disadvantage on all ability checks.
          Your movement speed is halved.`
        }
      }
    },
    changes: [
      { key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 2 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }
    ]
  },
  {
    id: "exhaustion",
    label: "Exhaustion (3)",
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: {
      [MODULE]: { exhaustion: 3 },
      "visual-active-effects": {
        data: {
          intro: `
          You have disadvantage on all ability checks, attack rolls, and saving throws.
          Your movement speed is halved.`
        }
      }
    },
    changes: [
      { key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 3 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }
    ]
  },
  {
    id: "exhaustion",
    label: "Exhaustion (4)",
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: {
      [MODULE]: { exhaustion: 4 },
      "visual-active-effects": {
        data: {
          intro: `
          You have disadvantage on all ability checks, attack rolls, and saving throws.
          Your movement speed and your maximum hit points are halved.`
        }
      }
    },
    changes: [
      { key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 4 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.hp.max", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }
    ]
  },
  {
    id: "exhaustion",
    label: "Exhaustion (5)",
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: {
      [MODULE]: { exhaustion: 5 },
      "visual-active-effects": {
        data: {
          intro: `
          You have disadvantage on all ability checks, attack rolls, and saving throws.
          You cannot move, and your hit point maximum is halved.`
        }
      }
    },
    changes: [
      { key: "system.attributes.exhaustion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 5 },
      { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.fly", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.swim", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.climb", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0 },
      { key: "system.attributes.movement.burrow", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 },
      { key: "system.attributes.hp.max", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }
    ]
  }
];
