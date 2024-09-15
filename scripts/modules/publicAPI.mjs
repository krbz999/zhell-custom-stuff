import {BossBar} from "./applications/bossBar.mjs";
import {PartyFeatures} from "./applications/partyFeatures.mjs";
import {TreasureCreator} from "./applications/treasure-creator.mjs";
import {gameTools} from "./gameTools/_gameTools.mjs";

export default class PublicAPI {
  static init() {
    globalThis.ZHELL = {
      token: {
        multipleCombatants: PublicAPI._multipleCombatants
      },
      utils: {
        renderPartyFeatures: PartyFeatures.renderPartyFeatures,
        toggleBossBar: BossBar.toggleBossBar,
        updateBossBar: BossBar.updateBossBar,
        updateBossBarDialog: BossBar.updateBossBarDialog,
        ...gameTools
      },
      applications: {
        treasureCreator: TreasureCreator
      }
    };
  }

  /* --------------------------------- */
  /*           FUNCTIONS               */
  /* --------------------------------- */

  /**
   * Add the selected token to initiative a number of times.
   * @param {Token|TokenDocument} token     The token from whom to make combatants.
   * @param {Number} [amount=2]             The amount of combatants to create.
   * @param {object} [options={}]           Additional parameters that change the combatants.
   * @returns {Combatant[]}
   */
  static async _multipleCombatants(token, amount = 2, options = {}) {
    const data = [];
    for (let i = 0; i < amount; i++) {
      const roll = await token.actor.getInitiativeRoll().evaluate();
      data.push(foundry.utils.mergeObject({
        actorId: token.actor.id,
        defeated: false,
        hidden: false,
        initiative: roll.total,
        sceneId: token.scene.id,
        tokenId: token.id
      }, options));
    }
    return game.combat.createEmbeddedDocuments("Combatant", data);
  }

}
