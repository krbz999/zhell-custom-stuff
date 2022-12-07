import { COLOR, MODULE, RARITY, SHEET } from "../const.mjs";
import { crafting, foraging } from "./crafting.mjs";
import { ZHELL_UTILS } from "./zhell_functions.mjs";

// hooks on renderActorSheet
export function ZHELL_SHEET(sheet, html, sheetData) {
  const {
    removeResources,
    removeAlignment,
    disableInitiativeButton,
    createForaging,
    collapsibleHeaders
  } = game.settings.get(MODULE, SHEET);

  const {
    showLimitedUses,
    showSpellSlots
  } = game.settings.get(MODULE, COLOR);

  if (removeResources) {
    html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul")?.remove();
  }

  if (removeAlignment) {
    html[0].querySelector("input[name='system.details.alignment']")?.parentElement?.remove();
  }

  if (disableInitiativeButton) {
    const initButton = html[0].querySelector(".dnd5e.sheet.actor .sheet-header .attributes .attribute.initiative > h4");
    if (initButton) {
      initButton.classList.remove("rollable");
      initButton.removeAttribute("data-action");
    }
  }

  if (createForaging && sheetData.isCharacter) {
    const actor = sheet.actor;
    const value = actor.getFlag(MODULE, "materia-medica.value") ?? 0;
    const materia = document.createElement("div");
    materia.classList.add("counter", "flexrow", "materia");
    materia.innerHTML = `
    <h4 class="rollable" data-action="foraging">Foraged Materials</h4>
    <div class="counter-value">
      <input
        class="material"
        name="flags.${MODULE}.materia-medica.value"
        type="number"
        value="${value}"
        data-dtype="Number"
        min="0"
        max="999"
        oninput="validity.valid || (value=${value})"
        placeholder="0"
      >
    </div>`;
    // insert before inspiration tracker.
    const beforeThis = html[0].querySelector(".tab.attributes.flexrow .counters div.counter.flexrow.inspiration");
    beforeThis.parentNode.insertBefore(materia, beforeThis);

    if (actor.isOwner) {
      // create listeners (black magic).
      if (sheet.zhell?.foraging === undefined) {
        foundry.utils.setProperty(sheet, "zhell.foraging", mainForaging.bind(sheet.object));
        sheet.element[0].addEventListener("click", sheet.zhell.foraging);
      } else {
        sheet.element[0].removeEventListener("click", sheet.zhell.foraging);
        sheet.element[0].addEventListener("click", sheet.zhell.foraging);
      }
    }
  }

  if (showSpellSlots) {
    Object.entries(sheet.object.system.spells ?? {}).forEach(([key, { value, max }]) => {
      const _max = html[0].querySelector(`.spell-max[data-level=${key}]`);
      if (!max || !_max) return;
      const beforeThis = _max.closest(".spell-slots");
      for (let i = max; i > 0; i--) {
        const span = document.createElement("SPAN");
        beforeThis.insertAdjacentElement("beforeBegin", span)
        if (i <= value) span.classList.add("dot");
        else span.classList.add("dot", "empty");
      }
    });
  }

  if (showLimitedUses) {
    sheet.object.items.filter(i => !!i.hasLimitedUses).forEach(o => {
      const { value, max } = o.system.uses;
      if (!max) return;
      const itemHTML = html[0].querySelector(`.item[data-item-id='${o.id}']`);
      // skip if item is hidden via filter.
      if (!itemHTML) return;
      const position = o.type === "spell" ? "beforeBegin" : "afterEnd";
      const adjacent = o.type === "spell" ? itemHTML.querySelector(".item-detail.spell-uses") : itemHTML.querySelector(".item-name");

      if (o.type !== "spell") {
        const dotContainer = document.createElement("DIV");
        dotContainer.classList.add("zhell-dots", "flexrow");
        dotContainer.innerHTML = Array.fromRange(Math.min(10, max)).reduce((acc, e) => {
          if (e < value) return acc + `<span class="dot"></span>`;
          else return acc + `<span class="dot empty"></span>`;
        }, "") + (max > 10 ? `<span class="dot ${value < max ? "empty" : ""} has-more"></span>` : "");
        adjacent.insertAdjacentElement(position, dotContainer);
      } else {
        const dotContainer = document.createElement("DIV");
        dotContainer.classList.add("zhell-dots", "flexrow");
        dotContainer.innerHTML = Array.fromRange(Math.min(5, max)).reduce((acc, e) => {
          if (e < value) return acc + `<span class="dot"></span>`;
          else return acc + `<span class="dot empty"></span>`;
        }, "") + (max > 5 ? `<span class="dot ${value < max ? "empty" : ""} has-more"></span>` : "");
        adjacent.insertAdjacentElement(position, dotContainer);
      }
    });
  }

  if (showSpellSlots || showLimitedUses) {
    if (sheet.zhell?.dottoggler === undefined) {
      foundry.utils.setProperty(sheet, "zhell.dottoggler", dotToggle.bind(sheet.object));
      sheet.element[0].addEventListener("click", sheet.zhell.dottoggler);
    } else {
      sheet.element[0].removeEventListener("click", sheet.zhell.dottoggler);
      sheet.element[0].addEventListener("click", sheet.zhell.dottoggler);
    }
  }

  // turn attunement icon into a toggle.
  if (sheet.actor.isOwner) {
    if (sheet.zhell?.attunementToggler === undefined) {
      foundry.utils.setProperty(sheet, "zhell.attunementToggler", toggleAttunement.bind(sheet.object));
      sheet.element[0].addEventListener("click", sheet.zhell.attunementToggler);
    } else {
      sheet.element[0].removeEventListener("click", sheet.zhell.attunementToggler);
      sheet.element[0].addEventListener("click", sheet.zhell.attunementToggler);
    }
  }

  // color magic items.
  if (true) {
    html[0].querySelectorAll(".items-list .item").forEach(item => {
      const id = item.dataset.itemId;
      const rarity = sheet.object.items.get(id)?.system.rarity;
      if (rarity) item.classList.add(rarity.slugify().toLowerCase());
    });
  }

  // set health color.
  if (true) {
    const { value, max } = sheet.object.system.attributes.hp;
    const nearDeath = Math.max(value, 0) / (max ?? 1) < 0.33;
    const bloodied = Math.max(value, 0) / (max ?? 1) < 0.66;

    const hp = html[0].querySelector("input[name='system.attributes.hp.value']");
    if (nearDeath) {
      hp.classList.add("near-death");
      hp.classList.remove("bloodied");
    } else if (bloodied) {
      hp.classList.remove("near-death");
      hp.classList.add("bloodied");
    } else hp.classList.remove("near-death", "bloodied");
  }

  // disable exhaustion, since that's overridden in effects.
  if (true) {
    const exh = html[0].querySelector(".counter.flexrow.exhaustion");
    if (exh) {

      // disable input.
      exh.querySelector(".counter-value input").disabled = true;

      // add class and action to h4.
      const header = exh.querySelector("h4");
      header.classList.add("rollable");
      header.setAttribute("data-action", "updateExhaustion");

      // create listeners (black magic).
      if (sheet.actor.isOwner) {
        if (sheet.zhell?.exhaustion === undefined) {
          foundry.utils.setProperty(sheet, "zhell.exhaustion", exhaustionUpdate.bind(sheet.object));
          sheet.element[0].addEventListener("click", sheet.zhell.exhaustion);
        } else {
          sheet.element[0].removeEventListener("click", sheet.zhell.exhaustion);
          sheet.element[0].addEventListener("click", sheet.zhell.exhaustion);
        }
      }
    }
  }

  // makes headers collapsible.
  if (collapsibleHeaders) {
    html[0].querySelectorAll(".dnd5e .items-list .items-header h3").forEach(header => {
      const itemHeader = header.closest(".items-header.flexrow");
      if (!itemHeader) return;
      // apply collapse class for hover effect.
      itemHeader.classList.toggle("zhell-header-collapse");
      // read from sheet whether no-create should be applied immediately.
      const applyNoCreate = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
      // initially add 'no-create' class if applicable.
      if (applyNoCreate) itemHeader.classList.toggle("no-create");
      // set up listeners to change display.
      header.addEventListener("click", () => {
        const currentDisplay = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
        foundry.utils.setProperty(sheet, `section-visibility.${header.innerText}`, !currentDisplay);
        itemHeader.classList.toggle("no-create");
      });
    });

    html[0].querySelectorAll(".dnd5e.sheet.actor .characteristics label").forEach(header => {
      // read from sheet, should be collapsed?
      const collapsed = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
      // add initial 'no-edit' class if true.
      if (collapsed) header.classList.toggle("no-edit");
      // set up listeners to toggle.
      header.addEventListener("click", () => {
        const currentDisplay = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
        foundry.utils.setProperty(sheet, `section-visibility.${header.innerText}`, !currentDisplay);
        header.classList.toggle("no-edit");
      });
    });
  }
}

