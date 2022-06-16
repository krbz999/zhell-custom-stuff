import { MODULE_NAME, SETTING_NAMES } from "./const.mjs";

export class ZHELL {
	static toggleLR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR) : !bool;
		await game.settings.set(MODULE_NAME, SETTING_NAMES.TOGGLE_LR, !currentValue);
		return game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR);
	};
	
	static toggleSR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR) : !bool;
		await game.settings.set(MODULE_NAME, SETTING_NAMES.TOGGLE_SR, !currentValue);
		return game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR);
	};
	
	static fromCatalog = async (catalog, entryName, object = false) => {
		const key = `zhell-custom-stuff.catalog-of-${catalog}`;
		const pack = !!game.packs.get(key) ? game.packs.get(key) : game.packs.get(catalog);
		if(!pack) return ui.notifications.warn("Pack not found.");
		const index = await pack.getIndex();
		const entry = index.getName(entryName);
		if(!entry) return ui.notifications.warn("Entry not found.");
		const entryId = entry._id;
		const entryDoc = await pack.getDocument(entryId);
		if(object) return entryDoc.toObject();
		else return entryDoc;
	};
	
	static spawnFromCatalog = async (actorName, catalog = "monsters", dummyNPC = "dummy", warpgateObjects = {}) => {
		const spawnDoc = await ZHELL.fromCatalog(catalog, actorName, false);
		if(!spawnDoc) return ui.notifications.warn("Monster not found.");
		const updatesActor = spawnDoc.toObject();
		const updatesToken = spawnDoc.data.token.toObject();
		
		// edits and merges to updates:
		delete updatesToken.actorId; // as to not overwrite the source actorId of dummy.
		mergeObject(updatesActor, warpgateObjects.updates?.actor ?? {});
		mergeObject(updatesToken, warpgateObjects.updates?.token ?? {});
		
		const updates = {
			actor: updatesActor,
			token: updatesToken,
			embedded: warpgateObjects.embedded
		}
		
		const callbackPre = async (loc, updates) => {
			const {img} = await spawnDoc.getTokenData();
			console.log("PRE", img);
			await loadTexture(img);
			updates.token.img = img;
		}
		
		const callbackPost = async (loc, tokenDoc, updates) => {
			const {img} = await spawnDoc.getTokenData();
			console.log("POST", img);
			await loadTexture(img);
			updates.token.img = img;
		}
		
		const callbacks = mergeObject({pre: callbackPre, post: callbackPost}, (warpgateObjects.callbacks ?? {}));
		const options = warpgateObjects.options ?? {};
		
		await warpgate.spawn(dummyNPC, updates, callbacks, options);
	};
	
	static mutateFromCatalog = async (actorName, catalog = "monsters", warpgateObjects = {}) => {
		const token = canvas.tokens.controlled[0];
		if(!token) return ui.notifications.warn("You have no token selected.");
		const tokenDoc = token.document;
		
		const updates = await ZHELL.fromCatalog(catalog, actorName, false);
		if(!updates) return ui.notifications.warn("Monster not found.");
		const updatesActor = updates.toObject();
		const updatesToken = updates.data.token;
		
		// handle items:
		const updatesItems = {};
		for(let item of updatesActor.items) updatesItems[item.name] = item;
		for(let item of tokenDoc.actor.toObject().items) updatesItems[item.name] = warpgate.CONST.DELETE;
		
		// handle effects:
		const updatesEffects = {};
		for(let effect of updatesActor.effects) updatesEffects[effect.label] = effect;
		for(let effect of tokenDoc.actor.effects){
			if(!effect.isTemporary) updatesEffects[effect.data.label] = warpgate.CONST.DELETE;
		}
		delete updatesActor.effects;
		delete updatesActor.items;
		
		// preload image:
		const callbackPre = async (loc, updates) => {
			const {img} = await spawnDoc.getTokenData();
			await loadTexture(img);
			updates.token.img = img;
		}
		const callbackPost = async (loc, tokenDoc, updates) => {
			const {img} = await spawnDoc.getTokenData();
			await loadTexture(img);
			updates.token.img = img;
		}
		
		// data to keep:
		const {actorLink, bar1, bar2, displayBars, displayName, disposition, elevation, lockRotation, vision} = tokenDoc.data;
		const {type} = tokenDoc.actor.data;
		
		// merge with passed objects:
		const mergeActor = mergeObject({...updatesActor, type}, (warpgateObjects.updates?.actor ?? {}));
		const mergeToken = mergeObject({...updatesToken, actorLink, bar1, bar2, displayBars, disposition, displayName, elevation, lockRotation, vision}, (warpgateObjects.updates?.token ?? {}));
		const mergeEmbedded = mergeObject({Item: updatesItems, ActiveEffect: updatesEffects}, (warpgateObjects.updates?.embedded ?? {}));
		const mergeCallbacks = mergeObject({pre: callbackPre, post: callbackPost}, (warpgateObjects.callbacks ?? {}));
		const mergeOptions = mergeObject({comparisonKeys: {ActiveEffect: "label"}, name: `Polymorph: ${actorName}`}, (warpgateObjects.options ?? {}));
		
		await warpgate.mutate(tokenDoc, {actor: mergeActor, token: mergeToken, embedded: mergeEmbedded}, mergeCallbacks, mergeOptions);	
	}
	
	// cast a spell directly from a compendium.
	static castFromCatalog = async (spellName, catalog = "spells", caster, updates = {}, rollOptions = {}) => {
		
		const parent = caster.actor ?? caster ?? canvas.tokens.controlled[0]?.actor ?? game.user.character;
		if(!parent) return ui.notifications.warn("No valid actor.");
		
		const object = await ZHELL.fromCatalog(catalog, spellName, true);
		if(!object) return ui.notifications.warn("Spell not found.");
		
		// fix for MRE:
		if(game.modules.get("mre-dnd5e")?.active){
			if(!object.flags["mre-dnd5e"]?.formulaGroups){
				const number_of_groups = object.data.damage?.parts?.length ?? 0;
				if(number_of_groups > 0){
					object.flags["mre-dnd5e"] = {formulaGroups: []};
					
					for(let i = 0; i < number_of_groups; i++){
						let label = i === 0 ? "Primary" : i === 1 ? "Secondary" : i === 2 ? "Tertiary" : "New Formula";
						object.flags["mre-dnd5e"].formulaGroups.push({formulaSet: [i], label});
					}
				}else{
					object.flags["mre-dnd5e"] = {formulaGroups: [{formulaSet: [], label: "Primary"}]};
				}
			}
		}
		
		const original = duplicate(object);
		mergeObject(object, updates);
		
		const [spell] = await parent.createEmbeddedDocuments("Item", [object], {temporary: true});
		
		// Trigger the item roll (code modified from itemacro).
		const roll = spell.hasMacro() ? await spell.executeMacro() : await spell.roll({...rollOptions, createMessage: false});
		if(!roll) return;
		
		// fix saving throw buttons to include DC and type.
		const content = roll.content;
		const template = document.createElement("template");
		template.innerHTML = content;
		const html = template.content.firstChild;
		const saveButtons = html.querySelectorAll("button[data-action=save]");
		const {spelldc, spellcasting} = parent.data.data.attributes;
		for(let saveButton of saveButtons){
			let abilityS = saveButtons[0].getAttribute("data-ability");
			let abilityL = CONFIG.DND5E.abilities[abilityS];
			saveButton.innerHTML = `Saving Throw DC ${spelldc} ${abilityL}`;
		}
		
		// update message.
		roll["flags.dnd5e.itemData"] = original;
		roll["content"] = html.outerHTML;
		
		return ChatMessage.create(roll);
	}
	
	static magicItemCast = async (spellName, level, caster, rollOptions = {}) => {
		return ZHELL.castFromCatalog(spellName, "spells", caster, {
			"data.preparation.mode": "atwill",
			"data.level": level,
			"data.components.material": false,
			"data.materials": {
				consumed: false,
				cost: 0,
				supply: 0,
				value: ""
			}
		}, rollOptions);
	}
	
	// execute an item's Item Macro if it has one, otherwise roll normally.
	static rollItemMacro = async (item, options = {}) => {
		if(item.hasMacro()){
			return await item.executeMacro(options);
		}else{
			return await item.roll(options);
		}
	}
	
	static setMateriaMedicaForagingDC = async (number) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		return game.settings.set(MODULE_NAME, SETTING_NAMES.FORAGE_DC, number);
	};
}

