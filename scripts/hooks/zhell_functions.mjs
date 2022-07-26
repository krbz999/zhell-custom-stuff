import { MODULE_NAME } from "../const.mjs";
import { EXHAUSTION_EFFECTS } from "../../sources/conditions.js";

export class ZHELL_REST {

	static toggleLR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, "toggleLR") : !bool;
		await game.settings.set(MODULE_NAME, "toggleLR", !currentValue);
		return game.settings.get(MODULE_NAME, "toggleLR");
	}
	
	static toggleSR = async (bool) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		const currentValue = (bool === undefined) ? game.settings.get(MODULE_NAME, "toggleSR") : !bool;
		await game.settings.set(MODULE_NAME, "toggleSR", !currentValue);
		return game.settings.get(MODULE_NAME, "toggleSR");
	}

}

export class ZHELL_CATALOG {
	
	static fromCatalog = async (entryName, catalog, object = false) => {
		const key = `zhell-custom-stuff.catalog-of-${catalog}`;
		const pack = !!game.packs.get(key) ? game.packs.get(key) : game.packs.get(catalog);
		if(!pack) return ui.notifications.warn("Pack not found.");
		const entry = pack.index.getName(entryName);
		if(!entry) return ui.notifications.warn("Entry not found.");
		const entryDoc = await pack.getDocument(entry._id);
		if(object) return entryDoc.toObject();
		else return entryDoc;
	}
	
	static spawnFromCatalog = async (actorName, catalog = "monsters", dummyNPC = "dummy", warpgateObjects = {}, at) => {
		const spawnDoc = await this.fromCatalog(actorName, catalog, false);
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
	}
	