// hooks on renderTraitSelector
export function ZHELL_TRAITS(selector, html) {
  const { reformatTraitSelectors } = game.settings.get(MODULE, SHEET);

  if (reformatTraitSelectors) {
    const classList = html[0].querySelector(".trait-list").classList;
    if ([
      "system.traits.languages",
      "system.traits.di",
      "system.traits.dr",
      "system.traits.dv",
      "system.traits.ci"
    ].includes(selector.attribute)) {
      classList.add("zhell-traits");
    } else if ([
      "system.traits.toolProf",
      "system.traits.armorProf"
    ].includes(selector.attribute)) {
      classList.add("zhell-profs");
    } else if ([
      "system.traits.weaponProf"
    ].includes(selector.attribute)) {
      classList.add("zhell-weapons");
    }
    html.css("width", "auto");
    selector.setPosition();
  }
}

function mainForaging(event) {
  const action = event.target.closest("[data-action=foraging]");
  if (!action) return;

  const actor = this;

  // dialog that asks to forage or craft.
  // call ZHELL.players.goForaging or .goCrafting.
  class ForageDialog extends Dialog {
    constructor(obj, options) {
      super(obj, options);
      this.object = obj.object;
    }
    get id() {
      return `${MODULE}-forage-dialog-${this.object.id}`;
    }
  }
  new ForageDialog({
    object: actor,
    title: `Materia Medica: ${actor.name}`,
    content: "Are you foraging or crafting?",
    buttons: {
      forage: {
        icon: "<i class='fa-solid fa-leaf'></i>",
        label: "Foraging",
        callback: () => foraging(actor)
      },
      craft: {
        icon: "<i class='fa-solid fa-volcano'></i>",
        label: "Crafting",
        callback: () => crafting(actor)
      }
    }
  }).render(true);
}