// disable long rest.
Hooks.on("renderLongRestDialog", (dialog, html, data) => {
	const restDisabled = game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_LR);
	if(!restDisabled) return;
	const restButton = html[0].querySelector("button[data-button='rest']");
	restButton.setAttribute("disabled", true);
});

// disable long rest.
Hooks.on("renderShortRestDialog", (dialog, html, data) => {
	const restDisabled = game.settings.get(MODULE_NAME, SETTING_NAMES.TOGGLE_SR);
	if(!restDisabled) return;
	const rollButton = html[0].querySelector("#roll-hd");
	rollButton.setAttribute("disabled", true);
	const restButton = html[0].querySelector("button[data-button='rest']");
	restButton.setAttribute("disabled", true);
});

Hooks.once("setup", () => {
	// add more consumable types.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_CONSUMABLE_TYPES)){
		CONFIG.DND5E.consumableTypes = {
			ammo: "Ammunition",
			drink: "Drink",
			food: "Food",
			poison: "Poison",
			poisonContact: "Contact Poison",
			poisonIngested: "Ingested Poison",
			poisonInhaled: "Inhaled Poison",
			poisonInjury: "Injury Poison",
			potion: "Potion",
			elixir: "Elixir",
			scroll: "Scroll",
			bomb: "Bomb",
			trap: "Trap",
			trinket: "Trinket"
		};
	}
	
	// add more equipment types.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_EQUIPMENT_TYPES)){
		CONFIG.DND5E.equipmentTypes["wand"] = "Wand";
		CONFIG.DND5E.miscEquipmentTypes["wand"] = "Wand";
	}
	
	// add new spell schools.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_SPELL_SCHOOL)){
		CONFIG.DND5E.spellSchools["divine"] = "Divine";
	}
	
	// add new condition types.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ADD_CONDITIONS)){
		CONFIG.DND5E.conditionTypes["turned"] = "Turned";
	}
	
	// change languages.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_LANGUAGES)){
		CONFIG.DND5E.languages = {
			common: "Common",
			aarakocra: "Aarakocra",
			draconic: "Draconic",
			dwarvish: "Dwarvish",
			elvish: "Elvish",
			infernal: "Infernal",
			cait: "Cait",
			orc: "Orcish",
			abyssal: "Abyssal",
			celestial: "Celestial",
			primordial: "Primordial",
			aquan: "Aquan",
			auran: "Auran",
			ignan: "Ignan",
			terran: "Terran",
			sylvan: "Sylvan",
			undercommon: "Undercommon",
			cant: "Thieves' Cant",
			druidic: "Druidic"
		};
	}
	
	// replace tools
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_TOOLS)){
		
		// pluralising gaming set and instrument:
		CONFIG.DND5E.toolTypes["game"] = "Gaming Sets";
		CONFIG.DND5E.toolTypes["music"] = "Musical Instruments";
		CONFIG.DND5E.toolProficiencies["game"] = "Gaming Sets";
		CONFIG.DND5E.toolProficiencies["music"] = "Musical Instruments";
		
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
	
	// add piety ability
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.ABILITY_SCORES)){
		CONFIG.DND5E.abilities["pty"] = "Piety";
		CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
	}
	
	// add more status effects
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REPLACE_STATUS_EFFECTS)){
		
		const {ADD, MULTIPLY, UPGRADE} = CONST.ACTIVE_EFFECT_MODES;
		
		CONFIG.statusEffects = [
			{id: "zhell_spell_bane", label: "Bane", "duration.seconds": 60,
				"flags.convenientDescription": "You subtract 1d4 from all saving throws and attack rolls.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_bane.webp",
				changes: [
					{key: "data.bonuses.abilities.save", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.msak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.mwak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.rsak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.rwak.attack", mode: ADD, value: "-1d4"}
				]
			},
			{id: "zhell_spell_bless", label: "Bless", "duration.seconds": 60,
				"flags.convenientDescription": "You add a 1d4 bonus to all saving throws and attack rolls.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_bless.webp",
				changes: [
					{key: "data.bonuses.abilities.save", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.msak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.mwak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.rsak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.rwak.attack", mode: ADD, value: "+1d4"}
				]
			},
			{id: "zhell_spell_speed_haste", label: "Haste", "duration.seconds": 60,
				"flags.convenientDescription": "Your movement speed is doubled, you have +2 to AC, and you have advantage on Dexterity saving throws.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_haste.webp",
				changes: [
					{key: "data.attributes.ac.bonus", mode: ADD, value: '+2'},
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "2"}
				]
			},
			{id: "zhell_spell_speed_slow", label: "Slow", "duration.seconds": 60,
				"flags.convenientDescription": "Your movement speed is halved, and you subtract 2 from your AC and Dexterity saving throws.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_slowed.webp",
				changes: [
					{key: "data.attributes.ac.bonus", mode: ADD, value: "-2"},
					{key: "data.abilities.dex.bonuses.save", mode: ADD, value: "-2"},
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: ".5"}
				]
			},
			{id: "zhell_condition_sense_blind", label: "Blinded",
				"flags.convenientDescription": "You cannot see, and you automatically fail any ability check that requires sight. Attack rolls against you have advantage, and your attack rolls have disadvantage.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_blinded.webp"
			},
			{id: "zhell_condition_charm", label: "Charmed",
				"flags.convenientDescription": "You cannot attack the charmer or target them with harmful abilities or magical effects; the charmer has advantage on any ability check to interact socially with you.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_charmed.webp"
			},
			{id: "dead", label: "Dead",
				"flags.convenientDescription": "You are dead.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/skull.webp"
			},
			{id: "zhell_condition_sense_deaf", label: "Deafened",
				"flags.convenientDescription": "You cannot hear and automatically fail any ability check that requires hearing.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_deafened.webp"
			},
			{id: "zhell_condition_sense_mute", label: "Muted",
				"flags.convenientDescription": "You cannot speak, cannot cast spells with a verbal component, and you automatically fail any ability check that requires speech.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_muted.webp"
			},
			{id: "zhell_condition_fear", label: "Frightened",
				"flags.convenientDescription": "You have disadvantage on all attack rolls and ability checks while the source of your fear is within your line of sight. You cannot willingly move closer to the source of your fear.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_frightened.webp"
			},
			{id: "zhell_condition_move_grappled", label: "Grappled",
				"flags.convenientDescription": "Your speed is 0.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_grappled.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{id: "zhell_condition_incapacitated", label: "Incapacitated",
				"flags.convenientDescription": "You cannot take actions or reactions.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_incapacitated.webp"
			},
			{id: "zhell_condition_invisible", label: "Invisible",
				"flags.convenientDescription": "You are impossible to see, and are considered heavily obscured. Attack rolls against you have disadvantage, and your attack rolls have advantage.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_invisible.webp"
			},
			{id: "zhell_condition_paralysis", label: "Paralyzed",
				"flags.convenientDescription": "You are incapacitated, cannot move or speak, automatically fail Strength and Dexterity saving throws, attack rolls against you have advantage, and any attacks against you is a critical hit if the attacker is within 5 feet of you.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_paralyzed.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{id: "zhell_condition_petrified", label: "Petrified", 
				"flags.convenientDescription": "You are inanimate, incapacitated, unaware of your surroundings, your weight is increased by a factor of ten, you cannot move or speak, attack rolls against you have advantage, and you automatically fail all Strength and Dexterity saving throws. You have resistance to all damage, and you are immune to poison and disease.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_petrified.webp"
			},
			{id: "zhell_condition_poison", label: "Poisoned",
				"flags.convenientDescription": "You have disadvantage on all attack rolls and ability checks.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_poisoned.webp"
			},
			{id: "zhell_condition_prone", label: "Prone",
				"flags.convenientDescription": "You can only crawl unless you expend half your movement to stand up. You have disadvantage on attack rolls, and any attack roll has advantage against you if the attacker is within 5 feet of you, it otherwise has disadvantage.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_prone.webp"
			},
			{id: "zhell_condition_move_restrain", label: "Restrained", 
				"flags.convenientDescription": "Your speed is 0, attack rolls against you have advantage, and your attack rolls have disadvantage. You have disadvantage on Dexterity saving throws.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_restrained.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{id: "zhell_condition_stun", label: "Stunned",
				"flags.convenientDescription": "You are incapacitated, cannot move, and can speak only falteringly. You automatically fail Strength and Dexterity saving throws, and attack rolls against you have advantage.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_stunned.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{id: "zhell_condition_unconscious", label: "Unconscious",
				"flags.convenientDescription": "You are incapacitated, cannot move or speak, you fall prone, fail all Strength and Dexterity saving throws, attack rolls against you have advantage, and any attack that hits you is a critical hit if the attacker is within 5 feet of you.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_unconscious.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{id: "zhell_spell_fly", label: "Flying", "duration.seconds": 600,
				"flags.convenientDescription": "You have a flying speed of 60 feet.",
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/modules/zhell-custom-stuff/images/symbols/condition_flying.webp",
				changes: [{key: "data.attributes.movement.fly", mode: UPGRADE, value: "60"}]
			}
		].sort((a,b) => (a.id > b.id) ? 1 : (b.id > a.id) ? -1 : 0);
		CONFIG.statusEffects = [...CONFIG.statusEffects.filter(i => i.id === "dead"), ...CONFIG.statusEffects.filter(i => i.id !== "dead")];
	}
});

