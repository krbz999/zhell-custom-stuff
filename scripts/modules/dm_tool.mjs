/** COMBINED GM TOOL FOR NPC UTILITY
 * A tool for prompting selected (not player owned) tokens for either (or all):
 * 
 * make a saving throw (and optionally target those who failed).
 * 
 * apply damage, which respects DR, DV, DI.
 * -- optionally have tokens resist the damage with a saving throw (reducing to half or zero).
 * 
 * add or remove a status condition.
 * -- optionally have the token resist with a saving throw.
 * -- also allows you to set the duration of each effect.
 */

export class DM_TOOL {

  // HELPER FUNCTIONS

  // get whether a token's actor has that condition.
  static tokenHasCondition(token, statusId) {
    const effect = token.actor.effects.find(eff => {
      const flag = eff.getFlag("core", "statusId");
      if (!flag) return false;
      return flag === statusId;
    });
    return !!effect;
  }
  // turn a statusId into an effect from the token's actor (if effect exists).
  static tokenConditionFromId(token, statusId) {
    const effect = token.actor.effects.find(eff => {
      const flag = eff.getFlag("core", "statusId");
      if (!flag) return false;
      return flag === statusId;
    });
    return effect;
  }
  // return an array of effect ids to delete from a token's actor.
  static getDeleteIds(token, statusIds) {
    const deleteIds = statusIds.filter(id => {
      return this.tokenHasCondition(token, id);
    }).map(id => {
      return this.tokenConditionFromId(token, id);
    }).map(eff => {
      return eff.id;
    });
    return deleteIds;
  }
  // create effect data from status id, optionally change duration.
  static createConditionData(statusId, duration) {
    const data = CONFIG.statusEffects.find(eff => {
      return eff.id === statusId;
    });
    const effectData = foundry.utils.duplicate(data);
    delete effectData.id;
    if (duration) {
      const dur = this.convertDurationToSeconds(duration);
      effectData.duration = dur;
    }
    foundry.utils.mergeObject(effectData, {
      flags: { core: { statusId } }
    });
    return effectData;
  }
  // gets all effects from a token's actor that have a status id from statusEffects
  static getAllCurrentConditions(token) {
    const statusIds = CONFIG.statusEffects.map(i => i.id);
    const tokenEffects = token.actor.effects;
    const conditions = tokenEffects.filter(eff => {
      const statusId = eff.getFlag("core", "statusId");
      if (!statusId) return false;
      return statusIds.includes(statusId);
    });
    return conditions;
  }
  // takes time and a unit and convers it to seconds.
  static convertDurationToSeconds({ time, unit }) {
    let seconds = Number(time);
    if (!time || !unit) return;
    if (unit === "seconds") return { seconds };
    if (unit === "minutes") seconds *= 60;
    if (unit === "hours") seconds *= 60 * 60;
    if (unit === "days") seconds *= 60 * 60 * 24;
    if (unit === "weeks") seconds *= 60 * 60 * 24 * 9;
    if (unit === "months") seconds *= 60 * 60 * 24 * 9 * 3;
    if (unit === "years") seconds *= 60 * 60 * 24 * 9 * 3 * 12;
    return { seconds };
  }
  // remove conditions from token, given a list of status ids.
  static async deleteConditionsFromTokens(tokens, statusIds) {
    return tokens.map(token => {
      const ids = this.getDeleteIds(token, statusIds);
      return token.actor.deleteEmbeddedDocuments("ActiveEffect", ids);
    });
  }

  // create conditions on all tokens' actors given an array of conditionData objects (only applies if they do not already have it)
  static async applyConditionsToTokens(tokens, conditionDatas) {
    return tokens.map(token => {
      const conditions = conditionDatas.filter(c => {
        return !this.tokenHasCondition(token, c.flags.core.statusId);
      });
      if (!conditions.length) return;
      return token.actor.createEmbeddedDocuments("ActiveEffect", conditions);
    });
  }

