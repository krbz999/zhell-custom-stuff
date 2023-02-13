import { COLOR, MODULE, RARITY } from "../const.mjs";
import { MateriaMedica } from "./crafting.mjs";
import { MoneySpender } from "./moneySpender.mjs";
import { EXHAUSTION } from "./zhell_functions.mjs";

// hooks on renderActorSheet
export async function ZHELL_SHEET(sheet, html, sheetData) {
  const {
    removeAlignment,
    createForaging,
    createMoneySpender,
    collapsibleHeaders
  } = game.settings.get(MODULE, "worldSettings");

  if (removeAlignment) {
    html[0].querySelector("input[name='system.details.alignment']")?.parentElement?.remove();
  }

  // color magic items.
  _setMagicItemsColor(sheet, html);

  // set health color.
  _setHealthColor(sheet, html);

  // makes headers collapsible.
  if (collapsibleHeaders) _setCollapsibleHeaders(sheet, html);

  // sheet apps and new functions.
  const isPC = sheet.document.type === "character";
  const isNPC = sheet.document.type === "npc";
  if (isPC || isNPC) _createDots(sheet, html, game.settings.get(MODULE, COLOR));
  if (isPC && createForaging) await _createForaging(sheet, html);
  if (isPC) _createExhaustion(sheet, html);
  if (isPC && createMoneySpender) _createSpendMoney(sheet, html);


  // SHEET FUNCTIONS
  if (sheet.object.isOwner && !sheet._zhell) {
    sheet._zhell = {
      _onClickDot: _onClickDot.bind(sheet.object),
      _onClickForaging: _onClickForaging.bind(sheet.object),
      _onClickExhaustion: _onClickExhaustion.bind(sheet.object),
      _onClickSpendMoney: _onClickSpendMoney.bind(sheet.object)
    }
  }

  if (sheet.isEditable) {
    html[0].querySelectorAll("[data-action]").forEach(a => a.addEventListener("click", function(event) {
      const target = event.currentTarget;
      const action = target.dataset.action;
      if (action === "foraging") return sheet._zhell._onClickForaging();
      else if (action === "updateExhaustion") return sheet._zhell._onClickExhaustion();
      else if (action === "spendMoney") return sheet._zhell._onClickSpendMoney();
      else if (action === "toggleDot") return sheet._zhell._onClickDot(target);
    }));
  }
}

export function refreshColors() {
  const style = document.documentElement.style;
  const colors = game.settings.get(MODULE, COLOR);
  const rarities = game.settings.get(MODULE, RARITY);

  style.setProperty("--usesUnexpended", colors.usesUnexpended);
  style.setProperty("--itemAttuned", colors.itemAttuned);
  style.setProperty("--itemNotAttuned", colors.itemNotAttuned);
  style.setProperty("--itemEquipped", colors.itemEquipped);
  style.setProperty("--itemNotEquipped", colors.itemNotEquipped);
  style.setProperty("--spellPrepared", colors.spellPrepared);
  style.setProperty("--spellNotPrepared", colors.spellNotPrepared);
  style.setProperty("--spellAlwaysPrepared", colors.spellAlwaysPrepared);
  style.setProperty("--proficientNormal", colors.proficientNormal);
  style.setProperty("--proficientHalf", colors.proficientHalf);
  style.setProperty("--proficientTwice", colors.proficientTwice);

  style.setProperty("--rarityUncommon", rarities.uncommon);
  style.setProperty("--rarityRare", rarities.rare);
  style.setProperty("--rarityVeryRare", rarities.veryRare);
  style.setProperty("--rarityLegendary", rarities.legendary);
  style.setProperty("--rarityArtifact", rarities.artifact);
}

function _setHealthColor(sheet, html) {
  const hp = sheet.object.system.attributes.hp;
  if (!hp) return;
  const a = (hp.value ?? 0) + (hp.temp ?? 0);
  const b = (hp.max ?? 0) + (hp.tempmax ?? 0);
  if (!b) return;
  const nearDeath = a / b < 0.33;
  const bloodied = a / b < 0.66;

  const node = html[0].querySelector("input[name='system.attributes.hp.value']");
  if (nearDeath) {
    node.classList.add("near-death");
    node.classList.remove("bloodied");
  } else if (bloodied) {
    node.classList.remove("near-death");
    node.classList.add("bloodied");
  } else node.classList.remove("near-death", "bloodied");
}

function _setMagicItemsColor(sheet, html) {
  html[0].querySelectorAll(".items-list .item").forEach(item => {
    const id = item.dataset.itemId;
    const rarity = sheet.object.items.get(id)?.system.rarity;
    if (rarity) item.classList.add(rarity.slugify().toLowerCase());
  });
}

