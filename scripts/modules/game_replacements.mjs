import { MODULE, REPLACEMENT } from "../const.mjs";
import { SPELL_EFFECTS, STATUS_EFFECTS } from "../../sources/conditions.mjs";

// hooks on setup.
export function ZHELL_REPLACEMENTS() {

  const {
    replaceConsumableTypes,
    replaceLanguages,
    replaceTools,
    replaceWeapons,
    replaceStatusEffects
  } = game.settings.get(MODULE, REPLACEMENT);

  if (replaceConsumableTypes) {
    // the new consumable types.
    const addedConsumableTypes = {
      drink: "Drink",
      poisonContact: "Contact Poison",
      poisonIngested: "Ingested Poison",
      poisonInhaled: "Inhaled Poison",
      poisonInjury: "Injury Poison",
      elixir: "Elixir",
      bomb: "Bomb",
      trap: "Trap"
    }

    // delete unwanted consumable types.
    const deletedConsumableTypes = ["rod", "wand"];
    const oldObject = foundry.utils.duplicate(CONFIG.DND5E.consumableTypes);
    for (const del of deletedConsumableTypes) delete oldObject[del];

    // merge remaining with new types to add.
    const newArray = Object.entries(addedConsumableTypes)
      .concat(Object.entries(oldObject))
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    CONFIG.DND5E.consumableTypes = Object.fromEntries(newArray);
  }

  if (replaceLanguages) {
    CONFIG.DND5E.languages = {
      common: "Common",
      aarakocra: "Aarakocra",
      draconic: "Draconic",
      dwarvish: "Dwarvish",
      elvish: "Elvish",
      infernal: "Infernal",
      cait: "Cait",
      orc: "Orcish",
      abyssal: "Abyssal",
      celestial: "Celestial",
      primordial: "Primordial",
      aquan: "Aquan",
      auran: "Auran",
      ignan: "Ignan",
      terran: "Terran",
      sylvan: "Sylvan",
      undercommon: "Undercommon",
      cant: "Thieves' Cant",
      druidic: "Druidic"
    }
  }

  if (replaceTools) {
    const key = "zhell-catalogs.items";

    CONFIG.DND5E.toolIds = {
      guiro: `${key}.0bn6X8GmJPTb8kee`,
      glaur: `${key}.0gATC04WyH4JrPWg`,
      brewer: `${key}.0hLh5UuEiqAHFNGy`,
      painter: `${key}.2cPulLXT5TlYeGdj`,
      dulcimer: `${key}.3hpOtqloLx29dW9x`,
      lute: `${key}.44YtLQgKSkCzK8v9`,
      alchemist: `${key}.4tStn8Ym5IHOZMEn`,
      thief: `${key}.7PPZlSR6IpQ4Mvvv`,
      ukulele: `${key}.8TVfL7rU2IOAnbmk`,
      leatherworker: `${key}.8rI5F0h572rFImET`,
      calligrapher: `${key}.9A3m86BsFcK3kyuk`,
      tinker: `${key}.ASonPC97y4IGqIfO`,
      drum: `${key}.BLkHLSjSAg11Irgd`,
      herb: `${key}.Bk0BYIgrgb3WMqj7`,
      smith: `${key}.CFQ2BiMfssksd9O3`,
      dice: `${key}.EsX0MGofFkxs7gvD`,
      panflute: `${key}.FfHnUw4L7R2FM6P5`,
      weaver: `${key}.G0xhjVpUygYbCUue`,
      forg: `${key}.HGwOzsIewhia3L3n`,
      tocken: `${key}.JReT6EKOgEeYRpMt`,
      wargong: `${key}.Jki4OaxHOBC3HETT`,
      viol: `${key}.M6bLWTHz021Bz61B`,
      glassblower: `${key}.OcB7ewGkA84DOQHp`,
      mason: `${key}.Q7S6lUvCHfPNaCNx`,
      concertina: `${key}.US8qotundpdkpU0X`,
      shawm: `${key}.XODrsxO7bonOv2uy`,
      pois: `${key}.XSll8MbsWEWmkdC5`,
      potter: `${key}.XWLsZ87NMbPa7aZq`,
      woodcarver: `${key}.XkkGVigtxh57Wvb2`,
      navg: `${key}.Zl4MTQUqNI9vqHLN`,
      recorder: `${key}.bT9cbtnneRrHcoHY`,
      cook: `${key}.eXTMqIA8scnGoKMi`,
      whistlestick: `${key}.jNfLEw1hydqd6gFV`,
      zulkoon: `${key}.kLrbRKBnNatsGTjH`,
      lyre: `${key}.kacmOU2zKEnqOjoz`,
      horn: `${key}.lGg5FEecUJx8jvAs`,
      jeweler: `${key}.mRFujgFSiyNaHIED`,
      thelarr: `${key}.pOlph5kKSqAO6Jvh`,
      flute: `${key}.q1Kts9CfnofRKbXy`,
      longhorn: `${key}.qASPf4BtC2c4AEPB`,
      cartographer: `${key}.qByp9O1TXmmvZZlw`,
      disg: `${key}.qJAan3e7Q3VerBPl`,
      bagpipes: `${key}.s40QkYXMkoc78pnX`,
      chess: `${key}.sXYKYV74alW1rSZX`,
      harp: `${key}.tfEjBgVmyoE394Nj`,
      yarting: `${key}.wVJXpPGzTlETZ3MR`,
      cobbler: `${key}.wYitL12DbabCoAJe`,
      tantan: `${key}.x0MtEjLGydd5MHcf`,
      card: `${key}.xpcEdLZpuwatrD1g`,
      carpenter: `${key}.zSyPecV8GvlwRBnb`,
      accordion: `${key}.NtQzLYE9ySGxHLzA`
    }
  }

  if (replaceWeapons) {
    const key = "zhell-catalogs.items";

    CONFIG.DND5E.weaponIds = {
      battleaxe: `${key}.5YvvZ5KsGgzlVBJg`,
      blowgun: `${key}.7mIrXgEFREdCZoq6`,
      club: `${key}.u2OfOMTYwv7xC3E7`,
      dagger: `${key}.36WDepHXSrp9qxtZ`,
      dart: `${key}.ssBK4bfm1gx3Q9Fo`,
      falchion: `${key}.bo4IjSpfdCfwQ5Bu`,
      flail: `${key}.1emzz8v17oS9h9ex`,
      glaive: `${key}.pq4htSLwsFByOXg6`,
      greataxe: `${key}.T7cSFs9R3pGF74b3`,
      greatclub: `${key}.y9B7EXLlrRukmCNw`,
      greatsword: `${key}.KXtYXV1G9vpwctfQ`,
      halberd: `${key}.NcZKj1Re9XxUJHYS`,
      handcrossbow: `${key}.tq2IZWhRwEpoJCLN`,
      handaxe: `${key}.zR4BtcctYAOWE7KN`,
      heavycrossbow: `${key}.zQX0nUPFKzAmWfVP`,
      javelin: `${key}.JW3iiWOeLeHfMCQW`,
      lance: `${key}.BzVHGLVLnYXcQGAN`,
      lightcrossbow: `${key}.sNVv0zBflAVdfLya`,
      lighthammer: `${key}.8nRG9Jf9u1P8qw4N`,
      longbow: `${key}.uplzusJQ5sTMsJOg`,
      longsword: `${key}.dNMYjSSffEzglwww`,
      mace: `${key}.fECMzleaJX8fqZvG`,
      maul: `${key}.wcVsUIcWNasTeZGU`,
      morningstar: `${key}.q4HPiLX1kDF47XKd`,
      net: `${key}.UKZi1Zva5aIhyTc2`,
      pike: `${key}.aUze6i3qVTpNnCnR`,
      quarterstaff: `${key}.oPTWor277Kok0ETq`,
      rapier: `${key}.yYDQyDeLgwENSebw`,
      scimitar: `${key}.lHPyj9lRxx7gLchp`,
      shortbow: `${key}.2r5SFrkBL39wxTas`,
      shortsword: `${key}.7ixPiAumqBjKBU5u`,
      sickle: `${key}.sTlhgLxyWg76c1MB`,
      sling: `${key}.Aa3xDhMzueybrODT`,
      spear: `${key}.03SkVtPAOdoK6BWB`,
      trident: `${key}.z8lUzt9KwtyksYO9`,
      warpick: `${key}.evvPCgenUmPXFSb0`,
      warhammer: `${key}.YZzXPxRgpYcPh61M`,
      whip: `${key}.KGH7gJe5mvpbRoFZ`
    }

    // delete some weapon properties.
    const propertiesToDelete = ["fir", "rel"]; // firearm, reload.

    for (const del of propertiesToDelete) {
      delete CONFIG.DND5E.weaponProperties[del];
    }
  }

  if (replaceStatusEffects) {
    // these are gotten from a different file, combined, and then sorted.
    const statusEffects = SPELL_EFFECTS.concat(STATUS_EFFECTS).sort((a, b) => {
      return a.sort - b.sort;
    });
    CONFIG.statusEffects = statusEffects;
  }
}
