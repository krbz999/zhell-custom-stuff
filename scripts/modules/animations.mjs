export class ZHELL_ANIMATIONS {
  static onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if (!uuid) return;

    const item = fromUuidSync(uuid);
    if (!item || !(item instanceof Item)) return;

    // BREATH WEAPON.
    const type = item.getFlag("world", "breath-weapon.type");
    if (type) {
      return new Sequence().effect().file(type).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // SCORCHING CLEAVER.
    const name = item.name.includes("Erupting Slash");
    if (name) {
      const file = "jb2a.fire_jet.orange";
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
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
        "assets/animations/circles/blueWarp.webm",
        "assets/animations/circles/blueWarpTransparent.webm"
      ],
      green: [
        "assets/animations/circles/greenTimeVortex.webm",
        "assets/animations/circles/greenTimeVortexLightning.webm",
      ],
      holy: [
        "assets/animations/circles/holy.webm",
        "assets/animations/circles/holyStars.webm",
        "assets/animations/circles/holyStarsTransparent.webm",
        "assets/animations/circles/holyTransparent.webm",
      ],
      purple: [
        "assets/animations/circles/purpleTimeVortex.webm",
        "assets/animations/circles/purpleTimeVortexLightning.webm",
      ],
      rainbow: [
        "assets/animations/circles/rainbowTimeVortex.webm",
        "assets/animations/circles/rainbowTimeVortexLightning.webm",
        "assets/animations/circles/rainbowTimeVortexRainbows.webm",
      ],
      red: [
        "assets/animations/circles/redMagic.webm",
        "assets/animations/circles/redMagicTransparent.webm"
      ]
    },
    clutter: {
      campfire: [
        "assets/animations/clutter/campfireLoop.webm",
        "assets/animations/clutter/campfireSmallTwoTilt.webm",
        "assets/animations/clutter/smallSmokeFireStackedTop.webm",
        "assets/animations/clutter/smallSmokeFireTop.webm"
      ],
      candle: [
        "assets/animations/clutter/candleAndPumpkins.webm",
        "assets/animations/clutter/singlePumpkin.webm",
        "assets/animations/clutter/orangeCandles.webm",
        "assets/animations/clutter/redCandle.webm"
      ],
      torch: {
        front: "assets/animations/clutter/torchFront.webm",
        top: "assets/animations/clutter/torchTop.webm"
      }
    },
    flamingSkull: {
      floating: "assets/animations/flamingSkull/floating.webm",
      regular: "assets/animations/flamingSkull/regular.webm"
    },
    spells: {
      burningHands: [
        "assets/animations/spells/burningHands/alt_1.webm",
        "assets/animations/spells/burningHands/alt_2.webm",
        "assets/animations/spells/burningHands/original.webm"
      ],
      callLightning: {
        blue: "assets/animations/spells/callLightning/electricBlue.webm",
        pink: "assets/animations/spells/callLightning/pink.webm",
        purple: "assets/animations/spells/callLightning/purple.webm"
      },
      chainLightning: {
        blue: "assets/animations/spells/chainLightning/electricBlue.webm",
        pink: "assets/animations/spells/chainLightning/pink.webm"
      },
      cloudKill: {
        green: "assets/animations/spells/cloudKill/green.webm",
        greyBlue: "assets/animations/spells/cloudKill/greyBlue.webm"
      },
      darkness: [
        "assets/animations/spells/darkness/original.webm",
        "assets/animations/spells/darkness/transparent.webm"
      ],
      flamingSphere: [
        "assets/animations/spells/flamingSphere/large.webm"
      ],
      lightningBolt: {
        cyan: [
          "assets/animations/spells/lightningBolt/cyan.webm",
          "assets/animations/spells/lightningBolt/cyan_2.webm"
        ],
        blue: [
          "assets/animations/spells/lightningBolt/electric_blue.webm",
          "assets/animations/spells/lightningBolt/electric_blue_2.webm",
        ],
        pink: [
          "assets/animations/spells/lightningBolt/pink.webm",
          "assets/animations/spells/lightningBolt/pink_2.webm",
        ],
        yellow: [
          "assets/animations/spells/lightningBolt/yellow.webm",
          "assets/animations/spells/lightningBolt/yellow_2.webm"
        ]
      },
      stormSphere: {
        cyan: "assets/animations/spells/stormSphere/cyan.webm",
        blue: "assets/animations/spells/stormSphere/electricBlue.webm",
        pink: "assets/animations/spells/stormSphere/pink.webm",
        yellow: "assets/animations/spells/stormSphere/yellow.webm"
      },
      thunderwave: {
        cyan: [
          "assets/animations/spells/thunderwave/cyan_1.webm",
          "assets/animations/spells/thunderwave/cyan_2.webm",
          "assets/animations/spells/thunderwave/cyan_3.webm",
          "assets/animations/spells/thunderwave/cyan_4.webm"
        ],
        blue: [
          "assets/animations/spells/thunderwave/electric_blue_1.webm",
          "assets/animations/spells/thunderwave/electric_blue_2.webm",
          "assets/animations/spells/thunderwave/electric_blue_3.webm",
          "assets/animations/spells/thunderwave/electric_blue_4.webm"
        ],
        purple: [
          "assets/animations/spells/thunderwave/purple_1.webm",
          "assets/animations/spells/thunderwave/purple_2.webm",
          "assets/animations/spells/thunderwave/purple_3.webm",
          "assets/animations/spells/thunderwave/purple_4.webm"
        ]
      },
      wallOfFire: [
        "assets/animations/spells/wallOfFire/ringed.webm",
        "assets/animations/spells/wallOfFire/ringedAlt.webm",
        "assets/animations/spells/wallOfFire/smaller.webm"
      ],
      witchBolt: [
        "assets/animations/spells/witchBolt/var_1.webm",
        "assets/animations/spells/witchBolt/var_2.webm",
        "assets/animations/spells/witchBolt/var_3.webm",
        "assets/animations/spells/witchBolt/var_4.webm"
      ]
    },
    weather: {
      blizzard: [
        "assets/animations/weather/blizzard/blizzard.webm",
        "assets/animations/weather/blizzard/blizzardDown_3.webm",
        "assets/animations/weather/blizzard/blizzardDown.webm",
        "assets/animations/weather/blizzard/blizzardDownToken.webm",
        "assets/animations/weather/blizzard/blizzardToken.webm",
        "assets/animations/weather/blizzard/blizzardWithFog.webm",
        "assets/animations/weather/blizzard/blizzardWithFogDown.webm",
        "assets/animations/weather/blizzard/blizzardWithFogDownToken.webm",
        "assets/animations/weather/blizzard/blizzardWithFogToken.webm",
      ],
      cartoonSnow: [
        "assets/animations/weather/cartoonSnow/down.webm",
        "assets/animations/weather/cartoonSnow/downToken.webm",
        "assets/animations/weather/cartoonSnow/multi.webm",
        "assets/animations/weather/cartoonSnow/multiDown.webm",
        "assets/animations/weather/cartoonSnow/multiDownToken.webm",
        "assets/animations/weather/cartoonSnow/multiToken.webm",
        "assets/animations/weather/cartoonSnow/original.webm",
        "assets/animations/weather/cartoonSnow/token.webm"
      ],
      flutteringSnow: [
        "assets/animations/weather/flutteringSnow/fast.webm",
        "assets/animations/weather/flutteringSnow/fastToken.webm",
        "assets/animations/weather/flutteringSnow/med.webm",
        "assets/animations/weather/flutteringSnow/medToken.webm",
        "assets/animations/weather/flutteringSnow/original.webm",
        "assets/animations/weather/flutteringSnow/sideblown.webm",
        "assets/animations/weather/flutteringSnow/sideblownToken.webm",
        "assets/animations/weather/flutteringSnow/token.webm",
      ],
      lightSnow: [
        "assets/animations/weather/lightSnow/down.webm",
        "assets/animations/weather/lightSnow/token.webm",
        "assets/animations/weather/lightSnow/downToken.webm",
        "assets/animations/weather/lightSnow/original.webm"
      ],
      slowSnow: [
        "assets/animations/weather/slowSnow/original.webm",
        "assets/animations/weather/slowSnow/down.webm",
        "assets/animations/weather/slowSnow/downToken.webm",
        "assets/animations/weather/slowSnow/token.webm"
      ]
    },
    wisp: {
      alt: "assets/animations/wisp/alt.webm",
      original: "assets/animations/wisp/original.webm",
      yellow: "assets/animations/wisp/yellow.webm"
    }
  }
}

Hooks.on("renderJournalPageSheet", (app, html, options) => {
  if (app.object.parent.name !== "Index: Available Classes") return;
  const spells = html[0].querySelectorAll("a.content-link[data-pack='zhell-catalogs.spells']");
  spells.forEach(s => {
    const A = document.createElement("A");
    A.classList.add("spell-desc-toggle");
    A.setAttribute("data-uuid", s.dataset.uuid);
    A.innerHTML = "<i class='fa-solid fa-plus'></i>";
    s.after(A);
  });

  html[0].addEventListener("click", async (event) => {
    const a = event.target.closest(".spell-list .sub-spell-list .spell-desc-toggle");
    if (!a) return;
    const uuid = a.dataset.uuid;
    const shown = html[0].querySelector(`.spell-description[data-uuid='${uuid}']`);
    if (shown) return shown.remove();
    const p = a.closest("p");
    const spell = await fromUuid(uuid);
    const desc = spell.system.description.value;
    const DIV = document.createElement("DIV");
    DIV.innerHTML = desc;
    DIV.classList.add("spell-description");
    DIV.setAttribute("data-uuid", uuid);
    p.appendChild(DIV);
  });
});
