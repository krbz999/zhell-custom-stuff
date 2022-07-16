import { MODULE_NAME } from "./const.mjs";
import { EffectsPanelApp } from "./effect-panel-classes.mjs";

export class ZHELL {
	static toggleLR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, "toggleLR") : !bool;
		await game.settings.set(MODULE_NAME, "toggleLR", !currentValue);
		return game.settings.get(MODULE_NAME, "toggleLR");
	};
	
	static toggleSR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, "toggleSR") : !bool;
		await game.settings.set(MODULE_NAME, "toggleSR", !currentValue);
		return game.settings.get(MODULE_NAME, "toggleSR");
	};
	
	static fromCatalog = async (entryName, catalog, object = false) => {
		const key = `zhell-custom-stuff.catalog-of-${catalog}`;
		const pack = !!game.packs.get(key) ? game.packs.get(key) : game.packs.get(catalog);
		if(!pack) return ui.notifications.warn("Pack not found.");
		const entry = pack.index.getName(entryName);
		if(!entry) return ui.notifications.warn("Entry not found.");
		const entryDoc = await pack.getDocument(entry._id);
		if(object) return entryDoc.toObject();
		else return entryDoc;
	};
	
	static spawnFromCatalog = async (actorName, catalog = "monsters", dummyNPC = "dummy", warpgateObjects = {}, at) => {
		const spawnDoc = await ZHELL.fromCatalog(actorName, catalog, false);
		if(!spawnDoc) return ui.notifications.warn("Monster not found.");
		
		// save whether the actor is wildcard img and if the token img is webm.
		const isWildcard = !!spawnDoc.data.token.randomImg;
		const isWebm = !!spawnDoc.data.token.img.endsWith(".webm");
		
		// create stuff.
		const updatesActor = spawnDoc.toObject();
		const updatesToken = spawnDoc.data.token.toObject();
		
		// edits and merges to updates:
		delete updatesToken.actorId; // as to not overwrite the source actorId of dummy.
		
		const updates = {
			actor: mergeObject(updatesActor, warpgateObjects.updates?.actor ?? {}),
			token: mergeObject(updatesToken, warpgateObjects.updates?.token ?? {}),
			embedded: warpgateObjects.updates?.embedded
		}
		
		// load images so we don't get weird errors.
		const callbackPre = async (loc, updates) => {
			// if a specific image was provided in update, use that.
			const provided = getProperty(warpgateObjects, "updates.token.img");
			if(!!provided){
				await loadTexture(provided);
				updates.token.img = provided;
			}
			// else get the token image(s) and load it.
			else{
				const tokenImages = await spawnDoc.getTokenImages();
				const img = tokenImages[Math.floor(Math.random() * tokenImages.length)];
				await loadTexture(img);
				updates.token.img = img;
			}
		}
		
		// not a necessary function if we just spawn 1 token, but if there are duplicates, and they are wildcards, oh no.
		const callbackPost = async (loc, tokenDoc, updates) => {
			// if a specific image was provided in update, use that.
			const provided = getProperty(warpgateObjects, "updates.token.img");
			if(!!provided){
				await loadTexture(provided);
				updates.token.img = provided;
			}
			// else get the token image(s) and load it.
			else{
				const tokenImages = await spawnDoc.getTokenImages();
				const img = tokenImages[Math.floor(Math.random() * tokenImages.length)];
				await loadTexture(img);
				updates.token.img = img;
			}
		}
		
		const callbacks = mergeObject({pre: callbackPre, post: callbackPost}, (warpgateObjects.callbacks ?? {}));
		const options = mergeObject(
			{crosshairs: (isWildcard || isWebm) ? {drawIcon: false, icon: "icons/svg/dice-target.svg"} : {}},
			warpgateObjects.options ?? {});
		
		// either spawn or spawnAt:
		if(at?.x !== undefined && at?.y !== undefined) return await warpgate.spawnAt({x: at.x, y: at.y}, dummyNPC, updates, callbacks, options);
		else return await warpgate.spawn(dummyNPC, updates, callbacks, options);
	};
	
	static mutateFromCatalog = async (actorName, catalog = "monsters", warpgateObjects = {}) => {
		const token = canvas.tokens.controlled[0];
		if(!token) return ui.notifications.warn("You have no token selected.");
		const tokenDoc = token.document;
		
		const mutateDoc = await ZHELL.fromCatalog(actorName, catalog, false);
		if(!mutateDoc) return ui.notifications.warn("Monster not found.");
		const updatesActor = mutateDoc.toObject();
		const updatesToken = mutateDoc.data.token;
		
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
		
		// load images so we don't get weird errors.
		const callbackPre = async (loc, updates) => {
			// if a specific image was provided in update, use that.
			const provided = getProperty(warpgateObjects, "updates.token.img");
			if(!!provided){
				await loadTexture(provided);
				updates.token.img = provided;
			}
			// else get the token image(s) and load it.
			else{
				const tokenImages = await mutateDoc.getTokenImages();
				const img = tokenImages[Math.floor(Math.random() * tokenImages.length)];
				await loadTexture(img);
				updates.token.img = img;
			}
		}
		const callbackPost = async () => {}
		
		// data to keep:
		const {actorLink, bar1, bar2, displayBars, displayName, disposition, elevation, lockRotation, vision} = tokenDoc.data;
		const {type} = tokenDoc.actor.data;
		
		// merge with passed objects:
		const mergeActor = mergeObject({...updatesActor, type}, (warpgateObjects.updates?.actor ?? {}));
		const mergeToken = mergeObject({...updatesToken, actorLink, bar1, bar2, displayBars, disposition, displayName, elevation, lockRotation, vision}, (warpgateObjects.updates?.token ?? {}));
		const mergeEmbedded = mergeObject({Item: updatesItems, ActiveEffect: updatesEffects}, (warpgateObjects.updates?.embedded ?? {}));
		const mergeCallbacks = mergeObject({pre: callbackPre, post: callbackPost}, (warpgateObjects.callbacks ?? {}));
		const mergeOptions = mergeObject({comparisonKeys: {ActiveEffect: "label"}, name: `Polymorph: ${actorName}`}, (warpgateObjects.options ?? {}));
		
		return await warpgate.mutate(tokenDoc, {actor: mergeActor, token: mergeToken, embedded: mergeEmbedded}, mergeCallbacks, mergeOptions);	
	}
	
	// cast a spell directly from a compendium.
	static castFromCatalog = async (spellName, catalog = "spells", caster, updates = {}, rollOptions = {}) => {
		
		const parent = caster?.actor ?? caster ?? canvas.tokens.controlled[0]?.actor ?? game.user.character;
		if(!parent) return ui.notifications.warn("No valid actor.");
		
		const object = await ZHELL.fromCatalog(spellName, catalog, true);
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
		spell.prepareFinalAttributes(); // this fixes saving throw buttons.
		
		// Trigger the item roll (code modified from itemacro).
		const roll = spell.hasMacro() ? await spell.executeMacro() : await spell.roll({...rollOptions, createMessage: false});
		if(!roll) return;
		
		// update message.
		roll["flags.dnd5e.itemData"] = original;
		
		return await ChatMessage.create(roll);
	}
	
	static magicItemCast = async (spellName, level, caster, rollOptions = {}) => {
		return await ZHELL.castFromCatalog(spellName, "spells", caster, {
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
		return game.settings.set(MODULE_NAME, "foragingDC", number);
	};
	
	static teleportTokens = async (size = 4, {fade = true, fadeDuration = 500, clearTargets = true} = {}) => {
		// pick area of tokens.
		const origin = await warpgate.crosshairs.show({size, drawIcon: false, fillAlpha: 0.1, lockSize: false, label: "Pick Up Tokens"});
		const {x: ox, y: oy, cancelled: oc} = origin;
		if(oc) return;
		
		// get the tokens.
		const tokens = warpgate.crosshairs.collect(origin);
		game.user.updateTokenTargets(tokens.map(i => i.id));
		
		// pick new area.
		const target = await warpgate.crosshairs.show({size: origin.size, drawIcon: false, fillAlpha: 0.1, lockSize: true, label: "Select Target"});
		const {x: nx, y: ny, cancelled: nc} = target;
		if(nc) return game.user.updateTokenTargets(); // clear targets.
		
		if(clearTargets) game.user.updateTokenTargets(); // clear targets.
		
		if(fade){
			const sequence = new Sequence();
			for(let token of tokens){
				sequence.animation().on(token).fadeOut(fadeDuration);
			}
			await sequence.play();
			await warpgate.wait(fadeDuration);
		}
		
		// teleport!
		const updates = tokens.map(i => ({_id: i.id, x: i.data.x - ox + nx, y: i.data.y - oy + ny}));
		const update = await canvas.scene.updateEmbeddedDocuments("Token", updates, {animate: false});
		
		if(fade){
			await warpgate.wait(fadeDuration);
			const sequence = new Sequence();
			for(let token of tokens){
				sequence.animation().on(token).fadeIn(fadeDuration);
			}
			await sequence.play();
		}
		
		return update;
	}
	
	static targetTokens = async (size = 4) => {
		// pick area of tokens.
		const origin = await warpgate.crosshairs.show({size, drawIcon: false, fillAlpha: 0.1, lockSize: false, rememberControlled: true, label: "Pick Targets"});
		const {x: ox, y: oy, cancelled: oc} = origin;
		if(oc) return;
		
		// get the tokens.
		const tokens = warpgate.crosshairs.collect(origin);
		const tokenIds = tokens.map(i => i.id);
		game.user.updateTokenTargets(tokenIds);
		
		return tokenIds;
	}
	
	// pass the target and an array of arrays (numeric value + damage type).
	static apply_damage = async (actor, damages, showrolls = false) => {
		// all values must be provided.
		if(!actor || !damages) return;
		
		// make sure it's an actor, not token.
		const target = actor.actor ? actor.actor : actor;
		
		// if damages is a string, that's fine, but convert to array.
		const damageArray = typeof damages === "string" ? [[damages, ""]] : damages;
		
		// get the actor's immunities, resistances, and vulnerabilities.
		const {di, dr, dv} = target.data.data.traits;
		
		// convert each die expression to a numeric value and apply resistances.
		let sum = 0;
		for(let i = 0; i < damageArray.length; i++){
			const [dmg, type] = damageArray[i];
			
			if(!dmg) continue;
			
			const label = CONFIG.DND5E.damageResistanceTypes[type] ?? "Other";
			
			// get the multiplier from resistances etc.
			const [multiplier, flavor] = arrInclude(di, type) ? [
				0, `${label} damage (immune)`
			] : arrInclude(dr, type) ? [
				0.5, `${label} damage (resistant)`
			] : arrInclude(dv, type) ? [
				2, `${label} damage (vulnerable)`
			] : [
				1, `${label} damage`
			];
			
			// get the damage total before resistances.
			const formula = Roll.replaceFormulaData(dmg, target.getRollData());
			if(!Roll.validate(formula)) continue;
			
			const roll = new Roll(formula);
			const {total} = await roll.evaluate({async: true});
			if(showrolls) roll.toMessage({
				flavor,
				speaker: ChatMessage.getSpeaker({actor: target})
			});
			
			// add to sum.
			sum += Math.floor(total * multiplier);
		}
		
		// apply damage.
		return target.applyDamage(sum);
		
		// function to return true or false if a combined array contains another thing.
		function arrInclude(obj, val){
			const values = obj.value;
			const customs = obj.custom ?? "";
			
			return [...values, ...customs.split(";")].includes(val);
		}
	}
	
	// takes an array of tokens or tokenDocuments and returns an array of player owner ids.
	static get_token_owner_ids = (tokens = [], excludeGM = false) => {
		const permissions = tokens.map(t => t.actor.data.permission);
		const userIds = game.users.filter(user => {
			return permissions.some(permission => permission[user.id] === CONST.DOCUMENT_PERMISSION_LEVELS.OWNER);
		}).map(i => i.id);
		if(excludeGM) return userIds.filter(i => !game.users.get(i).isGM);
		else return userIds;
	}
	
	// whisper players.
	static whisper_players = () => {
		const users = game.users.filter(u => u.id !== game.user.id);
		const characterIds = users.map(u => u.character?.id).filter(i => !!i);
		const selectedPlayerIds = canvas.tokens.controlled.map(i => i.actor.id).filter(i => characterIds.includes(i));
		const options = users.reduce((acc, {id, name, character}) => {
			const checked = (!!character && selectedPlayerIds.includes(character.id)) ? "selected" : "";
			return acc + `<span class="whisper-dialog-player-name ${checked}" id="${id}">${name}</span>`;
		}, `<form><div class="form-fields whisper-dialog">`) + `</div></form>`;
		const style = `
		<style>
			.form-fields {
				display: grid;
				grid-template-columns: auto auto auto auto;
			}
			
			.whisper-dialog-player-name.selected {
				background-color: cornflowerblue;
				font-weight: bold;
			}
			
			.whisper-dialog-player-name:hover {
				text-shadow: 0 0 8px var(--color-shadow-primary)!important;
			}
			
			.whisper-dialog-player-name {
				padding: 5px 0 5px 0;
				border: 1px solid var(--color-border-dark-tertiary);
				border-radius: 5px;
				margin: 1px 1px 1px 1px;
				text-align: center;
				line-height: normal;
			}
			
			.whisper-dialog-textarea {
				resize: none;
			}
			
			.form-fields.whisper-dialog {
				display: grid;
				grid-template-columns: 24% 24% 24% 24%;
				justify-content: space-around;
			}
			
		</style>`;

		new Dialog({
			title: "Whisper",
			content: style + `
			<p>Whisper to:</p>${options} <hr>
			<label for="message">Message:</label>
			<textarea class="whisper-dialog-textarea" id="message" name="message" rows="6" cols="50"></textarea>
			<hr>`,
			buttons: {go: {
				icon: `<i class="fas fa-check"></i>`,
				label: "Whisper",
				callback: async (html) => {
					const whisperIds = new Set();
					for(let {id} of users){
						if(!!html[0].querySelector(`span[id="${id}"].selected`)){
							whisperIds.add(id);
						}
					}
					const content = html[0].querySelector("textarea[id=message]").value.split("\n").reduce((acc, e) => acc += `<p>${e}</p>`, ``);
					if(!whisperIds.size) return;
					const whisper = Array.from(whisperIds);
					await ChatMessage.create({content, whisper});
				}
			}},
			render: (html) => {
				html.css("height", "auto");
				for(let playerName of html[0].querySelectorAll(".whisper-dialog-player-name")){
					playerName.addEventListener("click", () => {
						playerName.classList.toggle("selected");
					});
				}
			}
		}).render(true);
	}
	
	// function to wait for a specified amount of time.
	static wait = async (ms) => {
		return new Promise(resolve => setTimeOut(resolve, Number(ms)));
	}
	
	// function to turn integer into cardinal number.
	static nth = (number) => {
		const num = Number(number);
		const index = ((num + 90) % 100 - 10) % 10 - 1;
		return ["st", "nd", "rd"][index] || "th";
	}
	
	// function to turn integer into roman numeral.
	static romanize = (number) => {
		let num = Number(number);
		const roman = {
			M: 1000, CM: 900, D: 500,
			CD: 400, C: 100, XC: 90,
			L: 50, XL: 40, X: 10,
			IX: 9, V: 5, IV: 4, I: 1
		}
		let str = '';
		
		for(let i of Object.keys(roman)){
			let q = Math.floor(num / roman[i]);
			num -= q * roman[i];
			str += i.repeat(q);
		}
		
		return str;
	}
	
}

export class ZHELLHOOKS {
	static disable_long_rest = (dialog, html, data) => {
		const restDisabled = game.settings.get(MODULE_NAME, "toggleLR");
		if(!restDisabled) return;
		
		const restButton = html[0].querySelector("button[data-button='rest']");
		restButton.setAttribute("disabled", true);
	}
	
	static disable_short_rest = (dialog, html, data) => {
		const restDisabled = game.settings.get(MODULE_NAME, "toggleSR");
		if(!restDisabled) return;
		
		const rollButton = html[0].querySelector("#roll-hd");
		rollButton.setAttribute("disabled", true);
		const restButton = html[0].querySelector("button[data-button='rest']");
		restButton.setAttribute("disabled", true);
	}
	
	static replace_consumable_types = () => {
		if(!game.settings.get(MODULE_NAME, "replacementSettings").replace_consumable_types) return;
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
		}
	}
	
	static add_equipment_types = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_equipment_types) return;
		CONFIG.DND5E.equipmentTypes["wand"] = "Wand";
		CONFIG.DND5E.miscEquipmentTypes["wand"] = "Wand";
	}
	
	static add_divine = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_divine) return;
		CONFIG.DND5E.spellSchools["divine"] = "Divine";
	}
	
	static add_conditions = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_conditions) return;
		CONFIG.DND5E.conditionTypes["turned"] = "Turned";
	}
	
	static replace_languages = () => {
		if(!game.settings.get(MODULE_NAME, "replacementSettings").replace_languages) return;
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
		}
	}
	
	static replace_tools = () => {
		if(!game.settings.get(MODULE_NAME, "replacementSettings").replace_tools) return;
		
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
		}
	}
	
	static replace_weapons = () => {
		if(!game.settings.get(MODULE_NAME, "replacementSettings").replace_weapons) return;
		
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
		}
		
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
		}
	}
	
	static add_piety = () => {
		if(!game.settings.get(MODULE_NAME, "additionSettings").add_piety) return;
		CONFIG.DND5E.abilities["pty"] = "Piety";
		CONFIG.DND5E.abilityAbbreviations["pty"] = "pty";
	}
	
	static replace_status_effects = () => {
		if(!game.settings.get(MODULE_NAME, "replacementSettings").replace_status_effects) return;
		
		const {ADD, MULTIPLY, UPGRADE} = CONST.ACTIVE_EFFECT_MODES;
		
		CONFIG.statusEffects = [
			{
				id: "zhell_spell_bane",
				label: "Bane",
				duration: {seconds: 60},
				flags: {convenientDescription: "<p>You subtract <strong>1d4</strong> from all saving throws and attack rolls.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/bane.webp",
				changes: [
					{key: "data.bonuses.abilities.save", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.msak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.mwak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.rsak.attack", mode: ADD, value: "-1d4"},
					{key: "data.bonuses.rwak.attack", mode: ADD, value: "-1d4"}
				]
			},
			{
				id: "zhell_spell_bless",
				label: "Bless",
				duration: {seconds: 60},
				flags: {convenientDescription: "<p>You add a <strong>1d4</strong> bonus to all saving throws and attack rolls.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/bless.webp",
				changes: [
					{key: "data.bonuses.abilities.save", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.msak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.mwak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.rsak.attack", mode: ADD, value: "+1d4"},
					{key: "data.bonuses.rwak.attack", mode: ADD, value: "+1d4"}
				]
			},
			{
				id: "zhell_spell_speed_haste",
				label: "Haste",
				duration: {seconds: 60},
				flags: {convenientDescription: "<p>Your movement speed is doubled, you have a +2 bonus to AC, and you have advantage on Dexterity saving throws.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/haste.webp",
				changes: [
					{key: "data.attributes.ac.bonus", mode: ADD, value: '+2'},
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "2"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "2"}
				]
			},
			{
				id: "zhell_spell_speed_slow",
				label: "Slow",
				duration: {seconds: 60},
				flags: {convenientDescription: "<p>Your movement speed is halved, and you subtract 2 from your AC and Dexterity saving throws.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/slowed.webp",
				changes: [
					{key: "data.attributes.ac.bonus", mode: ADD, value: "-2"},
					{key: "data.abilities.dex.bonuses.save", mode: ADD, value: "-2"},
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: ".5"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: ".5"}
				]
			},
			{
				id: "zhell_condition_sense_blind",
				label: "Blinded",
				flags: {convenientDescription: "<p>You cannot see, and you automatically fail any ability checks that require sight.</p><p>Attack rolls against you have advantage, and your attack rolls have disadvantage.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/blinded.webp"
			},
			{
				id: "zhell_condition_charm",
				label: "Charmed",
				flags: {convenientDescription: "<p>You cannot attack the charmer or target them with harmful abilities or magical effects.</p><p>The charmer has advantage on any ability check to interact socially with you.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/charmed.webp"
			},
			{
				id: "dead",
				label: "Dead",
				flags: {convenientDescription: "<p>You have met an unfortunate end.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/dead.webp"
			},
			{
				id: "zhell_condition_sense_deaf",
				label: "Deafened",
				flags: {convenientDescription: "<p>You cannot hear and automatically fail any ability checks that require hearing.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/deafened.webp"
			},
			{
				id: "zhell_condition_sense_mute",
				label: "Muted",
				flags: {convenientDescription: "<p>You cannot speak, cannot cast spells with a verbal component, and you automatically fail any ability checks that require speech.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/muted.webp"
			},
			{
				id: "zhell_condition_fear",
				label: "Frightened",
				flags: {convenientDescription: "<p>You have disadvantage on all attack rolls and ability checks while the source of your fear is within your line of sight.</p><p>You cannot willingly move closer to the source of your fear.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/frightened.webp"
			},
			{
				id: "zhell_condition_move_grappled",
				label: "Grappled",
				flags: {convenientDescription: "<p>Your speed is zero.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/grappled.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{
				id: "zhell_condition_incapacitated",
				label: "Incapacitated",
				flags: {convenientDescription: "<p>You cannot take actions or reactions.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/incapacitated.webp"
			},
			{
				id: "zhell_condition_invisible",
				label: "Invisible",
				flags: {convenientDescription: "<p>You are impossible to see, and are considered heavily obscured.</p><p>Attack rolls against you have disadvantage, and your attack rolls have advantage.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/invisible.webp"
			},
			{
				id: "zhell_condition_paralysis",
				label: "Paralyzed",
				flags: {convenientDescription: `
					<p>You are incapacitated, and you cannot move or speak.</p>
					<p>You automatically fail Strength and Dexterity saving throws, attack rolls against you have advantage,
					and any attacks against you is a critical hit if the attacker is within 5 feet of you.</p>`},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/paralyzed.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{
				id: "zhell_condition_petrified",
				label: "Petrified", 
				flags: {convenientDescription: `
					<p>You are inanimate, incapacitated, and unaware of your surroundings.</p>
					<p>Your weight is increased by a factor of ten, you cannot move or speak, and attack rolls against you have advantage.</p>
					<p>You automatically fail all Strength and Dexterity saving throws.</p>
					<p>You have resistance to all damage, and you are immune to poison and disease.</p>`},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/petrified.webp"
			},
			{
				id: "zhell_condition_poison",
				label: "Poisoned",
				flags: {convenientDescription: "<p>You have disadvantage on all attack rolls and ability checks.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/poisoned.webp"
			},
			{
				id: "zhell_condition_prone",
				label: "Prone",
				flags: {convenientDescription: `
					<p>You can only crawl unless you expend half your movement to stand up.</p>
					<p>You have disadvantage on attack rolls, and any attack roll has advantage against you if the attacker is within 5 feet of you; it otherwise has disadvantage.</p>`},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/prone.webp"
			},
			{
				id: "zhell_condition_move_restrain",
				label: "Restrained", 
				flags: {convenientDescription: "<p>Your speed is zero, attack rolls against you have advantage, and your attack rolls have disadvantage.</p><p>You have disadvantage on Dexterity saving throws.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/restrained.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{
				id: "zhell_condition_stun",
				label: "Stunned",
				flags: {convenientDescription: "<p>You are incapacitated, cannot move, and can speak only falteringly.</p><p>You automatically fail Strength and Dexterity saving throws, and attack rolls against you have advantage.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/stunned.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{
				id: "zhell_condition_unconscious",
				label: "Unconscious",
				flags: {convenientDescription: `
					<p>You are incapacitated, cannot move or speak, you fall prone, and you automatically fail all Strength and Dexterity saving throws.</p>
					<p>Attack rolls against you have advantage, and any attack that hits you is a critical hit if the attacker is within 5 feet of you.</p>`},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/unconscious.webp",
				changes: [
					{key: "data.attributes.movement.walk", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.fly", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.swim", mode: MULTIPLY, value: "0"},
					{key: "data.attributes.movement.climb", mode: MULTIPLY, value: "0"}
				]
			},
			{
				id: "zhell_spell_fly",
				label: "Flying", "duration.seconds": 600,
				flags: {convenientDescription: "<p>You have a flying speed of 60 feet.</p>"},
				icon: "https://assets.forge-vtt.com/6031826c83ef59f0ff7fedfa/images/conditions/flying.webp",
				changes: [
					{key: "data.attributes.movement.fly", mode: UPGRADE, value: "60"}
				]
			}
		].sort((a,b) => (a.id > b.id) ? 1 : (b.id > a.id) ? -1 : 0);
		CONFIG.statusEffects = [...CONFIG.statusEffects.filter(i => i.id === "dead"), ...CONFIG.statusEffects.filter(i => i.id !== "dead")];
	}

	static rename_rest_labels = (sheet, html, sheetData) => {
		if(!game.settings.get(MODULE_NAME, "sheetSettings").rename_rest_labels) return;
		const SR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.short-rest");
		const LR = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.hit-dice > footer > a.rest.long-rest");
		if(SR) SR.innerHTML = "SR";
		if(LR) LR.innerHTML = "LR";
	}
	
	static remove_resources = (sheet, html, sheetData) => {
		if(!game.settings.get(MODULE_NAME, "sheetSettings").remove_resources) return;
		const resources = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > ul");
		if(resources) resources.remove();
	}
	
	static remove_alignment = (sheet, html, sheetData) => {
		if(!game.settings.get(MODULE_NAME, "sheetSettings").remove_alignment) return;
		const AL = html[0].querySelector("input[name='data.details.alignment']");
		if(AL) AL.parentElement?.remove();
	}
	
	static disable_initiative_button = (sheet, html, sheetData) => {
		if(!game.settings.get(MODULE_NAME, "sheetSettings").disable_initiative_button) return;
		const initButton = html[0].querySelector("section > form > header > section > ul.attributes.flexrow > li.attribute.initiative > h4");
		if(initButton){
			initButton.classList.remove("rollable");
			initButton.removeAttribute("data-action");
		}
	}
	
	static create_forage_counter = (sheet, html, sheetData) => {
		if(!game.settings.get(MODULE_NAME, "sheetSettings").create_forage_counter) return;
		const actor = sheet.actor;
		if(!sheetData.isCharacter) return;
		
		const value = actor.getFlag(MODULE_NAME, "materia-medica.value") ?? 0;
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
		const belowThis = html[0].querySelector("section > form > section > div.tab.attributes.flexrow > section > div.counters > div.counter.flexrow.exhaustion");
		belowThis.parentNode.insertBefore(materia, belowThis.nextSibling);
	}
	
	static mark_defeated_combatant = async (tokenDoc, updates) => {
		if(!game.settings.get(MODULE_NAME, "markDefeatedCombatants")) return;
		if(tokenDoc.actor.hasPlayerOwner) return;
		if(!tokenDoc.combatant) return;
		const hpUpdate = getProperty(updates, "actorData.data.attributes.hp.value");
		if(hpUpdate === undefined || hpUpdate > 0) return;
		const effect = CONFIG.statusEffects.find(i => i.id === "dead");
		await tokenDoc.object.toggleEffect(effect, {overlay: true});
		await tokenDoc.combatant.update({defeated: true});
	}
	
	static flag_attack_to_show_ammo_if_it_has_save = (message, messageData, context, userId) => {
		if(!game.settings.get(MODULE_NAME, "displaySavingThrowAmmo")) return;
		
		// must be an attack roll.
		if(getProperty(messageData, "flags.dnd5e.roll.type") !== "attack") return;
		
		// get the item id.
		const itemId = getProperty(messageData, "flags.dnd5e.roll.itemId");
		if(!itemId) return;
		
		// get the actor.
		const actorId = getProperty(messageData, "speaker.actor");
		const actor = game.actors.get(actorId);
		if(!actor) return;
		
		// attempt to find the item.
		const item = actor.items.get(itemId);
		if(!item) return;
		
		// find ammo on the actor.
		const consume = getProperty(item, "data.data.consume");
		if(!consume) return;
		const {amount, target: ammoId, type} = consume;
		if(!ammoId || type !== "ammo") return;
		const ammo = actor.items.get(ammoId);
		if(!ammo) return;
		
		// does ammo have save?
		const ammoHasSave = getProperty(ammo, "data.data.save.ability");
		if(!ammoHasSave) return;
		
		// display ammo.
		context["display-ammo"] = {display: true, userId, actorId, ammoId}
	}

	static show_ammo_if_it_has_save = async (message, context, userId) => {
		if(!game.settings.get(MODULE_NAME, "displaySavingThrowAmmo")) return;
		
		// display ammo?
		if(!getProperty(context, "display-ammo.display")) return;
		
		// only for the user.
		if(getProperty(context, "display-ammo.userId") !== userId) return;
		
		// get ids.
		const {actorId, ammoId} = getProperty(context, "display-ammo");
		
		// display ammo card.
		return game.actors.get(actorId).items.get(ammoId).displayCard();
	}
	
	static create_dots = (sheet, html) => {
		const limited_use_dots = !!game.settings.get(MODULE_NAME, "colorSettings").limited_use_dots;
		const spell_slot_dots = !!game.settings.get(MODULE_NAME, "colorSettings").spell_slot_dots;
		
		// create spell slot dots.
		if(spell_slot_dots){
			const options = ["pact", "spell1", "spell2", "spell3", "spell4",
				"spell5", "spell6", "spell7", "spell8", "spell9"];
			for(let o of options){
				const max = html.find(`.spell-max[data-level=${o}]`);
				const name = max.closest(".spell-slots");
				const data = sheet.object.data.data.spells[o];
				if(data.max === 0) continue;
				let contents = "";
				for(let i = data.max; i > 0; i--){
					if(i <= data.value) contents += `<span class="dot"></span>`;
					else contents += `<span class="dot empty"></span>`;
				}
				name.before(contents);
			}
		}
		
		// create limited use dots.
		if(limited_use_dots){
			const itemUses = sheet.object.items.filter(i => !!i.hasLimitedUses);
			for(let o of itemUses){
				const itemHTML = html.find(`.item[data-item-id=${o.id}]`);
				let name = itemHTML.find(".item-name");
				const {value, max} = o.data.data.uses;
				if(max === 0) continue;
				let contents = "";
				for(let i = max; i > 0; i--){
					if(i <= value) contents += `<span class="dot"></span>`;
					else contents += `<span class="dot empty"></span>`;
				}
				if(o.type === "spell"){
					name = name.find(".item-detail.spell-uses");
					name.before(contents);
				}
				else name.after(contents);
			}
		}
		
		// create listeners.
		if(spell_slot_dots || limited_use_dots){
			for(let dot of html[0].querySelectorAll(".dot")){
				dot.addEventListener("click", async (ev) => {
					const actor = sheet.object;
					const li = $(ev.currentTarget).parents(".item");
					const item = actor.items.get(li.data("itemId"));
					let spellLevel;
					if(!item){
						spellLevel = ev.currentTarget.parentElement.outerHTML.match(/data-level="(.*?)"/)[1];
					}
					if(!item && spellLevel){
						const path = `data.spells.${spellLevel}.value`;
						if(ev.currentTarget.classList.contains("empty")){
							await actor.update({[path]: actor.data.data.spells[spellLevel].value + 1});
						}
						else{
							await actor.update({[path]: actor.data.data.spells[spellLevel].value - 1});
						}
					}
					else if(ev.currentTarget.classList.contains("empty")){
						await item.update({"data.uses.value": item.data.data.uses.value + 1});
					}
					else{
						await item.update({"data.uses.value": item.data.data.uses.value - 1});
					}
				});
			}
		}
	}
	
	static create_toggle_on_attunement_button = (sheet, html) => {
		html[0].addEventListener("click", (event) => {
			const attunement_icon = event.target?.closest(".item-detail.attunement");
			if(!attunement_icon) return;
			
			// item attuned or nah.
			const attuned = attunement_icon.querySelector(".attuned");
			const not_attuned = attunement_icon.querySelector(".not-attuned");
			if(!attuned && !not_attuned) return;
			
			// get item id.
			const itemId = attunement_icon.closest(".item").dataset.itemId;
			if(!itemId) return;
			
			// get the item.
			const item = sheet.actor.items.get(itemId);
			if(!item) return;
			
			if(!!attuned){
				item.update({"data.attunement": CONFIG.DND5E.attunementTypes.REQUIRED});
			}
			else if(!!not_attuned){
				item.update({"data.attunement": CONFIG.DND5E.attunementTypes.ATTUNED});
			}
		});
	}
	
	static color_magic_items = (sheet, html) => {
		const items = html[0].querySelectorAll(".items-list .item");
		for(let i of items){
			const id = i.outerHTML.match(/data-item-id="(.*?)"/);
			if(!id) continue;
			const rarity = sheet.object.items.get(id[1]).data.data?.rarity;
			if(rarity !== "" && rarity !== undefined) i.classList.add(rarity.slugify().toLowerCase());
		}
	}
	
	static refreshColors = () => {
		// set icon colors on sheet.
		const [a, b, cf, ca, cna, ce, cne, cp, cnp, cap] = Object.values(game.settings.get(MODULE_NAME, "colorSettings"));
		document.documentElement.style.setProperty("--full_color", cf);
		document.documentElement.style.setProperty("--attuned_color", ca);
		document.documentElement.style.setProperty("--not_attuned_color", cna);
		document.documentElement.style.setProperty("--equipped_color", ce);
		document.documentElement.style.setProperty("--not_equipped_color", cne);
		document.documentElement.style.setProperty("--prepared_color", cp);
		document.documentElement.style.setProperty("--not_prepared_color", cnp);
		document.documentElement.style.setProperty("--always_prepared_color", cap);
		
		// set item rarity colors on sheet.
		const {uncommon, rare, very_rare, legendary, artifact} = game.settings.get(MODULE_NAME, "rarityColorSettings");
		document.documentElement.style.setProperty("--rarity-color-uncommon", uncommon);
		document.documentElement.style.setProperty("--rarity-color-rare", rare);
		document.documentElement.style.setProperty("--rarity-color-very-rare", very_rare);
		document.documentElement.style.setProperty("--rarity-color-legendary", legendary);
		document.documentElement.style.setProperty("--rarity-color-artifact", artifact);
	}
	
	static createEffectsPanel = () => {
		this.effectsPanel = new EffectsPanelApp();
	}
	
	
}

