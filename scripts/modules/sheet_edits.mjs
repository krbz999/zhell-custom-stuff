import { MODULE } from "../const.mjs";
import { crafting, foraging } from "./crafting.mjs";
import { ZHELL_UTILS } from "./zhell_functions.mjs";

export class ZHELL_SHEET {
    
    static disableLongRest = () => {
        return !game.settings.get(MODULE, "toggleLR");
    }
    
    static disableShortRest = () => {
        return !game.settings.get(MODULE, "toggleSR");
    }
    
    static removeResources = (sheet, html, sheetData) => {
        if ( !game.settings.get(MODULE, "sheetSettings").removeResources ) return;
        const resources = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul");
        if ( resources ) resources.remove();
    }
    
    static removeAlignment = (sheet, html, sheetData) => {
        if ( !game.settings.get(MODULE, "sheetSettings").removeAlignment ) return;
        const AL = html[0].querySelector("input[name='system.details.alignment']");
        if ( AL ) AL.parentElement?.remove();
    }
    
    static disableInitiativeButton = (sheet, html, sheetData) => {
        if ( !game.settings.get(MODULE, "sheetSettings").disableInitiativeButton ) return;
        const initButton = html[0].querySelector(".dnd5e.sheet.actor .sheet-header .attributes .attribute.initiative > h4");
        if ( initButton ) {
            initButton.classList.remove("rollable");
            initButton.removeAttribute("data-action");
        }
    }
    
