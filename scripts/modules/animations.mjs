export class ZHELL_ANIMATIONS {
  static onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if (!uuid) return;

    const item = fromUuidSync(uuid);
    if (!item) return;

    // BREATH WEAPON.
    const type = item.getFlag("world", "breath-weapon.type");
    if (type) {
      new Sequence().effect()
        .file(type)
        .atLocation(templateDoc)
        .stretchTo(templateDoc)
        .play();
    }
  }

  static collapsibleSetup() {
    document.addEventListener("click", (event) => {
      const t = event.target.closest(".zhell-collapsible-header");
      if (!t) return;
      t.closest(".zhell-collapsible").classList.toggle("active");
    });
  }
}

export function _initD20(dice3d) {
  dice3d.addSystem({ id: "zhell-custom-stuff", name: "The Rollsmith - Package Jam 2022" }, false);
  dice3d.addDicePreset({
    type: "d20",
    labels: "",
    modelFile: "modules/zhell-custom-stuff/sources/dice_20.gltf",
    system: "zhell-custom-stuff"
  });
}

export const database = {
  effects: {
    circles: {
      blue: [
        "modules/zhell-custom-stuff/sources/animations/circles/blueWarp.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/blueWarpTransparent.webm"
      ],
      green: [
        "modules/zhell-custom-stuff/sources/animations/circles/greenTimeVortex.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/greenTimeVortexLightning.webm",
      ],
      holy: [
        "modules/zhell-custom-stuff/sources/animations/circles/holy.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/holyStars.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/holyStarsTransparent.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/holyTransparent.webm",
      ],
      purple: [
        "modules/zhell-custom-stuff/sources/animations/circles/purpleTimeVortex.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/purpleTimeVortexLightning.webm",
      ],
      rainbow: [
        "modules/zhell-custom-stuff/sources/animations/circles/rainbowTimeVortex.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/rainbowTimeVortexLightning.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/rainbowTimeVortexRainbows.webm",
      ],
      red: [
        "modules/zhell-custom-stuff/sources/animations/circles/redMagic.webm",
        "modules/zhell-custom-stuff/sources/animations/circles/redMagicTransparent.webm"
      ]
    },
    clutter: {
      campfire: [
        "modules/zhell-custom-stuff/sources/animations/clutter/campfireLoop.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/campfireSmallTwoTilt.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/smallSmokeFireStackedTop.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/smallSmokeFireTop.webm"
      ],
      candle: [
        "modules/zhell-custom-stuff/sources/animations/clutter/candleAndPumpkins.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/singlePumpkin.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/orangeCandles.webm",
        "modules/zhell-custom-stuff/sources/animations/clutter/redCandle.webm"
      ],
      torch: {
        front: "modules/zhell-custom-stuff/sources/animations/clutter/torchFront.webm",
        top: "modules/zhell-custom-stuff/sources/animations/clutter/torchTop.webm"
      }
    },
    flamingSkull: {
      floating: "modules/zhell-custom-stuff/sources/animations/flamingSkull/floating.webm",
      regular: "modules/zhell-custom-stuff/sources/animations/flamingSkull/regular.webm"
    },
    spells: {
      burningHands: [
        "modules/zhell-custom-stuff/sources/animations/spells/burningHands/alt_1.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/burningHands/alt_2.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/burningHands/original.webm"
      ],
      callLightning: {
        blue: "modules/zhell-custom-stuff/sources/animations/spells/callLightning/electricBlue.webm",
        pink: "modules/zhell-custom-stuff/sources/animations/spells/callLightning/pink.webm",
        purple: "modules/zhell-custom-stuff/sources/animations/spells/callLightning/purple.webm"
      },
      chainLightning: {
        blue: "modules/zhell-custom-stuff/sources/animations/spells/chainLightning/electricBlue.webm",
        pink: "modules/zhell-custom-stuff/sources/animations/spells/chainLightning/pink.webm"
      },
      cloudKill: {
        green: "modules/zhell-custom-stuff/sources/animations/spells/cloudKill/green.webm",
        greyBlue: "modules/zhell-custom-stuff/sources/animations/spells/cloudKill/greyBlue.webm"
      },
      darkness: [
        "modules/zhell-custom-stuff/sources/animations/spells/darkness/original.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/darkness/transparent.webm"
      ],
      flamingSphere: [
        "modules/zhell-custom-stuff/sources/animations/spells/flamingSphere/large.webm"
      ],
      lightningBolt: {
        cyan: [
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/cyan.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/cyan_2.webm"
        ],
        blue: [
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/electric_blue.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/electric_blue_2.webm",
        ],
        pink: [
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/pink.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/pink_2.webm",
        ],
        yellow: [
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/yellow.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/lightningBolt/yellow_2.webm"
        ]
      },
      stormSphere: {
        cyan: "modules/zhell-custom-stuff/sources/animations/spells/stormSphere/cyan.webm",
        blue: "modules/zhell-custom-stuff/sources/animations/spells/stormSphere/electricBlue.webm",
        pink: "modules/zhell-custom-stuff/sources/animations/spells/stormSphere/pink.webm",
        yellow: "modules/zhell-custom-stuff/sources/animations/spells/stormSphere/yellow.webm"
      },
      thunderwave: {
        cyan: [
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/cyan_1.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/cyan_2.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/cyan_3.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/cyan_4.webm"
        ],
        blue: [
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/electric_blue_1.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/electric_blue_2.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/electric_blue_3.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/electric_blue_4.webm"
        ],
        purple: [
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/purple_1.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/purple_2.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/purple_3.webm",
          "modules/zhell-custom-stuff/sources/animations/spells/thunderwave/purple_4.webm"
        ]
      },
      wallOfFire: [
        "modules/zhell-custom-stuff/sources/animations/spells/wallOfFire/ringed.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/wallOfFire/ringedAlt.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/wallOfFire/smaller.webm"
      ],
      witchBolt: [
        "modules/zhell-custom-stuff/sources/animations/spells/witchBolt/var_1.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/witchBolt/var_2.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/witchBolt/var_3.webm",
        "modules/zhell-custom-stuff/sources/animations/spells/witchBolt/var_4.webm"
      ]
    },
    weather: {
      blizzard: [
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzard.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardDown_3.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardDown.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardDownToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardWithFog.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardWithFogDown.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardWithFogDownToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/blizzard/blizzardWithFogToken.webm",
      ],
      cartoonSnow: [
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/down.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/downToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/multi.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/multiDown.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/multiDownToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/multiToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/original.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/cartoonSnow/token.webm"
      ],
      flutteringSnow: [
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/fast.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/fastToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/med.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/medToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/original.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/sideblown.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/sideblownToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/flutteringSnow/token.webm",
      ],
      lightSnow: [
        "modules/zhell-custom-stuff/sources/animations/weather/lightSnow/down.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/lightSnow/token.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/lightSnow/downToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/lightSnow/original.webm"
      ],
      slowSnow: [
        "modules/zhell-custom-stuff/sources/animations/weather/slowSnow/original.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/slowSnow/down.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/slowSnow/downToken.webm",
        "modules/zhell-custom-stuff/sources/animations/weather/slowSnow/token.webm"
      ]
    },
    wisp: {
      alt: "modules/zhell-custom-stuff/sources/animations/wisp/alt.webm",
      original: "modules/zhell-custom-stuff/sources/animations/wisp/original.webm",
      yellow: "modules/zhell-custom-stuff/sources/animations/wisp/yellow.webm"
    }
  }
}
