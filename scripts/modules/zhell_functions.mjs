import { FORAGING, MODULE } from "../const.mjs";
import { EXHAUSTION_EFFECTS } from "../../sources/conditions.js";

export class ZHELL_CATALOG {
    
    static getDocument = async (name, catalog, object=false) => {
        const key = `zhell-catalogs.${catalog}`;
        const pack = game.packs.get(key) ?? game.packs.get(catalog);
        if ( !pack ) return ui.notifications.warn("Pack not found.");
        const entry = pack.index.getName(name);
        if ( !entry ) return ui.notifications.warn("Entry not found.");
        const entryDoc = await pack.getDocument(entry._id);
        if ( object ) return entryDoc.toObject();
        else return entryDoc;
    }
    
    static spawn = async (name, catalog="monsters", dummyNPC="dummy", warpgateObjects={}, at) => {
        warpgateObjects = foundry.utils.expandObject(warpgateObjects);

        const spawnDoc = await this.getDocument(name, catalog, false);
        if ( !spawnDoc ) return ui.notifications.warn("Monster not found.");
        
        // save whether the actor is wildcard img and if the token img is webm.
        const isWildcard = spawnDoc.prototypeToken.randomImg;
        const isWebm = spawnDoc.prototypeToken.texture.src.endsWith(".webm");
        
        // create stuff.
        const updatesActor = spawnDoc.toObject();
        const updatesToken = spawnDoc.prototypeToken.toObject();
        
        // edits and merges to updates:
        delete updatesToken.actorId; // as to not overwrite the source actorId of dummy.
        
        const updates = {
            actor: foundry.utils.mergeObject(updatesActor, warpgateObjects.updates?.actor ?? {}),
            token: foundry.utils.mergeObject(updatesToken, warpgateObjects.updates?.token ?? {}),
            embedded: warpgateObjects.updates?.embedded
        }
        
        // load images so we don't get weird errors.
        const callbackPre = async (loc, updates) => {
            // if a specific image was provided in update, use that.
            const provided = foundry.utils.getProperty(warpgateObjects, "updates.token.texture.src");
            if( !!provided ) {
                await loadTexture(provided);
                foundry.utils.setProperty(updates, "token.texture.src", provided);
            }
            // else get the token image(s) and load it.
            else {
                const tokenImages = await spawnDoc.getTokenImages();
                const img = tokenImages[Math.floor(Math.random() * tokenImages.length)];
                await loadTexture(img);
                foundry.utils.setProperty(updates, "token.texture.src", img);
            }
        }
        
        // not a necessary function if we just spawn 1 token, but if there are duplicates, and they are wildcards, oh no.
        const callbackPost = async (loc, tokenDoc, updates) => {
            // if a specific image was provided in update, use that.
            const provided = foundry.utils.getProperty(warpgateObjects, "updates.token.texture.src");
            if ( !!provided ) {
                await loadTexture(provided);
                foundry.utils.setProperty(updates, "token.texture.src", provided);
            }
            // else get the token image(s) and load it.
            else {
                const tokenImages = await spawnDoc.getTokenImages();
                const src = tokenImages[Math.floor(Math.random() * tokenImages.length)];
                await loadTexture(src);
                foundry.utils.setProperty(updates, "token.texture.src", src);
            }
        }
        
        const callbacks = foundry.utils.mergeObject({pre: callbackPre, post: callbackPost}, (warpgateObjects.callbacks ?? {}));
        const options = foundry.utils.mergeObject({
            crosshairs: (isWildcard || isWebm) ? {
                drawIcon: false,
                icon: "icons/svg/dice-target.svg"
            } : {}
        },
        warpgateObjects.options ?? {});
        
        // either spawn or spawnAt:
        if ( at?.x !== undefined && at?.y !== undefined ) return warpgate.spawnAt({ x: at.x, y: at.y }, dummyNPC, updates, callbacks, options);
        else return warpgate.spawn(dummyNPC, updates, callbacks, options);
    }
    
