import { MODULE } from "../const.mjs";
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
  // return an array of effect ids to delete from a token's actor.
  static getDeleteIds(token, statusIds) {
    return token.actor.effects.reduce((acc, effect) => {
      const id = effect.flags.core?.statusId;
      if (statusIds.includes(id)) acc.push(effect.id);
      return acc;
    }, []);
  }

  // create effect data from status id, optionally change duration.
  static createConditionData(statusId, duration) {
    const data = foundry.utils.duplicate(CONFIG.statusEffects.find(eff => eff.id === statusId));
    delete data.id;
    delete data.sort;
    if (duration) data.duration = this.convertDurationToSeconds(duration);
    return foundry.utils.mergeObject(data, {
      "flags.core.statusId": statusId,
      label: game.i18n.localize(data.label)
    });
  }

  // gets all effects from a token's actor that have a status id from statusEffects
  static getAllCurrentConditions(token) {
    const statusIds = CONFIG.statusEffects.map(i => i.id);
    return token.actor.effects.filter(eff => {
      const statusId = eff.flags.core?.statusId;
      return statusIds.includes(statusId);
    });
  }

  // takes time and a unit and convers it to seconds.
  static convertDurationToSeconds({ time, unit }) {
    let seconds = Number(time);
    if (!time || !unit) return;
    if (unit === "seconds") return { seconds };
    else if (unit === "minutes") seconds *= 60;
    else if (unit === "hours") seconds *= 60 * 60;
    else if (unit === "days") seconds *= 60 * 60 * 24;
    else if (unit === "weeks") seconds *= 60 * 60 * 24 * 9;
    else if (unit === "months") seconds *= 60 * 60 * 24 * 9 * 3;
    else if (unit === "years") seconds *= 60 * 60 * 24 * 9 * 3 * 12;
    return { seconds };
  }

  // remove conditions from token, given a list of status ids.
  static async deleteConditionsFromTokens(tokens, statusIds) {
    return tokens.map(token => token.actor.deleteEmbeddedDocuments("ActiveEffect", this.getDeleteIds(token, statusIds)));
  }

  // create conditions on all tokens' actors given an array of conditionData objects (only applies if they do not already have it)
  static async applyConditionsToTokens(tokens, conditionDatas) {
    return tokens.map(token => {
      const conditions = conditionDatas.filter(c => {
        return !token.actor.effects.find(eff => eff.flags.core?.statusId === c.flags.core.statusId);
      });
      if (!conditions.length) return;
      return token.actor.createEmbeddedDocuments("ActiveEffect", conditions);
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
    const { resistDamage, noDamage, parts, options } = damage;

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
      await applyDamageToTokens(tokens, parts, options);
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
        await applyDamageToTokens(failedTokens, parts, options);
        if (!noDamage) {
          options.global = 0.5;
          await applyDamageToTokens(succeedTokens, parts, options);
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
      const has = [...container.querySelectorAll("[name='status-effects']")].map(n => n.value);
      const effectOptions = CONFIG.statusEffects.sort((a, b) => {
        return a.label.localeCompare(b.label);
      }).reduce((acc, { id, label }) => {
        if (has.includes(id)) return acc;
        return acc + `<option value="${id}">${game.i18n.localize(label)}</option>`;
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
          <a name="status-delete"><i class="fa-solid fa-trash"></i></a>
        </div>
      </div>`;
      DIV.innerHTML = effectForm;
    } else if (target.name === "damage-create") {
      container = target.closest("div.dialog-content").querySelector("div.damage-container");
      const damageOptions = Object.entries(CONFIG.DND5E.damageTypes).filter(([type]) => {
        return !(type in CONFIG.DND5E.physicalDamageTypes);
      }).concat(Object.entries(CONFIG.DND5E.physicalDamageTypes)).reduce((acc, [key, label]) => {
        return acc + `<option value="${key}">${label}</option>`;
      }, "");
      DIV.innerHTML = `
      <div class="form-group">
        <div class="form-fields">
          <input type="number" name="damage-value">
          <select name="damage-type">${damageOptions}</select>
          <a name="damage-delete"><i class="fa-solid fa-trash"></i></a>
        </div>
      </div>`;
    }
    container.append(...DIV.children);
  }

  static async RENDER() {
    const tokens = canvas.tokens.controlled.filter(i => !i.actor.hasPlayerOwner);

    const abilityOptions = Object.entries(CONFIG.DND5E.abilities).reduce((acc, [key, label]) => {
      return acc + `<option value="${key}">${label}</option>`;
    }, "<option value=''>&mdash;</option>");
    const template = "modules/zhell-custom-stuff/templates/dm_tool.hbs";
    const content = await renderTemplate(template, { abilityOptions });

    const d = new Dialog({
      title: "Dungeon Master Tool",
      content,
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
            const statusIds = [...html[0].querySelectorAll("[name='status-effects']")].map(i => i.value);
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
          event.target.closest("[name='status-delete'], [name='damage-delete']")?.closest("div.form-group").remove();
          d.setPosition();
        });
      }
    }, {
      width: 700,
      height: 500,
      classes: ["dialog", "gm-tool"]
    }).render(true);
  }

  static gatherDamageInputs(html) {
    const resistDamage = html[0].querySelector("#damage-resist").checked;
    const noDamage = html[0].querySelector("#damage-noDamage").checked;
    const properties = [...html[0].querySelectorAll(".weaponProperties input:checked")].map(b => b.id);


    // construct damage parts.
    const damageInputs = html[0].querySelectorAll("div.damage-container div.form-group");
    const parts = [];
    for (const damage of damageInputs) {
      const value = damage.querySelector("[name='damage-value']").value;
      const type = damage.querySelector("[name='damage-type']").value;
      parts.push([Number(value), type]);
    }
    return { resistDamage, noDamage, parts, options: { properties } };
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
    const ability = html[0].querySelector("#save-type").value;
    const targetValue = Number(html[0].querySelector("#save-dc").value);
    const targetFailures = html[0].querySelector("#save-target").checked;

    return { ability, targetValue, targetFailures };
  }
}

// dnd5e.preRollDamage.
export function _appendDataToDamageRolls(item, config) {
  const types = item.getDerivedDamageLabel().map(d => d.damageType);
  config.messageData[`flags.${MODULE}.damageTypes`] = types;
  config.messageData[`flags.${MODULE}.properties`] = Object.entries(item.system.properties ?? {}).reduce((acc, [key, bool]) => {
    if (bool) acc.push(key);
    return acc;
  }, []);
}

/**
 * TODO:
 * Somehow append damage type to each die or formula instead.
 * Currently "1d6 + 1d4" + "1d8" with two different damage types
 * will treat the '1d4' as the second damage type instead of the first.
 */
export function _addFlavorListenerToDamageRolls(message, html) {
  const isDamage = message.flags.dnd5e?.roll?.type === "damage";
  if (!isDamage) return;
  const flavor = html[0].querySelector(".flavor-text");
  if (!flavor) return;

  const types = message.flags[MODULE]?.damageTypes ?? [];
  const total = message.rolls.reduce((acc, roll) => acc += roll.total, 0);

  const totals = [[]];
  let otherSum = 0;
  for (let i = 1; i < message.rolls[0].dice.length; i++) {
    const die = message.rolls[0].dice[i];
    const tot = die.total;
    const flavor = CONFIG.DND5E.damageTypes[die.options.flavor];
    const type = flavor ? die.options.flavor : (types[i] || types[0]);
    totals.push([tot, type]);
    otherSum += tot;
  }
  totals[0] = [total - otherSum, types[0]];

  flavor.classList.add("zhell-apply-damage-flavor");
  flavor.addEventListener("click", function(event) {
    const tokens = canvas.tokens.controlled;
    const parts = foundry.utils.duplicate(totals);
    const global = event.ctrlKey ? -1 : event.shiftKey ? 0.5 : 1;
    const properties = message.flags[MODULE]?.properties ?? [];
    return ZHELL.token.applyDamage(tokens, parts, { global, properties });
  });
}

export function _gatherTokenDamageTraits(token) {
  const { dr, di, dv } = token.actor.system.traits;

  return { dr: _mapToTypes(dr), di: _mapToTypes(di), dv: _mapToTypes(dv) };

  // get all resistances from a token's actor
  function _mapToTypes({ value, custom, bypasses }) {
    const types = new Set(value);
    if (custom) {
      for (const val of custom.split(";")) {
        if (val) types.add(val);
      }
    }
    types.bypasses = bypasses ?? [];
    return types;
  }
}

// takes an array of parts and returns the damage the token's actor should take
export function calculateDamageTakenForToken(token, parts, { global = 1, properties = [] } = {}) {
  const { dr, di, dv } = _gatherTokenDamageTraits(token);

  const props = CONFIG.DND5E.physicalWeaponProperties; // ada, sil, mgc
  const phys = CONFIG.DND5E.physicalDamageTypes; // piercing, bludgeoning, slashing

  const partsModified = parts.map(([value, type]) => {
    const imm = di.has(type) && !properties.some(p => di.bypasses.has(p) && type in phys);
    const res = dr.has(type) && !properties.some(p => dr.bypasses.has(p) && type in phys);
    const vul = dv.has(type) && !properties.some(p => dv.bypasses.has(p) && type in phys);

    const mod = imm ? 0 : vul ? 2 : res ? 0.5 : 1;
    const val = Roll.safeEval(value);
    return Math.floor(val * mod * global);
  });
  return partsModified.reduce((acc, dmg) => {
    return acc + dmg;
  }, 0);
}

// applies damage to tokens' actors, given an array of damage parts
export async function applyDamageToTokens(tokens, parts, options = {}) {
  return tokens.map(token => {
    const damage = calculateDamageTakenForToken(token, parts, options);
    return token.actor.applyDamage(damage);
  });
}
