import {ClassPageRenderer} from "./applications/classPages.mjs";
import {MonsterCatalog} from "./applications/monsterCatalog.mjs";
import {renderPartyFeatures} from "./applications/partyFeatures.mjs";
import {mayhem} from "./gameTools/mayhem.mjs";

export function sceneControls(array) {
  const token = array.find(a => a.name === "token");

  // Render the class page.
  token.tools.push({
    name: "class-page",
    title: "Class Pages",
    icon: "fa-solid fa-wand-magic-sparkles",
    button: true,
    visible: true,
    onClick: () => {
      const [initial] = Object.keys(game.user.character?.classes ?? {});
      return ClassPageRenderer.renderClassPages(initial ?? null);
    }
  });

  // Render the party features.
  token.tools.push({
    name: "party-features",
    title: "Party Features",
    icon: "fa-solid fa-yin-yang",
    button: true,
    visible: true,
    onClick: () => {
      return renderPartyFeatures();
    }
  });

  // Show monster catalog.
  if (game.user.isGM) token.tools.push({
    name: "monster-catalog",
    title: "Monster Catalog",
    icon: "fa-solid fa-spaghetti-monster-flying",
    button: true,
    visible: true,
    onClick: () => MonsterCatalog.renderMonsterCatalog()
  });

  // Show Mayhem dialog.
  if (game.user.isGM) token.tools.push({
    name: "mayhem-dialog",
    title: "Mayhem",
    icon: "fa-solid fa-poo-storm",
    button: true,
    visible: true,
    onClick: () => {
      return mayhem();
    }
  });
}