    static createForaging = (sheet, html, sheetData) => {
        if ( !game.settings.get(MODULE, "sheetSettings").createForaging ) return;
        const actor = sheet.actor;
        if ( !sheetData.isCharacter ) return;
        
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
            </div>
        `;
        // insert before inspiration tracker.
        const beforeThis = html[0].querySelector(".tab.attributes.flexrow .counters div.counter.flexrow.inspiration");
        beforeThis.parentNode.insertBefore(materia, beforeThis);

        // create listeners (black magic).
        if ( sheet.foraging === undefined ) {
            sheet.foraging = this.mainForaging.bind(sheet.object);
            sheet.element[0].addEventListener("click", sheet.foraging);
        } else {
            sheet.element[0].removeEventListener("click", sheet.foraging);
            sheet.element[0].addEventListener("click", sheet.foraging);
        }
    }

    static mainForaging(event){
        const action = event.target.closest("[data-action=foraging]");
        if ( !action ) return;

        const actor = this;

        // dialog that asks to forage or craft.
        // call ZHELL.players.goForaging or .goCrafting.
        class ForageDialog extends Dialog {
            constructor(obj, options){
                super(obj, options);
                this.object = obj.object;
            }
            get id(){
                return `${MODULE}-forage-dialog-${this.object.id}`;
            }
        }
        new ForageDialog({
            object: actor,
            title: `Materia Medica: ${actor.name}`,
            content: '<p>Are you foraging or crafting?</p>',
            buttons: {
                forage: {
                    icon: '<i class="fas fa-leaf"></i>',
                    label: "Foraging",
                    callback: () => foraging(actor)
                },
                craft: {
                    icon: '<i class="fas fa-volcano"></i>',
                    label: "Crafting",
                    callback: () => crafting(actor)
                }
            }
        }).render(true);
    }
    
    static createDots = (sheet, html) => {
        const colorSettings = game.settings.get(MODULE, "colorSettings");
        const {showLimitedUses, showSpellSlots} = colorSettings;
        
        // create spell slot dots.
        if ( showSpellSlots ){
            const options = ["pact", "spell1", "spell2", "spell3", "spell4",
                "spell5", "spell6", "spell7", "spell8", "spell9"];
            const data = sheet.object.system.spells;
            for ( let o of options ) {
                const max = html[0].querySelector(`.spell-max[data-level=${o}]`);
                if ( !max ) continue;
                const beforeThis = max.closest(".spell-slots");
                if ( data[o].max === 0 ) continue;
                for ( let i = data[o].max; i > 0; i-- ) {
                    let span = document.createElement("SPAN");
                    beforeThis.insertAdjacentElement("beforeBegin", span)
                    if ( i <= data[o].value ) span.classList.add("dot");
                    else span.classList.add("dot", "empty");
                }
            }
        }
        
        // create limited use dots.
        if ( showLimitedUses ) {
            const itemUses = sheet.object.items.filter(i => !!i.hasLimitedUses);
            for ( let o of itemUses ) {
                const {value, max} = o.system.uses;
                if ( max === 0 ) continue;
                const itemHTML = html[0].querySelector(`.item[data-item-id='${o.id}']`);
                // skip if item is hidden via filter.
                if ( !itemHTML ) continue;
                const position = o.type === "spell" ? "beforeBegin" : "afterEnd";
                const adjacent = o.type === "spell" ? itemHTML.querySelector(".item-detail.spell-uses") : itemHTML.querySelector(".item-name");

                if ( o.type !== "spell" ) {
                    const dotContainer = document.createElement("DIV");
                    dotContainer.classList.add("zhell-dots", "flexrow");
                    dotContainer.innerHTML = Array.fromRange(Math.min(10, max)).reduce((acc, e) => {
                        if ( e < value ) return acc + `<span class="dot"></span>`;
                        else return acc + `<span class="dot empty"></span>`;
                    }, ``) + (max > 10 ? `<span class="dot ${value < max ? "empty" : ""} has-more"></span>` : "");
                    adjacent.insertAdjacentElement(position, dotContainer);
                }
                else {
                    const dotContainer = document.createElement("DIV");
                    dotContainer.classList.add("zhell-dots", "flexrow");
                    dotContainer.innerHTML = Array.fromRange(Math.min(5, max)).reduce((acc, e) => {
                        if ( e < value ) return acc + `<span class="dot"></span>`;
                        else return acc + `<span class="dot empty"></span>`;
                    }, ``) + (max > 5 ? `<span class="dot ${value < max ? "empty" : ""} has-more"></span>` : "");
                    adjacent.insertAdjacentElement(position, dotContainer);
                }
            }
        }
        
        // create listeners (black magic).
        if ( showSpellSlots || showLimitedUses ) {
            if ( sheet.dottoggler === undefined ) {
                sheet.dottoggler = this.dotToggle.bind(sheet.object);
                sheet.element[0].addEventListener("click", sheet.dottoggler);
            } else {
                sheet.element[0].removeEventListener("click", sheet.dottoggler);
                sheet.element[0].addEventListener("click", sheet.dottoggler);
            }
        }
    }

    // bound function (this === the actor);
    static async dotToggle(event){
        const actor = this;
        const dot = event.target.closest(".dot");
        if ( !dot ) return;

        const itemId = event.target.closest(".item")?.dataset.itemId;
        const item = actor.items.get(itemId);
        const diff = dot.classList.contains("empty") ? 1 : -1;
        
        // if not item, it's a spell slot.
        if ( !item ) {
            const level = event.target.closest(".item-name")?.querySelector(".spell-max")?.dataset.level;
            if ( !level ) return;
            const value = actor.system.spells[level].value;
            return actor.update({[`system.spells.${level}.value`]: value + diff});
        }
        else {
            const {value} = item.system.uses;
            if ( value === undefined ) return;
            return item.update({"system.uses.value": value + diff});
        }
    }
    
    static attunementButtonToggle = (sheet) => {
        if ( sheet.attunementToggler === undefined ) {
            sheet.attunementToggler = this.toggleAttunement.bind(sheet.object);
            sheet.element[0].addEventListener("click", sheet.attunementToggler);
        } else {
            sheet.element[0].removeEventListener("click", sheet.attunementToggler);
            sheet.element[0].addEventListener("click", sheet.attunementToggler);
        }
    }

    static toggleAttunement(event){
        const attunement_icon = event.target?.closest(".item-detail.attunement");
        if ( !attunement_icon ) return;
        
        // item attuned or nah.
        const attuned = attunement_icon.querySelector(".attuned");
        const not_attuned = attunement_icon.querySelector(".not-attuned");
        if ( !attuned && !not_attuned ) return;
        
        // get item id.
        const itemId = attunement_icon.closest(".item").dataset.itemId;
        if ( !itemId ) return;
        
        // get the item.
        const item = this.items.get(itemId);
        if ( !item ) return;
        
        if ( !!attuned ) {
            return item.update({"system.attunement": CONFIG.DND5E.attunementTypes.REQUIRED});
        }
        else if ( !!not_attuned ) {
            return item.update({"system.attunement": CONFIG.DND5E.attunementTypes.ATTUNED});
        }
    }
    
    static colorMagicItems = (sheet, html) => {
        const items = html[0].querySelectorAll(".items-list .item");
        for ( let item of items ) {
            const id = item.dataset.itemId;
            if ( !id ) continue;
            const rarity = sheet.object.items.get(id).system.rarity;
            if ( rarity ) item.classList.add(rarity.slugify().toLowerCase());
        }
    }
    
    static refreshColors = () => {
        const style = document.documentElement.style;
        // set icon colors on sheet.
        const {
            usesUnexpended,
            itemAttuned, itemNotAttuned,
            itemEquipped, itemNotEquipped,
            spellPrepared, spellNotPrepared, spellAlwaysPrepared,
            proficientNormal, proficientHalf, proficientTwice
        } = game.settings.get(MODULE, "colorSettings");
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
            uncommon, rare, veryRare, legendary, artifact
        } = game.settings.get(MODULE, "rarityColorSettings");
        style.setProperty("--rarityUncommon", uncommon);
        style.setProperty("--rarityRare", rare);
        style.setProperty("--rarityVeryRare", veryRare);
        style.setProperty("--rarityLegendary", legendary);
        style.setProperty("--rarityArtifact", artifact);
    }

    static setHealthColor = (sheet, html) => {
        const { value, max } = sheet.object.system.attributes.hp;
        const nearDeath = (Math.abs(value) ?? 0)/(max ?? 1) < 0.33;
        const bloodied = (Math.abs(value) ?? 0)/(max ?? 1) < 0.66;
        
        const hp = html[0].querySelector("input[name='system.attributes.hp.value']");
        if ( nearDeath ) {
            hp.classList.add("near-death");
            hp.classList.remove("bloodied");
        }
        else if ( bloodied ) {
            hp.classList.remove("near-death");
            hp.classList.add("bloodied");
        }
        else {
            hp.classList.remove("near-death");
            hp.classList.remove("bloodied");
        }
    }

    // disable exhaustion, since that's overridden in effects.
    static disable_exhaustion = (sheet, html) => {
        const exh = html[0].querySelector(".counter.flexrow.exhaustion");
        if ( !exh ) return;
        
        // disable input.
        exh.querySelector(".counter-value input").disabled = true;

        // add class and action to h4.
        const header = exh.querySelector("h4");
        header.classList.add("rollable");
        header.setAttribute("data-action", "updateExhaustion");

        // create listeners (black magic).
        if ( sheet.exhaustion === undefined ) {
            sheet.exhaustion = this.exhaustionUpdate.bind(sheet.object);
            sheet.element[0].addEventListener("click", sheet.exhaustion);
        } else {
            sheet.element[0].removeEventListener("click", sheet.exhaustion);
            sheet.element[0].addEventListener("click", sheet.exhaustion);
        }
    }

    static exhaustionUpdate(event){
        const action = event.target.closest("[data-action=updateExhaustion]");
        if ( !action ) return;

        const actor = this;

        // dialog that asks to up or down exhaustion.
        // call increase_ or decrease_exhaustion
        class ExhaustDialog extends Dialog {
            constructor(obj, options){
                super(obj, options);
                this.object = obj.object;
            }
            get id(){
                return `${MODULE}-exhaust-dialog-${this.object.id}`;
            }
        }
        new ExhaustDialog({
            object: actor,
            title: `Exhaustion: ${actor.name}`,
            content: '<p>Increase or decrease your level of exhaustion.</p>',
            buttons: {
                up: {
                    icon: '<i class="fas fa-arrow-up"></i>',
                    label: "Gain a Level",
                    callback: () => ZHELL_UTILS.increase_exhaustion(actor)
                },
                down: {
                    icon: '<i class="fas fa-arrow-down"></i>',
                    label: "Down a Level",
                    callback: () => ZHELL_UTILS.decrease_exhaustion(actor)
                }
            }
        }).render(true);
    }

    // pretty up the trait selectors.
    static reformatTraitSelectors = (selector, html, context) => {
        if ( !game.settings.get(MODULE, "sheetSettings").reformatTraitSelectors ) return;
        const classList = html[0].querySelector(".trait-list").classList;
        if ( [
            "system.traits.languages",
            "system.traits.di",
            "system.traits.dr",
            "system.traits.dv",
            "system.traits.ci"
        ].includes(selector.attribute) ) {
            classList.add("zhell-traits");
        }
        else if ( [
            "system.traits.toolProf",
            "system.traits.armorProf"
        ].includes(selector.attribute) ) {
            classList.add("zhell-profs");
        }
        else if ( [
            "system.traits.weaponProf"
        ].includes(selector.attribute) ) {
            classList.add("zhell-weapons");
        }
        html.css("width", "auto");
        selector.setPosition();
    }

    // makes headers collapsible.
    static collapsibleHeaders = (sheet, html) => {
        if ( !game.settings.get(MODULE, "sheetSettings").collapsibleHeaders ) return;

        // get the headers.
        const headers = html[0].querySelectorAll(".dnd5e .items-list .items-header h3");
        const bioHeaders = html[0].querySelectorAll(".dnd5e.sheet.actor .characteristics label");
    
        // for each header: add listener, and set initial display type.
        for ( const header of headers ) {
            const itemHeader = header.closest(".items-header.flexrow");
            if ( !itemHeader ) continue;

            // apply collapse class for hover effect.
            itemHeader.classList.toggle("zhell-header-collapse");
            
            // read from sheet whether no-create should be applied immediately.
            const applyNoCreate = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
            
            // initially add 'no-create' class if applicable.
            if ( applyNoCreate ) itemHeader.classList.toggle("no-create");
    
            // set up listeners to change display.
            header.addEventListener("click", (event) => {
                const currentDisplay = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
                foundry.utils.setProperty(sheet, `section-visibility.${header.innerText}`, !currentDisplay);
                itemHeader.classList.toggle("no-create");
            });
        }
        for ( const header of bioHeaders ) {
            // read from sheet, should be collapsed?
            const collapsed = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
            // add initial 'no-edit' class if true.
            if ( collapsed ) header.classList.toggle("no-edit");
            // set up listeners to toggle.
            header.addEventListener("click", (event) => {
                const currentDisplay = foundry.utils.getProperty(sheet, `section-visibility.${header.innerText}`);
                foundry.utils.setProperty(sheet, `section-visibility.${header.innerText}`, !currentDisplay);
                header.classList.toggle("no-edit");
            });
        }
    }
}
