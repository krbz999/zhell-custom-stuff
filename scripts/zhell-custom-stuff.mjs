import { MODULE_NAME, SETTING_NAMES } from "./const.mjs";

export class ZHELL {
	static toggleLR = async (bool) => {
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR) : !bool;
		await game.settings.set(MODULE_NAME, SETTING_NAMES.TOGGLE_LR, !currentValue);
		return game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR);
	};
	
	static toggleSR = async (bool) => {
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR) : !bool;
		await game.settings.set(MODULE_NAME, SETTING_NAMES.TOGGLE_SR, !currentValue);
		return game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR);
	};
}

// disable long rest.
Hooks.on("renderLongRestDialog", (dialog, html, data) => {
	const restDisabled = game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR);
	if(!restDisabled) return;
	data.buttons.rest.callback = () => {
		ui.notifications.info("You cannot take a long rest.");
	};
});

// disable long rest.
Hooks.on("renderShortRestDialog", (dialog, html, data) => {
	const restDisabled = game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR);
	if(!restDisabled) return;
	data.buttons.rest.callback = () => {
		ui.notifications.info("You cannot take a short rest.");
	};
});

Hooks.on("ready", () => {
	// add more consumable types
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_CONSUMABLE_TYPES)){
		CONFIG.DND5E.consumableTypes = {
			ammo: "Ammunition",
			bomb: "Bomb",
			drink: "Drink",
			food: "Food",
			poison: "Poison",
			poisonContact: "Contact Poison",
			poisonIngested: "Ingested Poison",
			poisonInhaled: "Inhaled Poison",
			poisonInjury: "Injury Poison",
			potion: "Potion",
			potionTonic: "Tonic",
			potionSalve: "Salve",
			potionPill: "Pill",
			potionWine: "Wine",
			scroll: "Scroll",
			trap: "Trap",
			trinket: "Trinket",
			elixir: "Elixir"
		};
	}
	
	// add more equipment types
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_EQUIPMENT_TYPES)){
		CONFIG.DND5E.equipmentTypes["wand"] = "Wand";
		CONFIG.DND5E.miscEquipmentTypes["wand"] = "Wand";
	}
	
	// add new spell school
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_SPELL_SCHOOL)){
		CONFIG.DND5E.spellSchools["divine"] = "Divine";
	}
	
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_CONDITIONS)){
		CONFIG.DND5E.conditionTypes["turned"] = "Turned";
	}
	
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_LANGUAGES)){
		CONFIG.DND5E.languages = {
			common: "Common",
			aarakocra: "Aarakocra",
			draconic: "Draconic",
			dwarvish: "Dwarvish",
			elvish: "Elvish",
			infernal: "Infernal",
			leonin: "Leonin",
			orc: "Orcish",
			abyssal: "Abyssal",
			celestial: "Celestial",
			primordial: "Primordial",
			aquan: "Aquan",
			auran: "Auran",
			ignan: "Ignan",
			terran: "Terran",
			sylvan: "Sylvan",
			ancient: "Ancient Common",
			undercommon: "Undercommon",
			cant: "Thieves' Cant",
			druidic: "Druidic"
		};
	}
	
	// replace tools
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_TOOLS)){
	
		/*CONFIG.DND5E.toolTypes = {
			...CONFIG.DND5E.toolTypes,
			other: "Other Tools"
		};
		
		CONFIG.DND5E.toolProficiencies = {
			...CONFIG.DND5E.toolProficiencies,
			other: "Other Tools"
		};*/
		
		CONFIG.DND5E.toolIds = {
			guiro: "zhell-custom-stuff.catalog-of-items.0bn6X8GmJPTb8kee",
			glaur: "zhell-custom-stuff.catalog-of-items.0gATC04WyH4JrPWg",
			brewer: "zhell-custom-stuff.catalog-of-items.0hLh5UuEiqAHFNGy",
			painter: "zhell-custom-stuff.catalog-of-items.2cPulLXT5TlYeGdj",
			dulcimer: "zhell-custom-stuff.catalog-of-items.3hpOtqloLx29dW9x",
			lute: "zhell-custom-stuff.catalog-of-items.44YtLQgKSkCzK8v9",
			alchemist: "zhell-custom-stuff.catalog-of-items.4tStn8Ym5IHOZMEn",
			thief: "zhell-custom-stuff.catalog-of-items.7PPZlSR6IpQ4Mvvv",
			ukulele: "zhell-custom-stuff.catalog-of-items.8TVfL7rU2IOAnbmk",
			leatherworker: "zhell-custom-stuff.catalog-of-items.8rI5F0h572rFImET",
			calligrapher: "zhell-custom-stuff.catalog-of-items.9A3m86BsFcK3kyuk",
			tinker: "zhell-custom-stuff.catalog-of-items.ASonPC97y4IGqIfO",
			drum: "zhell-custom-stuff.catalog-of-items.BLkHLSjSAg11Irgd",
			herb: "zhell-custom-stuff.catalog-of-items.Bk0BYIgrgb3WMqj7",
			smith: "zhell-custom-stuff.catalog-of-items.CFQ2BiMfssksd9O3",
			dice: "zhell-custom-stuff.catalog-of-items.EsX0MGofFkxs7gvD",
			panflute: "zhell-custom-stuff.catalog-of-items.FfHnUw4L7R2FM6P5",
			weaver: "zhell-custom-stuff.catalog-of-items.G0xhjVpUygYbCUue",
			forg: "zhell-custom-stuff.catalog-of-items.HGwOzsIewhia3L3n",
			tocken: "zhell-custom-stuff.catalog-of-items.JReT6EKOgEeYRpMt",
			wargong: "zhell-custom-stuff.catalog-of-items.Jki4OaxHOBC3HETT",
			viol: "zhell-custom-stuff.catalog-of-items.M6bLWTHz021Bz61B",
			glassblower: "zhell-custom-stuff.catalog-of-items.OcB7ewGkA84DOQHp",
			mason: "zhell-custom-stuff.catalog-of-items.Q7S6lUvCHfPNaCNx",
			concertina: "zhell-custom-stuff.catalog-of-items.US8qotundpdkpU0X",
			shawm: "zhell-custom-stuff.catalog-of-items.XODrsxO7bonOv2uy",
			pois: "zhell-custom-stuff.catalog-of-items.XSll8MbsWEWmkdC5",
			potter: "zhell-custom-stuff.catalog-of-items.XWLsZ87NMbPa7aZq",
			woodcarver: "zhell-custom-stuff.catalog-of-items.XkkGVigtxh57Wvb2",
			navg: "zhell-custom-stuff.catalog-of-items.Zl4MTQUqNI9vqHLN",
			recorder: "zhell-custom-stuff.catalog-of-items.bT9cbtnneRrHcoHY",
			cook: "zhell-custom-stuff.catalog-of-items.eXTMqIA8scnGoKMi",
			whistlestick: "zhell-custom-stuff.catalog-of-items.jNfLEw1hydqd6gFV",
			zulkoon: "zhell-custom-stuff.catalog-of-items.kLrbRKBnNatsGTjH",
			lyre: "zhell-custom-stuff.catalog-of-items.kacmOU2zKEnqOjoz",
			horn: "zhell-custom-stuff.catalog-of-items.lGg5FEecUJx8jvAs",
			jeweler: "zhell-custom-stuff.catalog-of-items.mRFujgFSiyNaHIED",
			thelarr: "zhell-custom-stuff.catalog-of-items.pOlph5kKSqAO6Jvh",
			flute: "zhell-custom-stuff.catalog-of-items.q1Kts9CfnofRKbXy",
			longhorn: "zhell-custom-stuff.catalog-of-items.qASPf4BtC2c4AEPB",
			cartographer: "zhell-custom-stuff.catalog-of-items.qByp9O1TXmmvZZlw",
			disg: "zhell-custom-stuff.catalog-of-items.qJAan3e7Q3VerBPl",
			bagpipes: "zhell-custom-stuff.catalog-of-items.s40QkYXMkoc78pnX",
			chess: "zhell-custom-stuff.catalog-of-items.sXYKYV74alW1rSZX",
			harp: "zhell-custom-stuff.catalog-of-items.tfEjBgVmyoE394Nj",
			yarting: "zhell-custom-stuff.catalog-of-items.wVJXpPGzTlETZ3MR",
			cobbler: "zhell-custom-stuff.catalog-of-items.wYitL12DbabCoAJe",
			tantan: "zhell-custom-stuff.catalog-of-items.x0MtEjLGydd5MHcf",
			card: "zhell-custom-stuff.catalog-of-items.xpcEdLZpuwatrD1g",
			carpenter: "zhell-custom-stuff.catalog-of-items.zSyPecV8GvlwRBnb",
		};
	}

	// replace weapons
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_WEAPONS)){
	
		CONFIG.DND5E.weaponIds = {
			battleaxe: "zhell-custom-stuff.catalog-of-items.5YvvZ5KsGgzlVBJg",
			blowgun: "zhell-custom-stuff.catalog-of-items.7mIrXgEFREdCZoq6",
			club: "zhell-custom-stuff.catalog-of-items.u2OfOMTYwv7xC3E7",
			dagger: "zhell-custom-stuff.catalog-of-items.36WDepHXSrp9qxtZ",
			dart: "zhell-custom-stuff.catalog-of-items.ssBK4bfm1gx3Q9Fo",
			falchion: "zhell-custom-stuff.catalog-of-items.bo4IjSpfdCfwQ5Bu",
			flail: "zhell-custom-stuff.catalog-of-items.1emzz8v17oS9h9ex",
			glaive: "zhell-custom-stuff.catalog-of-items.pq4htSLwsFByOXg6",
			greataxe: "zhell-custom-stuff.catalog-of-items.T7cSFs9R3pGF74b3",
			greatclub: "zhell-custom-stuff.catalog-of-items.y9B7EXLlrRukmCNw",
			greatsword: "zhell-custom-stuff.catalog-of-items.KXtYXV1G9vpwctfQ",
			halberd: "zhell-custom-stuff.catalog-of-items.NcZKj1Re9XxUJHYS",
			handcrossbow: "zhell-custom-stuff.catalog-of-items.tq2IZWhRwEpoJCLN",
			handaxe: "zhell-custom-stuff.catalog-of-items.zR4BtcctYAOWE7KN",
			heavycrossbow: "zhell-custom-stuff.catalog-of-items.zQX0nUPFKzAmWfVP",
			javelin: "zhell-custom-stuff.catalog-of-items.JW3iiWOeLeHfMCQW",
			lance: "zhell-custom-stuff.catalog-of-items.BzVHGLVLnYXcQGAN",
			lightcrossbow: "zhell-custom-stuff.catalog-of-items.sNVv0zBflAVdfLya",
			lighthammer: "zhell-custom-stuff.catalog-of-items.8nRG9Jf9u1P8qw4N",
			longbow: "zhell-custom-stuff.catalog-of-items.uplzusJQ5sTMsJOg",
			longsword: "zhell-custom-stuff.catalog-of-items.dNMYjSSffEzglwww",
			mace: "zhell-custom-stuff.catalog-of-items.fECMzleaJX8fqZvG",
			maul: "zhell-custom-stuff.catalog-of-items.wcVsUIcWNasTeZGU",
			morningstar: "zhell-custom-stuff.catalog-of-items.q4HPiLX1kDF47XKd",
			net: "zhell-custom-stuff.catalog-of-items.UKZi1Zva5aIhyTc2",
			pike: "zhell-custom-stuff.catalog-of-items.aUze6i3qVTpNnCnR",
			quarterstaff: "zhell-custom-stuff.catalog-of-items.oPTWor277Kok0ETq",
			rapier: "zhell-custom-stuff.catalog-of-items.yYDQyDeLgwENSebw",
			scimitar: "zhell-custom-stuff.catalog-of-items.lHPyj9lRxx7gLchp",
			shortbow: "zhell-custom-stuff.catalog-of-items.2r5SFrkBL39wxTas",
			shortsword: "zhell-custom-stuff.catalog-of-items.7ixPiAumqBjKBU5u",
			sickle: "zhell-custom-stuff.catalog-of-items.sTlhgLxyWg76c1MB",
			sling: "zhell-custom-stuff.catalog-of-items.Aa3xDhMzueybrODT",
			spear: "zhell-custom-stuff.catalog-of-items.03SkVtPAOdoK6BWB",
			trident: "zhell-custom-stuff.catalog-of-items.z8lUzt9KwtyksYO9",
			warpick: "zhell-custom-stuff.catalog-of-items.evvPCgenUmPXFSb0",
			warhammer: "zhell-custom-stuff.catalog-of-items.YZzXPxRgpYcPh61M",
			whip: "zhell-custom-stuff.catalog-of-items.KGH7gJe5mvpbRoFZ"
		};

		
		CONFIG.DND5E.weaponProperties = {
			ada: "Adamantine",
			amm: "Ammunition",
			fin: "Finesse",
			foc: "Focus",
			hvy: "Heavy",
			lgt: "Light",
			lod: "Loading",
			mgc: "Magical",
			rch: "Reach",
			ret: "Returning",
			sil: "Silvered",
			spc: "Special",
			thr: "Thrown",
			two: "Two-Handed",
			ver: "Versatile"
		};
	}
	
	// replace vehicle types
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_VEHICLES)){
		//CONFIG.DND5E.vehicleTypes["chariot"] = "Chariot";
	}
		
	// replace armors and shields
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_ARMORS)){
		//CONFIG.DND5E.armorIds = {
		//	...CONFIG.DND5E.armorIds,
		//	buckler: "zhell-custom-stuff.base-items.ARQF1JAl7FNMam8T",
		//	kite: "zhell-custom-stuff.base-items.vJR8L6fxQI34u7of",
		//	bulwark: "zhell-custom-stuff.base-items.fuxvJ7oNJx4v1ZlP"
		//};
	}
});

