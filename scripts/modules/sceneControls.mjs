import {renderClassPages} from "./applications/classPages.mjs";
import {renderPartyFeatures} from "./applications/partyFeatures.mjs";
import {mayhem} from "./gameTools/mayhem.mjs";

export function sceneControls(array) {
  const token = array.find(a => a.name === "token");

  // Render the class page.
  token.tools.push({
    name: "class-page",
    title: "Show Class Page",
    icon: "fa-solid fa-wand-magic-sparkles",
    button: true,
    visible: true,
    onClick: () => {
      const [initial] = Object.keys(game.user.character?.classes ?? {});
      return renderClassPages(initial ?? null);
    }
  });

  // Render the party features.
  token.tools.push({
    name: "party-features",
    title: "Show Party Features",
    icon: "fa-solid fa-yin-yang",
    button: true,
    visible: true,
    onClick: () => {
      return renderPartyFeatures();
    }
  });

  // Show Mayhem dialog.
  if(game.user.isGM) token.tools.push({
    name: "mayhem-dialog",
    title: "Show Mayhem Dialog",
    icon: "fa-solid fa-poo-storm",
    button: true,
    visible: true,
    onClick: () => {
      return mayhem();
    }
  });
}