	static mutateFromCatalog = async (actorName, catalog = "monsters", warpgateObjects = {}) => {
		const token = canvas.tokens.controlled[0];
		if(!token) return ui.notifications.warn("You have no token selected.");
		const tokenDoc = token.document;
		
		const mutateDoc = await this.fromCatalog(actorName, catalog, false);
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
		
		const object = await this.fromCatalog(spellName, catalog, true);
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
		return await this.castFromCatalog(spellName, "spells", caster, {
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

}

export class ZHELL_UTILS {
	
	// execute an item's Item Macro if it has one, otherwise roll normally.
	static rollItemMacro = async (item, options = {}) => {
		if(item.hasMacro()) return item.executeMacro(options);
		else return item.roll(options);
	}

	static setMateriaMedicaForagingDC = async (number) => {
		if(!game.user.isGM) return ui.notifications.warn("Excuse me?");
		return game.settings.set(MODULE_NAME, "foragingDC", number);
	}
	
	static teleportTokens = async (size = 4, {fade = true, fadeDuration = 500, clearTargets = true} = {}) => {
		// pick area of tokens.
		const origin = await warpgate.crosshairs.show({
			size,
			drawIcon: false,
			fillAlpha: 0.1,
			lockSize: false,
			label: "Pick Up Tokens"
		});
		const {x: ox, y: oy, cancelled: oc} = origin;
		if(oc) return;
		
		// get the tokens.
		const tokens = warpgate.crosshairs.collect(origin);
		game.user.updateTokenTargets(tokens.map(i => i.id));
		
		// pick new area.
		const target = await warpgate.crosshairs.show({
			size: origin.size,
			drawIcon: false,
			fillAlpha: 0.1,
			lockSize: true,
			label: "Select Target"
		});
		const {x: nx, y: ny, cancelled: nc} = target;
		if(nc) return game.user.updateTokenTargets(); // clear targets.
		
		if(clearTargets) game.user.updateTokenTargets(); // clear targets.
		
		if(fade){
			const sequence = new Sequence();
			for(let token of tokens) sequence.animation().on(token).fadeOut(fadeDuration);
			await sequence.play();
			await warpgate.wait(fadeDuration);
		}
		
		// teleport!
		const updates = tokens.map(i => {
			const {_id, x, y} = i.document.data;
			return {_id, x: x - ox + nx, y: y - oy + ny};
		});
		const update = await canvas.scene.updateEmbeddedDocuments("Token", updates, {animate: false});
		
		if(fade){
			await warpgate.wait(fadeDuration);
			const sequence = new Sequence();
			for(let token of tokens) sequence.animation().on(token).fadeIn(fadeDuration);
			await sequence.play();
		}
		
		return update;
	}
	
	static targetTokens = async (size = 4) => {
		// pick area of tokens.
		const origin = await warpgate.crosshairs.show({
			size,
			drawIcon: false,
			fillAlpha: 0.1,
			lockSize: false,
			rememberControlled: true,
			label: "Pick Targets"
		});
		if(origin.cancelled) return;
		
		// get the tokens.
		const tokens = warpgate.crosshairs.collect(origin);
		const tokenIds = tokens.map(i => i.id);
		game.user.updateTokenTargets(tokenIds);
		
		return tokenIds;
	}
	
	// pass the target and an array of arrays (numeric value + damage type).
	static apply_damage = async (actor, damages, {showrolls = false, globalModifier = 1} = {}) => {
		
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
			const [multiplier, flavor] = arrInclude(di, type) ? [0, `${label} damage (immune)`]
				: arrInclude(dr, type) ? [0.5, `${label} damage (resistant)`]
				: arrInclude(dv, type) ? [2, `${label} damage (vulnerable)`]
				: [1, `${label} damage`];
			
			// get the damage total before resistances.
			const formula = Roll.replaceFormulaData(dmg, target.getRollData());
			if(!Roll.validate(formula)) continue;
			const roll = await new Roll(formula).evaluate({async: true});
			
			// throw rolls into chat.
			if(showrolls) roll.toMessage({
				flavor,
				speaker: ChatMessage.getSpeaker({actor: target})
			});
			
			// a global modifier in cases of half damage on saves for example
			const total = Math.floor(roll.total * globalModifier);
			
			// add to sum after adjusting for resistances.
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
		const suffix = ["st", "nd", "rd"][index] || "th";
		return `${number}${suffix}`;
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
	
	// load a texture for all clients.
	static async loadTextureForAll(src, push = true){
		if(push){
			game.socket.emit(`world.${game.world.id}`, {
				action: "loadTextureForAll",
				data: {src}
			});
		}
		return loadTexture(src);
	}

	// increase exhaustion.
	static increase_exhaustion = async (actor) => {
		if(!(actor instanceof Actor)) return ui.notifications.warn("Invalid actor provided.");
		
		// get current exhaustion effect, if any.
		const exhaustion = actor.effects.find(i => i.getFlag("core", "statusId") === "exhaustion");

		// if exhausted, increase the level.
		if(!!exhaustion){
			const currentLevel = exhaustion.getFlag("zhell-custom-stuff", "exhaustion");
			return this.update_exhaustion(currentLevel + 1, actor);
		}

		// if not exhausted, set to 1.
		if(!exhaustion) return this.update_exhaustion(1, actor);
	}

	// decrease exhaustion.
	static decrease_exhaustion = async (actor) => {
		if(!(actor instanceof Actor)) return ui.notifications.warn("Invalid actor provided.");
		
		// get current exhaustion effect, if any.
		const exhaustion = actor.effects.find(i => i.getFlag("core", "statusId") === "exhaustion");

		// if exhausted, decrease the level.
		if(!!exhaustion){
			const currentLevel = exhaustion.getFlag("zhell-custom-stuff", "exhaustion");
			return this.update_exhaustion(currentLevel - 1, actor);
		}

		// if not exhausted, error.
		return ui.notifications.warn(`${actor.name} was not exhausted.`);
	}

	// update or set exhaustion to specific level
	static update_exhaustion = async (num, actor) => {
		if(![0,1,2,3,4,5,6].includes(num)) return ui.notifications.warn("The provided level was not valid.");
		if(!(actor instanceof Actor)) return ui.notifications.warn("Invalid actor provided.");

		// attempt to find any current exhaustion effect.
		let exhaustion = actor.effects.find(i => i.getFlag("core", "statusId") === "exhaustion");

		// if num===0, remove it.
		if(num === 0) return exhaustion?.delete();

		// if num===6, remove it and apply dead.
		if(num === 6){
			await exhaustion?.delete();
			const dead = foundry.utils.duplicate(CONFIG.statusEffects.find(i => i.id === "dead"));
			dead.flags.core = {statusId: dead.id, overlay: true};
			return actor.createEmbeddedDocuments("ActiveEffect", [dead]);
		}

		// if actor has exhaustion, update.
		if(!!exhaustion){
			const {label, changes, flags} = EXHAUSTION_EFFECTS[num-1];
			await exhaustion.update({label, changes, flags});
		}

		// if actor not already exhausted, find and apply.
		else if(!exhaustion){
			exhaustion = foundry.utils.duplicate(EXHAUSTION_EFFECTS[num-1]);
			exhaustion.flags.core = {statusId: exhaustion.id};
			await actor.createEmbeddedDocuments("ActiveEffect", [exhaustion]);
		}

		// lastly, update actor hp.
		const {value, max} = actor.data.data.attributes.hp;
		return actor.update({"data.attributes.hp.value": Math.floor(Math.min(value, max))});
	}
	
}