Hooks.once("setup", () => {
	// add piety ability
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ABILITY_SCORES)){
		CONFIG.DND5E.abilities["pty"] = "Piety";
		CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
	}
	
	// remove some default character flags
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REMOVE_SPECIAL_TRAITS)){
		const flags = CONFIG.DND5E.characterFlags;
		
		delete flags.diamondSoul;
		delete flags.observantFeat;
		delete flags.initiativeAlert;
	}
});

Hooks.on("renderActorSheet5e", (sheet, html, sheetData) => {
	// remove resources from the character sheet.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REMOVE_SHEET_RESOURCES)){
		const resources = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul");
		if(resources) resources.remove();
	}
	
	// minor edits to the sheet.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.MINOR_SHEET_EDITS)){
		// change 'S. Rest' and 'L. Rest' to 'SR' and 'LR'.
		const SR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.short-rest");
		const LR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.long-rest");
		if(SR) SR.innerHTML = "SR";
		if(LR) LR.innerHTML = "LR";
	}
	
	// replace currency converter with a lock/unlock feature.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.SHEET_UNLOCKER)){
		/* Get locked state */
		const locked = sheet.document.getFlag(MODULE_NAME, "sheet.locked") ?? true;
		
		/* Hide delete buttons */
		const deleteButtons = html[0].querySelectorAll("a.item-control.item-delete");
		for(let el of deleteButtons) el.hidden = locked;
		
		/* Replace text with "Lock" */
		const currencyText = html[0].querySelector("section > form > section > div.tab.inventory.flexcol > div.inventory-filters.flexrow > ol > h3");
		if(currencyText) currencyText.firstChild.textContent = "Lock";
		
		/* Replace icon with lock */
		const coins = html[0].querySelector("i[class='fas fa-coins']");
		if(coins){
			coins.setAttribute("class", locked ? "fas fa-lock" : "fas fa-unlock");
			coins.setAttribute("title", "Lock/Unlock");
		}
		
		/* Replace currency converter with lock */
		const currencyRoll = html[0].querySelector("a[class='currency-convert rollable']");
		if(currencyRoll){
			currencyRoll.removeAttribute("data-action");
			currencyRoll.onclick = async () => {
				await sheet.document.setFlag(MODULE_NAME, "sheet.locked", !locked);
				sheet.render();
			}
		}
	}
});