  // get all resistances from a token's actor
  static getResistancesFromToken(token) {
    const { value, custom } = token.actor.system.traits.dr;
    const types = new Set(value);
    if (custom) {
      for (const val of custom.split(";")) {
        if (val) types.add(val);
      }
    }
    return types;
  }
  // get all immunities from a token's actor
  static getImmunitiesFromToken(token) {
    const { value, custom } = token.actor.system.traits.di;
    const types = new Set(value);
    if (custom) {
      for (const val of custom.split(";")) {
        if (val) types.add(val);
      }
    }
    return types;
  }
  // get all resistances/immunities/vulnerabilities from a token's actor
  static getVulnerabilitiesFromToken(token) {
    const { value, custom } = token.actor.system.traits.dv;
    const types = new Set(value);
    if (custom) {
      for (const val of custom.split(";")) {
        if (val) types.add(val);
      }
    }
    return types;
  }
  // takes an array of parts and returns the damage the token's actor should take
  static calculateDamageTakenForToken(token, parts, globalModifier = 1) {
    const dr = this.getResistancesFromToken(token);
    const di = this.getImmunitiesFromToken(token);
    const dv = this.getVulnerabilitiesFromToken(token);

    const partsModified = parts.map(([value, type]) => {
      const mod = di.has(type) ? 0 : dv.has(type) ? 2 : dr.has(type) ? 0.5 : 1;
      const val = Roll.safeEval(value);
      return Math.floor(val * mod * globalModifier);
    });
    const damage = partsModified.reduce((acc, dmg) => {
      return acc + dmg;
    }, 0);
    return damage;
  }
  // applies damage to tokens' actors, given an array of damage parts
  static async applyDamageToTokens(tokens, parts) {
    return tokens.map(token => {
      const damage = this.calculateDamageTakenForToken(token, parts);
      return token.actor.applyDamage(damage);
    });
  }

  // request saving throws from tokens, and returns an array with whether they saved or not
  static async requestSavingThrowsFromTokens(tokens, { ability, targetValue, event }) {
    const results = [];
    for (const token of tokens) {
      const save = await token.actor.rollAbilitySave(ability, { event, targetValue });
      if (!save) continue;
      const success = save.total >= targetValue;
      results.push({ success, token });
    }
    return results;
  }

  static async MAIN_FUNCTION({ statusCondition = {}, damage = {}, savingThrow = {} }) {
    const tokens = canvas.tokens.controlled.filter(i => !i.actor.hasPlayerOwner);

    const { resistEffect, effectData } = statusCondition;
    const { ability, targetValue, targetFailures } = savingThrow;
    const { resistDamage, noDamage, parts } = damage;

    // is there a valid saving throw set up
    const saveNeeded = ability && targetValue;

    // apply conditions if it should not be resisted.
    const saveToResistCondition = resistEffect && saveNeeded;
    if (!saveToResistCondition) {
      await this.applyConditionsToTokens(tokens, effectData);
    }

    // apply damage if it should not be resisted.
    const saveToResistDamage = resistDamage && saveNeeded;
    if (!saveToResistDamage) {
      await this.applyDamageToTokens(tokens, parts);
    }

    // get saving throws if something should be resisted.
    if (saveNeeded) {
      const saves = await this.requestSavingThrowsFromTokens(tokens, savingThrow);
      const failedTokens = saves.filter(save => !save.success).map(save => save.token);
      const succeedTokens = saves.filter(save => save.success).map(save => save.token);

      if (saveToResistCondition) {
        await this.applyConditionsToTokens(failedTokens, effectData);
      }
      if (saveToResistDamage) {
        await this.applyDamageToTokens(failedTokens, parts);
        if (!noDamage) {
          await this.applyDamageToTokens(succeedTokens, parts, 0.5);
        }
      }
      if (targetFailures) {
        const tokenIds = failedTokens.map(token => token.id);
        game.user.updateTokenTargets(tokenIds);
      }
    }

    return true;
  }