Hooks.on("renderActorSheet5e", (sheet, html, sheetData) => {
	
	// minor edits to the sheet.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.MINOR_SHEET_EDITS)){
		// Change 'S. Rest' and 'L. Rest' to 'SR' and 'LR'
		const SR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.short-rest");
		const LR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.long-rest");
		if(SR) SR.innerHTML = "SR";
		if(LR) LR.innerHTML = "LR";
	}
	
	// remove resources from the character sheet.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REMOVE_RESOURCES)){
		const resources = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul");
		if(resources) resources.remove();
	}
	
	// Remove alignment field.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REMOVE_ALIGNMENT)){
		const AL = html[0].querySelector("input[name='data.details.alignment']");
		if(AL) AL.parentElement?.remove();
	}
	
	// Remove functionality of initiative button (use Requestor instead).
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.REMOVE_INITIATIVE)){
		const initButton = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.initiative > h4");
		if(initButton){
			initButton.classList.remove("rollable");
			initButton.removeAttribute("data-action");
		}
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
	
	// create materia medica counter on the sheet below exhaustion.
	if(game.settings.get(MODULE_NAME, SETTING_NAMES.MATERIA_MEDICA_COUNTER)){
		// get actor.
		const actor = sheet.actor;
		
		// bail if not a character.
		if(!sheetData.isCharacter) return;
		
		// create element:
		const value = actor.getFlag("zhell-custom-stuff", "materia-medica.value") ?? 0;
		const materia = document.createElement("div");
		materia.setAttribute("class", "counter flexrow materia");
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
		
		// insert element
		const belowThis = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > div.counters > div.counter.flexrow.exhaustion");
		belowThis.parentNode.insertBefore(materia, belowThis.nextSibling);
	}
});