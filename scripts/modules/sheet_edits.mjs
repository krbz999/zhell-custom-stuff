import { MODULE_NAME } from "../const.mjs";

export class ZHELL_SHEET {
	
	static disable_long_rest = () => {
		return !game.settings.get(MODULE_NAME, "toggleLR");
	}
	
	static disable_short_rest = () => {
		return !game.settings.get(MODULE_NAME, "toggleSR");
	}

	// rename copper, etc etc, to CP, SP, EP, GP, PP.
	static rename_currency_labels = () => {
		if ( !game.settings.get(MODULE_NAME, "replacementSettings").rename_currency_labels ) return;
		for ( let d of ["cp", "ep", "gp", "pp", "sp"] ) {
			CONFIG.DND5E.currencies[d].label = d.toUpperCase();
		}
	}
	
	static remove_resources = (sheet, html, sheetData) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").remove_resources ) return;
		const resources = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul");
		if ( resources ) resources.remove();
	}
	
	static remove_alignment = (sheet, html, sheetData) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").remove_alignment ) return;
		const AL = html[0].querySelector("input[name='system.details.alignment']");
		if ( AL ) AL.parentElement?.remove();
	}
	
	static disable_initiative_button = (sheet, html, sheetData) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").disable_initiative_button ) return;
		const initButton = html[0].querySelector(".dnd5e.sheet.actor .sheet-header .attributes .attribute.initiative > h4");
		if ( initButton ) {
			initButton.classList.remove("rollable");
			initButton.removeAttribute("data-action");
		}
	}
	
	static create_forage_counter = (sheet, html, sheetData) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").create_forage_counter ) return;
		const actor = sheet.actor;
		if ( !sheetData.isCharacter ) return;
		
		const value = actor.getFlag(MODULE_NAME, "materia-medica.value") ?? 0;
		const materia = document.createElement("div");
		materia.classList.add("counter", "flexrow", "materia");
		materia.innerHTML = `
			<h4>Foraged Materials</h4>
			<div class="counter-value">
				<input
					class="material"
					name="flags.zhell-custom-stuff.materia-medica.value"
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
	}
	
	static create_dots = (sheet, html) => {
		const colorSettings = game.settings.get(MODULE_NAME, "colorSettings");
		const {limited_use_dots, spell_slot_dots} = colorSettings;
		
		// create spell slot dots.
		if ( spell_slot_dots ){
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
		if ( limited_use_dots ) {
			const itemUses = sheet.object.items.filter(i => !!i.hasLimitedUses);
			for ( let o of itemUses ) {
				const {value, max} = o.system.uses;
				if ( max === 0 ) continue;
				const itemHTML = html[0].querySelector(`.item[data-item-id='${o.id}']`);
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
		if ( spell_slot_dots || limited_use_dots ) {
			if ( sheet.listening === undefined ) {
				sheet.listening = this.dotToggle.bind(sheet.object);
				sheet.element[0].addEventListener("click", sheet.listening);
			}
			else {
				sheet.element[0].removeEventListener("click", sheet.listening);
				sheet.element[0].addEventListener("click", sheet.listening);
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
	
	static create_toggle_on_attunement_button = (sheet, html) => {
		html[0].addEventListener("click", (event) => {
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
			const item = sheet.actor.items.get(itemId);
			if ( !item ) return;
			
			if ( !!attuned ) {
				return item.update({"system.attunement": CONFIG.DND5E.attunementTypes.REQUIRED});
			}
			else if ( !!not_attuned ) {
				return item.update({"system.attunement": CONFIG.DND5E.attunementTypes.ATTUNED});
			}
		});
	}
	
	static color_magic_items = (sheet, html) => {
		const items = html[0].querySelectorAll(".items-list .item");
		for ( let i of items ) {
			const id = i.outerHTML.match(/data-item-id="(.*?)"/);
			if ( !id ) continue;
			const rarity = sheet.object.items.get(id[1]).system.rarity;
			if ( !!rarity ) i.classList.add(rarity.slugify().toLowerCase());
		}
	}
	
	static refreshColors = () => {
		// set icon colors on sheet.
		const [
			a, b, cf, ca, cna, ce, cne, cp, cnp, cap, prof, half_prof, twice_prof
		] = Object.values(game.settings.get(MODULE_NAME, "colorSettings"));
		document.documentElement.style.setProperty("--full_color", cf);
		document.documentElement.style.setProperty("--attuned_color", ca);
		document.documentElement.style.setProperty("--not_attuned_color", cna);
		document.documentElement.style.setProperty("--equipped_color", ce);
		document.documentElement.style.setProperty("--not_equipped_color", cne);
		document.documentElement.style.setProperty("--prepared_color", cp);
		document.documentElement.style.setProperty("--not_prepared_color", cnp);
		document.documentElement.style.setProperty("--always_prepared_color", cap);
		document.documentElement.style.setProperty("--color_proficient", prof);
		document.documentElement.style.setProperty("--color_half_proficient", half_prof);
		document.documentElement.style.setProperty("--color_twice_proficient", twice_prof);
		
		// set item rarity colors on sheet.
		const {
			uncommon, rare, very_rare, legendary, artifact
		} = game.settings.get(MODULE_NAME, "rarityColorSettings");
		document.documentElement.style.setProperty("--rarity-color-uncommon", uncommon);
		document.documentElement.style.setProperty("--rarity-color-rare", rare);
		document.documentElement.style.setProperty("--rarity-color-very-rare", very_rare);
		document.documentElement.style.setProperty("--rarity-color-legendary", legendary);
		document.documentElement.style.setProperty("--rarity-color-artifact", artifact);
	}

	static set_hp_color = (sheet, html) => {
		const actor = sheet.object;
		const {value, max} = actor.system.attributes.hp;
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
		html[0].querySelector(".counter.flexrow.exhaustion .counter-value input")?.setAttribute("disabled", "");
	}

	// pretty up the trait selectors.
	static pretty_trait_selector = (selector, html, context) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").pretty_trait_selector ) return;
		if ( [
			"system.traits.languages",
			"system.traits.di",
			"system.traits.dr",
			"system.traits.dv",
			"system.traits.ci"
		].includes(selector.attribute) ) {
			html[0].querySelector(".trait-list").classList.add("flexrow", "zhell-traits");
			html.css("height", "auto");
		}
		else if ( [
			"system.traits.toolProf",
			"system.traits.armorProf"
		].includes(selector.attribute) ) {
			html[0].querySelector(".trait-list").classList.add("flexcol", "zhell-profs");
			html.css("height", "auto");
			html.css("width", "auto");
		}
		else if ( [
			"system.traits.weaponProf"
		].includes(selector.attribute) ) {
			html[0].querySelector(".trait-list").classList.add("flexrow", "zhell-weapons");
			html.css("height", "auto");
			html.css("width", "auto");
		}

		selector.setPosition();
	}

	// makes headers collapsible.
	static collapsible_headers = (sheet, html) => {
		if ( !game.settings.get(MODULE_NAME, "sheetSettings").collapsible_headers ) return;

		// get the headers.
		const headers = html[0].querySelectorAll(".dnd5e .items-list .items-header h3");
		const bioHeaders = html[0].querySelectorAll(".dnd5e.sheet.actor .characteristics label");
	
		// for each header: add listener, and set initial display type.
		for ( let header of headers ) {
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
		for ( let header of bioHeaders ) {
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