  // creates new damage or effect row
  static createDamageOrEffectRow(event) {
    const target = event.target.closest("[name='status-create'], [name='damage-create']");
    if (!target) return;

    const DIV = document.createElement("DIV");
    let container;
    if (target.name === "status-create") {
      container = target.closest("div.dialog-content").querySelector("div.status-container");
      const effectOptions = CONFIG.statusEffects.reduce((acc, { id, label }) => {
        return acc + `<option value="${id}">${label}</option>`;
      }, "");
      const timeUnitOptions = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"].reduce((acc, e) => {
        return acc + `<option value="${e}">${e}</option>`;
      }, "<option value=''>&mdash;</option>");
      const effectForm = `
            <div class="form-group">
                <div class="form-fields">
                    <select name="status-effects">${effectOptions}</select>
                    <input type="number" name="status-time" placeholder="Duration">
                    <select name="status-units">${timeUnitOptions}</select>
                    <a name="status-delete"><i class="fas fa-trash"></i></a>
                </div>
            </div>`;
      DIV.innerHTML = effectForm;
    }
    else if (target.name === "damage-create") {
      container = target.closest("div.dialog-content").querySelector("div.damage-container");
      const damageOptions = Object.entries(CONFIG.DND5E.damageResistanceTypes).reduce((acc, [key, label]) => {
        return acc + `<option value="${key}">${label}</option>`;
      }, "");
      DIV.innerHTML = `
            <div class="form-group">
                <div class="form-fields">
                    <input type="number" name="damage-value">
                    <select name="damage-type">${damageOptions}</select>
                    <a name="damage-delete"><i class="fas fa-trash"></i></a>
                </div>
            </div>`;
    }
    container.append(...DIV.children);
  }
  // deletes a damage or effect row
  static deleteDamageOrEffectRow(event) {
    const target = event.target.closest("[name='status-delete'], [name='damage-delete']");
    if (!target) return;
    target.closest("div.form-group").remove();
  }

  static RENDER() {
    const tokens = canvas.tokens.controlled.filter(i => !i.actor.hasPlayerOwner);

    const style = `
        <style>
        form[name="gm-tool-header"] {
            gap: 5px;
            display: grid;
        }
        .gm-tool [name="gm-tool-header"] .form-group.effect {
            display: block;
        }
        .gm-tool [name="gm-tool-header"] .effect .form-fields,
        .gm-tool [name="gm-tool-header"] .damage .form-fields {
            display: grid;
            grid-template-columns: 100%;
        }
        .gm-tool [name="gm-tool-header"] .save .form-fields {
            display: grid;
            grid-template-columns: 20% 50% 20%;
            justify-content: space-between;
        }
        .gm-tool [name="gm-tool-header"] .save .form-fields .save-inputs,
        .gm-tool [name="gm-tool-header"] div.additions {
            display: grid;
            grid-template-columns: 50% 50%;
            gap: 5px;
        }
        .gm-tool [name="gm-tool-header"] .checks {
            display: grid;
            grid-template-columns: auto auto;
            align-items: center;
            justify-content: space-between;
        }
        .gm-tool [name="gm-tool-header"] .checks input[type="checkbox"] {
            margin-right: 10px;
        }
        .gm-tool .list-container {
            display: grid;
            grid-template-columns: 48% 48%;
            justify-content: space-between;
        }
        .list-container .status-container .form-group .form-fields {
            display: grid;
            grid-template-columns: 30% 30% 30% 10%;
        }
        .list-container .damage-container .form-group .form-fields {
            display: grid;
            grid-template-columns: 45% 45% 10%;
        }
        .list-container .form-group .form-fields a {
            text-align: center;
        }
        </style>`;
    const abilityOptions = Object.entries(CONFIG.DND5E.abilities).reduce((acc, [key, label]) => {
      return acc + `<option value="${key}">${label}</option>`;
    }, "<option value=''>&mdash;</option>");
    const content = `
        <form name="gm-tool-header">

            <div class="form-group save">
                <div class="form-fields">
                    <label>Saving Throw:</label>
                    <div class="save-inputs">
                        <select name="save-type">${abilityOptions}</select>
                        <input type="number" name="save-dc" placeholder="Save DC">
                    </div>
                    <div class="checks">
                        <span class="sep">Target fails:</span>
                        <input type="checkbox" name="save-target">
                    </div>
                </div>
            </div>

            <hr>
            
            <div class="additions">
            
                <div class="form-group effect">
                    <div class="form-fields">
                        <button name="status-create"><i class="fas fa-skull"></i> Add Status Effect</button>
                        <div class="checks">
                            <label for="status-resist">Resist Effects:</label>
                            <input type="checkbox" id="status-resist">
                        </div>
                    </div>
                </div>

                <div class="form-group damage">
                    <div class="form-fields">
                        <button name="damage-create"><i class="fas fa-bolt"></i> Add Damage Part</button>
                        <div class="checks">
                            <label for="damage-resist">Resist Damage:</label>
                            <input type="checkbox" id="damage-resist">
                            <label for="damage-noDamage">No Damage on Success:</label>
                            <input type="checkbox" id="damage-noDamage">
                        </div>
                    </div>
                </div>

            </div>
        </form>

        <hr>

        <form class="list-container">
            <div class="status-container">
            </div>
            <div class="damage-container">
            </div>
        </form>`;

    const d = new Dialog({
      title: "Dungeon Master Tool",
      content: style + content,
      buttons: {
        execute: {
          label: "Execute!",
          callback: async (html, event) => {
            const damage = DM_TOOL.gatherDamageInputs(html);
            const statusCondition = DM_TOOL.gatherEffectInputs(html);
            const savingThrow = DM_TOOL.gatherSavingThrowInputs(html);
            savingThrow.event = event;

            DM_TOOL.MAIN_FUNCTION({ statusCondition, damage, savingThrow });
          }
        },
        remove: {
          label: "Remove Selected Conditions",
          callback: async (html) => {
            const statusIds = DM_TOOL.gatherStatusIds(html);
            DM_TOOL.deleteConditionsFromTokens(tokens, statusIds);
          }
        },
        removeAll: {
          label: "Remove All Conditions",
          callback: async () => {
            tokens.map(token => {
              const conditions = DM_TOOL.getAllCurrentConditions(token);
              const deleteIds = conditions.map(c => c.id);
              return token.actor.deleteEmbeddedDocuments("ActiveEffect", deleteIds);
            });
          }
        }
      },
      render: (html) => {
        html[0].addEventListener("click", (event) => {
          DM_TOOL.createDamageOrEffectRow(event);
          DM_TOOL.deleteDamageOrEffectRow(event);
          d.setPosition();
        });
      }
    }, {
      width: 700,
      height: "auto",
      classes: ["dialog", "gm-tool"]
    }).render(true);
  }

  static gatherDamageInputs(html) {
    const resistDamage = html[0].querySelector("#damage-resist").checked;
    const noDamage = html[0].querySelector("#damage-noDamage").checked;

    // construct damage parts.
    const damageInputs = html[0].querySelectorAll("div.damage-container div.form-group");
    const parts = [];
    for (const damage of damageInputs) {
      const value = damage.querySelector("[name='damage-value']").value;
      const type = damage.querySelector("[name='damage-type']").value;
      parts.push([Number(value), type]);
    }
    return { resistDamage, noDamage, parts };
  }

  static gatherEffectInputs(html) {
    const resistEffect = html[0].querySelector("#status-resist").checked;

    // construct conditions.
    const effectInputs = html[0].querySelectorAll("div.status-container div.form-group");
    const effectData = [];
    for (const effect of effectInputs) {
      const statusId = effect.querySelector("[name='status-effects']").value;
      const time = effect.querySelector("[name='status-time']").value;
      const unit = effect.querySelector("[name='status-units']").value;
      const duration = (time && unit) ? { time, unit } : undefined;
      const data = this.createConditionData(statusId, duration);
      effectData.push(data);
    }
    return { resistEffect, effectData };
  }

  static gatherSavingThrowInputs(html) {
    const ability = html[0].querySelector("[name='save-type']").value;
    const targetValue = Number(html[0].querySelector("[name='save-dc']").value);
    const targetFailures = html[0].querySelector("[name='save-target']").checked;

    return { ability, targetValue, targetFailures };
  }
  // function to gather status ids to remove them from tokens
  static gatherStatusIds(html) {
    const effectSelects = html[0].querySelectorAll("[name='status-effects']");
    const statusIds = Array.from(effectSelects).map(i => i.value);
    return statusIds;
  }
}