function _setCollapsibleHeaders(sheet, html) {
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

/**
 * -------------------------------
 *         SHEET BUTTONS
 * -------------------------------
 */

async function _createForaging(sheet, html) {
  const DIV = document.createElement("DIV");
  DIV.innerHTML = await renderTemplate(`modules/${MODULE}/templates/foragingButton.hbs`, {
    name: `flags.${MODULE}.materia-medica.value`,
    value: foundry.utils.getProperty(sheet.actor, `flags.${MODULE}.materia-medica.value`) ?? 0
  });
  html[0].querySelector("div.counter.flexrow.exhaustion").after(DIV.firstChild);
}

function _createExhaustion(sheet, html) {
  const exh = html[0].querySelector(".counter.flexrow.exhaustion");
  if (!exh) return;
  exh.querySelector(".counter-value input").disabled = true;
  const header = exh.querySelector("h4");
  header.classList.add("rollable");
  header.setAttribute("data-action", "updateExhaustion");
}

function _createSpendMoney(sheet, html) {
  const converter = html[0].querySelector(".currency > h3");
  if (!converter) return;

  const template = `
  <h3>Spend
    <a data-action="spendMoney" data-tooltip="Spend Money">
      <i class="fa-solid fa-hand-holding-dollar"></i>
    </a>
  </h3>`;
  const DIV = document.createElement("DIV");
  DIV.innerHTML = template;
  converter.after(...DIV.children);
}

function _createDots(sheet, html, { showSpellSlots, showLimitedUses }) {

  if (showSpellSlots) {
    Object.entries(sheet.object.system.spells ?? {}).forEach(([key, { value, max }]) => {
      const _max = html[0].querySelector(`.spell-max[data-level=${key}]`);
      const dotContainer = document.createElement("DIV");
      dotContainer.classList.add("zhell-dots", "flexrow");
      if (!max || !_max) return;
      const beforeThis = _max.closest(".spell-slots");
      beforeThis.before(dotContainer);
      const q = 10;
      for (let i = 0; i < Math.min(q, max); i++) {
        const span = document.createElement("SPAN");
        dotContainer.appendChild(span);
        const le = i < (q - 1) || max <= q;
        const cls = le ? (i < value ? ["dot"] : ["dot", "empty"]) : (value < max ? ["dot", "empty", "has-more"] : ["dot", "has-more"]);
        span.classList.add(...cls);
        span.setAttribute("data-action", "toggleDot");
        span.setAttribute("data-spell-level", key);
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
        const q = 10;
        dotContainer.innerHTML = Array.fromRange(Math.min(q, max)).reduce((acc, e) => {
          const le = e < (q - 1) || max <= q;
          const cls = le ? (e < value ? "dot" : "dot empty") : (value < max ? "dot empty has-more" : "dot has-more");
          return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${o.id}"></span>`;
        }, "");
        adjacent.insertAdjacentElement(position, dotContainer);
      } else {
        const dotContainer = document.createElement("DIV");
        dotContainer.classList.add("zhell-dots", "flexrow");
        const q = 5;
        dotContainer.innerHTML = Array.fromRange(Math.min(q, max)).reduce((acc, e) => {
          const le = e < (q - 1) || max <= q;
          const cls = le ? (e < value ? "dot" : "dot empty") : (value < max ? "dot empty has-more" : "dot has-more");
          return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${o.id}"></span>`;
        }, "");
        adjacent.insertAdjacentElement(position, dotContainer);
      }
    });
    // items with spells
    sheet.object.items.filter(i => {
      const f = i.flags["items-with-spells-5e"]?.["item-spells"]?.length;
      const u = i.hasLimitedUses;
      return f && u;
    }).forEach(i => {
      const header = [...html[0].querySelectorAll(".items-header.spellbook-header > .item-name > h3")].find(h => {
        return h.innerText.trim() === i.name && !h.dataset.itemId;
      });
      if (!header) return;
      header.setAttribute("data-item-id", i.id);
      const DIV = document.createElement("DIV");
      DIV.classList.add("zhell-dots", "flexrow");
      const q = 5;
      const { value, max } = i.system.uses;
      DIV.innerHTML = Array.fromRange(Math.min(q, max)).reduce((acc, e) => {
        const le = e < (q - 1) || max <= q;
        const cls = le ? (e < value ? "dot" : "dot empty") : (value < max ? "dot empty has-more" : "dot has-more");
        return acc + `<span class="${cls}" data-action="toggleDot" data-item-id="${i.id}"></span>`;
      }, "");
      header.after(DIV);
    });
  }
}

/**
 * ------------------------------------
 *       SHEET APPS / TRIGGERS
 * ------------------------------------
 */

// render foraging app.
function _onClickForaging() {
  return new MateriaMedica(this, {}).render(true);
}

// render exhaustion dialog.
function _onClickExhaustion() {
  const level = this.system.attributes.exhaustion;
  const effect = {
    0: "You are not currently exhausted.",
    1: "You currently have 1 level of exhaustion.",
  }[level] ?? `You currently have ${level} levels of exhaustion.`;
  const buttons = {
    up: {
      icon: "<i class='fa-solid fa-arrow-up'></i>",
      label: "Gain a Level",
      callback: () => EXHAUSTION.increaseExhaustion(this)
    },
    down: {
      icon: "<i class='fa-solid fa-arrow-down'></i>",
      label: "Down a Level",
      callback: () => EXHAUSTION.decreaseExhaustion(this)
    }
  };
  if (level < 1) delete buttons.down;
  if (level > 10) delete buttons.up;

  return new Dialog({
    title: `Exhaustion: ${this.name}`,
    content: `
    <p>Adjust your level of exhaustion.</p>
    <p>${effect}</p>`,
    buttons
  }, {
    id: `${MODULE}-exhaustion-dialog-${this.id}`,
    classes: [MODULE, "exhaustion", "dialog"]
  }).render(true);
}

// render money spender app.
function _onClickSpendMoney() {
  return new MoneySpender({}, this).render(true);
}

async function _onClickDot(dot) {
  const { itemId, spellLevel } = dot.dataset;
  const diff = dot.classList.contains("empty") ? 1 : -1;

  if (spellLevel) {
    const path = `system.spells.${spellLevel}.value`;
    const value = foundry.utils.getProperty(this, path);
    return this.update({ [path]: value + diff });
  } else if (itemId) {
    const item = this.items.get(itemId);
    const value = item.system.uses.value;
    return item.update({ "system.uses.value": value + diff });
  }
}