    static mutate = async (name, catalog="monsters", warpgateObjects={}) => {
        warpgateObjects = foundry.utils.expandObject(warpgateObjects);
        const token = canvas.tokens.controlled[0];
        if ( !token ) return ui.notifications.warn("You have no token selected.");
        const tokenDoc = token.document;
        
        const mutateDoc = await this.getDocument(name, catalog, false);
        if ( !mutateDoc ) return ui.notifications.warn("Monster not found.");
        const updatesActor = mutateDoc.toObject();
        const updatesToken = mutateDoc.prototypeToken;
        
        // handle items:
        const updatesItems = {};
        for ( const item of updatesActor.items ) updatesItems[item.name] = item;
        for ( const item of tokenDoc.actor.toObject().items ) updatesItems[item.name] = warpgate.CONST.DELETE;
        
        // handle effects:
        const updatesEffects = {};
        for ( const effect of updatesActor.effects ) updatesEffects[effect.label] = effect;
        for ( const effect of tokenDoc.actor.effects ) {
            if ( !effect.isTemporary ) updatesEffects[effect.label] = warpgate.CONST.DELETE;
        }
        delete updatesActor.effects;
        delete updatesActor.items;
        
        // load images so we don't get weird errors.
        const callbackPre = async (loc, updates) => {
            // if a specific image was provided in update, use that.
            const provided = foundry.utils.getProperty(warpgateObjects, "updates.token.texture.src");
            if ( !!provided ) {
                await loadTexture(provided);
                foundry.utils.setProperty(updates, "token.texture.src", provided);
            }
            // else get the token image(s) and load it.
            else {
                const tokenImages = await mutateDoc.getTokenImages();
                const src = tokenImages[Math.floor(Math.random() * tokenImages.length)];
                await loadTexture(src);
                foundry.utils.setProperty(updates, "token.texture.src", src);
            }
        }
        const callbackPost = async () => {}
        
        // data to keep:
        const {
            actorLink,
            bar1,
            bar2,
            displayBars,
            displayName,
            disposition,
            elevation,
            lockRotation,
            sight,
            detectionModes
        } = tokenDoc;
        const {type} = tokenDoc.actor;
        
        // merge with passed objects:
        const mergeActor = foundry.utils.mergeObject({
            ...updatesActor, type
        }, (warpgateObjects.updates?.actor ?? {}));
        
        const mergeToken = foundry.utils.mergeObject({
            ...updatesToken, actorLink, bar1, bar2, displayBars,
            disposition, displayName, elevation, lockRotation, sight, detectionModes
        }, (warpgateObjects.updates?.token ?? {}));
        
        const mergeEmbedded = foundry.utils.mergeObject({
            Item: updatesItems,
            ActiveEffect: updatesEffects
        }, (warpgateObjects.updates?.embedded ?? {}));
        
        const mergeCallbacks = foundry.utils.mergeObject({
            pre: callbackPre,
            post: callbackPost
        }, (warpgateObjects.callbacks ?? {}));
        
        const mergeOptions = foundry.utils.mergeObject({
            comparisonKeys: {ActiveEffect: "label"},
            name: `Polymorph: ${name}`
        }, (warpgateObjects.options ?? {}));

        return warpgate.mutate(tokenDoc, {
            actor: mergeActor,
            token: mergeToken,
            embedded: mergeEmbedded
        }, mergeCallbacks, mergeOptions);    
    }
    