// bound function (this === the actor);
async function dotToggle(event) {
  const actor = this;
  const dot = event.target.closest(".dot");
  if (!dot) return;

  const itemId = event.target.closest(".item")?.dataset.itemId;
  const item = actor.items.get(itemId);
  const diff = dot.classList.contains("empty") ? 1 : -1;

  // if not item, it's a spell slot.
  if (!item) {
    const level = event.target.closest(".item-name")?.querySelector(".spell-max")?.dataset.level;
    if (!level) return;
    const value = actor.system.spells[level].value;
    return actor.update({ [`system.spells.${level}.value`]: value + diff });
  } else {
    const value = item.system.uses?.value;
    if (!Number.isNumeric(value)) return;
    return item.update({ "system.uses.value": value + diff });
  }
}

function toggleAttunement(event) {
  const attunement_icon = event.target?.closest(".item-detail.attunement");
  if (!attunement_icon) return;

  // item attuned or nah.
  const attuned = attunement_icon.querySelector(".attuned");
  const not_attuned = attunement_icon.querySelector(".not-attuned");
  if (!attuned && !not_attuned) return;

  // get item id.
  const itemId = attunement_icon.closest(".item").dataset.itemId;
  if (!itemId) return;

  // get the item.
  const item = this.items.get(itemId);
  if (!item) return;

  if (!!attuned) return item.update({ "system.attunement": CONFIG.DND5E.attunementTypes.REQUIRED });
  else if (!!not_attuned) return item.update({ "system.attunement": CONFIG.DND5E.attunementTypes.ATTUNED });
  return null;
}

export function refreshColors() {
  const style = document.documentElement.style;
  // set icon colors on sheet.
  const {
    usesUnexpended,
    itemAttuned, itemNotAttuned,
    itemEquipped, itemNotEquipped,
    spellPrepared, spellNotPrepared, spellAlwaysPrepared,
    proficientNormal, proficientHalf, proficientTwice
  } = game.settings.get(MODULE, COLOR);

  style.setProperty("--usesUnexpended", usesUnexpended);
  style.setProperty("--itemAttuned", itemAttuned);
  style.setProperty("--itemNotAttuned", itemNotAttuned);
  style.setProperty("--itemEquipped", itemEquipped);
  style.setProperty("--itemNotEquipped", itemNotEquipped);
  style.setProperty("--spellPrepared", spellPrepared);
  style.setProperty("--spellNotPrepared", spellNotPrepared);
  style.setProperty("--spellAlwaysPrepared", spellAlwaysPrepared);
  style.setProperty("--proficientNormal", proficientNormal);
  style.setProperty("--proficientHalf", proficientHalf);
  style.setProperty("--proficientTwice", proficientTwice);

  // set item rarity colors on sheet.
  const {
    uncommon,
    rare,
    veryRare,
    legendary,
    artifact
  } = game.settings.get(MODULE, RARITY);

  style.setProperty("--rarityUncommon", uncommon);
  style.setProperty("--rarityRare", rare);
  style.setProperty("--rarityVeryRare", veryRare);
  style.setProperty("--rarityLegendary", legendary);
  style.setProperty("--rarityArtifact", artifact);
}

function exhaustionUpdate(event) {
  const action = event.target.closest("[data-action=updateExhaustion]");
  if (!action) return;

  const actor = this;

  // dialog that asks to up or down exhaustion.
  // call increase_ or decrease_exhaustion
  class ExhaustDialog extends Dialog {
    constructor(obj, options) {
      super(obj, options);
      this.object = obj.object;
    }
    get id() {
      return `${MODULE}-exhaust-dialog-${this.object.id}`;
    }
  }
  new ExhaustDialog({
    object: actor,
    title: `Exhaustion: ${actor.name}`,
    content: "<p>Increase or decrease your level of exhaustion.</p>",
    buttons: {
      up: {
        icon: "<i class='fa-solid fa-arrow-up'></i>",
        label: "Gain a Level",
        callback: () => ZHELL_UTILS.increase_exhaustion(actor)
      },
      down: {
        icon: "<i class='fa-solid fa-arrow-down'></i>",
        label: "Down a Level",
        callback: () => ZHELL_UTILS.decrease_exhaustion(actor)
      }
    }
  }).render(true);
}