    // cast a spell directly from a compendium.
    static cast = async ({ name, catalog="spells", caster }={}, updates={}, config={}, options={}) => {
        const parent = caster?.actor ?? caster ?? canvas.tokens.controlled[0]?.actor ?? game.user.character;
        if ( !parent ) return ui.notifications.warn("No valid actor.");
        
        const object = await this.getDocument(name, catalog, true);
        if ( !object ) return ui.notifications.warn("Spell not found.");
        
        // fix for Roll Groups:
        if ( game.modules.get("rollgroups")?.active ) {
            if ( !object.flags["rollgroups"]?.config?.groups ) {
                const number_of_groups = object.system.damage?.parts?.length ?? 0;
                if ( number_of_groups > 0 ) {
                    object.flags["rollgroups"] = {
                        config: {
                            groups: Array.fromRange(number_of_groups).map(n => ({
                                label: "Damage", parts: [n]
                            }))
                        }
                    };
                }
            }
        }
        
        const original = foundry.utils.duplicate(object);
        let [spell] = await parent.createEmbeddedDocuments("Item", [object], { temporary: true });

        foundry.utils.mergeObject(object, updates);
        spell = spell.clone(object, { keepId: true });
        spell.prepareFinalAttributes(); // this fixes saving throw buttons.

        options = foundry.utils.mergeObject(options, {
            flags: { "dnd5e.itemData": original }
        });
        
        // Trigger the item roll (code modified from itemacro).
        if ( game.modules.get("itemacro")?.active && spell.hasMacro() ) {
            return spell.executeMacro();
        }
        return spell.use(config, options);
    }
    
    static castCharges = async ({ name, level, caster }, updates={}, config={}, options={}) => {
        updates = foundry.utils.mergeObject({
            "system.preparation.mode": "atwill",
            "system.level": level,
            "system.components.material": false,
            "system.materials": { consumed: false, cost: 0, supply: 0, value: "" }
        }, updates);
        return this.cast({ name, catalog: "spells", caster }, updates, config, options);
    }
}

export class ZHELL_UTILS {
    
    // execute an item's Item Macro if it has one, otherwise roll normally.
    static rollItemMacro = async (item, config={}, options={}) => {
        const itemMacro = game.modules.get("itemacro")?.active;
        if ( itemMacro && item.hasMacro() ) return item.executeMacro(options);
        else return item.use(config, options);
    }

    static setForageDC = async (number) => {
        if ( !game.user.isGM ) return ui.notifications.warn("Excuse me?");
        return game.settings.set(MODULE, FORAGING, number);
    }
    
    static teleportTokens = async (crosshairsConfig = {}, clearTargets = true, fade = true, fadeDuration = 500) => {
        const config = foundry.utils.mergeObject({
            size: 4,
            drawIcon: false,
            fillAlpha: 0.1,
            lockSize: false,
            label: "Pick Up Tokens"
        }, crosshairsConfig);
        // pick area of tokens.
        const origin = await warpgate.crosshairs.show(config);
        const { x: ox, y: oy, cancelled: oc } = origin;
        if ( oc ) return;
        
        // get the tokens.
        const tokenDocs = warpgate.crosshairs.collect(origin);
        game.user.updateTokenTargets(tokenDocs.map(i => i.id));
        
        // pick new area.
        const target = await warpgate.crosshairs.show({
            size: origin.size,
            drawIcon: false,
            fillAlpha: 0.1,
            lockSize: true,
            label: "Select Target"
        });
        const { x: nx, y: ny, cancelled: nc } = target;
        if ( nc ) return game.user.updateTokenTargets(); // clear targets.
        
        if ( clearTargets ) game.user.updateTokenTargets(); // clear targets.
        
        if ( fade ) {
            const sequence = new Sequence();
            for ( const tokenDoc of tokenDocs ) sequence.animation().on(tokenDoc).fadeOut(fadeDuration);
            await sequence.play();
            await warpgate.wait(fadeDuration);
        }
        
        // teleport!
        const updates = tokenDocs.map(tokenDoc => {
            const {_id, x, y} = tokenDoc;
            return {_id, x: x - ox + nx, y: y - oy + ny};
        });
        const update = await canvas.scene.updateEmbeddedDocuments("Token", updates, {animate: false});
        
        if ( fade ) {
            await warpgate.wait(fadeDuration);
            const sequence = new Sequence();
            for ( const tokenDoc of tokenDocs ) sequence.animation().on(tokenDoc).fadeIn(fadeDuration);
            await sequence.play();
        }
        
        return update;
    }
    
    static targetTokens = async (crosshairsConfig = {}) => {
        const config = foundry.utils.mergeObject({
            size: 4,
            drawIcon: false,
            fillAlpha: 0.1,
            lockSize: false,
            rememberControlled: true,
            label: "Pick Targets",
        }, crosshairsConfig);
        // pick area of tokens.
        const origin = await warpgate.crosshairs.show(config);
        if ( origin.cancelled ) return;
        
        // get the tokens.
        const tokenDocs = warpgate.crosshairs.collect(origin);
        const tokenIds = tokenDocs.map(i => i.id);
        game.user.updateTokenTargets(tokenIds);
        
        return tokenIds;
    }
    
    // takes an array of tokens or tokenDocuments and returns an array of player owner ids.
    static get_token_owner_ids = (tokens = [], excludeGM = false) => {
        const permissions = tokens.map(t => t.actor.ownership);
        const userIds = game.users.filter(user => {
            return permissions.some(permission => {
                return permission[user.id] === CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
            });
        }).map(i => i.id);
        if ( excludeGM ) return userIds.filter(i => !game.users.get(i).isGM);
        else return userIds;
    }
    
    // whisper players.
    static whisper_players = () => {
        const users = game.users.filter(u => u.id !== game.user.id);
        const characterIds = users.map(u => u.character?.id).filter(i => !!i);
        const selectedPlayerIds = canvas.tokens.controlled.map(i => {
            return i.actor.id;
        }).filter(i => {
            return characterIds.includes(i);
        });
        const options = users.reduce((acc, {id, name, character}) => {
            const checked = ( !!character && selectedPlayerIds.includes(character.id) ) ? "selected" : "";
            return acc + `<span class="whisper-dialog-player-name ${checked}" id="${id}">${name}</span>`;
        }, `<form><div class="form-fields whisper-dialog">`) + `</div></form>`;
        
        return new Dialog({
            title: "Whisper",
            content: `
                <p>Whisper to:</p>${options} <hr>
                <label for="zhell-whisper-message">Message:</label>
                <textarea
                    class="whisper-dialog-textarea"
                    id="zhell-whisper-message"
                    name="message"
                    rows="6"
                    cols="50"
                    autofocus
                ></textarea>
                <hr>
            `,
            buttons: {
                go: {
                    icon: `<i class="fas fa-envelope"></i>`,
                    label: "Whisper",
                    callback: async (html) => {
                        let content = html[0].querySelector("#zhell-whisper-message").value;
                        if ( !content ) return;

                        content = content.split("\n").reduce((acc, e) => {
                            return acc + `<p>${e}</p>`;
                        }, ``);
                        const whisperIds = new Set();
                        for ( const {id} of users ) {
                            if ( !!html[0].querySelector(`span[id="${id}"].selected`) ) {
                                whisperIds.add(id);
                            }
                        }
                        
                        const whisper = whisperIds.size > 0 ? Array.from(whisperIds) : [game.user.id];
                        await ChatMessage.create({ content, whisper });
                    }
                }
            },
            render: (html) => {
                html[0].addEventListener("click", (event) => {
                    let player = event.target.closest(".whisper-dialog-player-name");
                    if ( !player ) return;
                    player.classList.toggle("selected");
                });
            },
        }).render(true, { height: "auto" });
    }
    
    // function to wait for a specified amount of time.
    static wait = async (ms) => {
        return new Promise(resolve => setTimeout(resolve, Number(ms)));
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
        
        for ( const i of Object.keys(roman) ) {
            let q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        
        return str;
    }
    
    // load a texture for all clients.
    static async loadTextureForAll(src, push = true){
        if ( push ) {
            game.socket.emit(`world.${game.world.id}`, {
                action: "loadTextureForAll",
                data: { src }
            });
        }
        return loadTexture(src);
    }

    static async createTiles(tileData, push = true){
        if ( push ) {
            game.socket.emit(`world.${game.world.id}`, {
                action: "createTiles",
                data: { tileData }
            });
        }
        if ( game.user.isGM ) return canvas.scene.createEmbeddedDocuments("Tile", tileData);
    }

    // increase exhaustion.
    static increase_exhaustion = async (actor) => {
        if ( !(actor instanceof Actor) ) {
            ui.notifications.warn("Invalid actor provided.");
            return null;
        }
        
        // get current exhaustion effect, if any.
        const exhaustion = actor.effects.find(i => {
            return i.getFlag("core", "statusId") === "exhaustion";
        });

        // if exhausted, increase the level.
        if ( exhaustion ) {
            const currentLevel = exhaustion.getFlag(MODULE, "exhaustion");
            return this.update_exhaustion(currentLevel + 1, actor);
        }

        // if not exhausted, set to 1.
        if ( !exhaustion ) return this.update_exhaustion(1, actor);
    }

    // decrease exhaustion.
    static decrease_exhaustion = async (actor) => {
        if ( !(actor instanceof Actor) ) {
            ui.notifications.warn("Invalid actor provided.");
            return null;
        }
        
        // get current exhaustion effect, if any.
        const exhaustion = actor.effects.find(i => {
            return i.getFlag("core", "statusId") === "exhaustion";
        });

        // if exhausted, decrease the level.
        if ( exhaustion ) {
            const currentLevel = exhaustion.getFlag(MODULE, "exhaustion");
            return this.update_exhaustion(currentLevel - 1, actor);
        }

        // if not exhausted, error.
        ui.notifications.warn(`${actor.name} was not exhausted.`);
        return null;
    }

    // update or set exhaustion to specific level
    static update_exhaustion = async (num, actor) => {
        if ( !Array.fromRange(7).includes(num) ) {
            ui.notifications.warn("The provided level was not valid.");
            return null;
        }
        if ( !(actor instanceof Actor) ) {
            ui.notifications.warn("Invalid actor provided.");
            return null;
        }

        // attempt to find any current exhaustion effect.
        let exhaustion = actor.effects.find(i => {
            return i.getFlag("core", "statusId") === "exhaustion";
        });

        // if num===0, remove it.
        if ( num === 0 ) return exhaustion?.delete();

        // if num===6, remove it and apply dead.
        if ( num === 6 ) {
            await exhaustion?.delete();
            const dead = foundry.utils.duplicate(CONFIG.statusEffects.find(i => {
                return i.id === "dead";
            }));
            const coreFlag = { statusId: dead.id, overlay: true };
            foundry.utils.setProperty(dead, "flags.core", coreFlag);
            return actor.createEmbeddedDocuments("ActiveEffect", [dead]);
        }

        // if actor has exhaustion, update.
        if ( exhaustion ) {
            const { label, changes, flags } = EXHAUSTION_EFFECTS[num-1];
            await exhaustion.update({ label, changes, flags });
        }

        // if actor not already exhausted, find and apply.
        else if ( !exhaustion ) {
            exhaustion = foundry.utils.duplicate(EXHAUSTION_EFFECTS[num-1]);
            const coreFlag = { statusId: exhaustion.id };
            foundry.utils.setProperty(exhaustion, "flags.core", coreFlag);
            await actor.createEmbeddedDocuments("ActiveEffect", [exhaustion]);
        }

        // lastly, update actor hp.
        const { value, max } = actor.system.attributes.hp;
        const newValue = Math.floor(Math.min(value, max));
        return actor.update({ "system.attributes.hp.value": newValue });
    }

    // pop a title on each player's screen.
    static title_card = async (text, fontSize=80) => {
        if ( !text ) {
            ui.notifications.warn("No text given.");
            return null;
        }

        const textStyle = {
            align: "center",
            dropShadow: true,
            dropShadowAlpha: 0.5,
            dropShadowBlur: 5,
            dropShadowColor: "#1f1f1f",
            dropShadowDistance: 0,
            fill: "#5a5a5a",
            fontSize,
            lineJoin: "round",
            strokeThickness: 4,
            fontFamily: "Old Evils"
        }

        const sequence = new Sequence().effect()
            .text(text, textStyle)
            .screenSpace()
            .screenSpaceAnchor({ x: 0.5, y: 0.34 })
            .duration(12000)
            .fadeIn(2000)
            .fadeOut(2000);
        return sequence.play();
    }
}
