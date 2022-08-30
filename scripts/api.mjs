import { ZHELL_CATALOG, ZHELL_REST, ZHELL_UTILS } from "./modules/zhell_functions.mjs";
import { EXHAUSTION_EFFECTS } from "../sources/conditions.js";
import { ZhellDialog } from "./modules/zhell-dialog.mjs";

export class api {
	
	static register(){
		globalThis.ZHELL = {
			setting: {
				toggleLR: ZHELL_REST.toggleLR,
				toggleSR: ZHELL_REST.toggleSR,
				setForageDC: ZHELL_UTILS.setForageDC
			},
			catalog: {
				getDocument: ZHELL_CATALOG.getDocument,
				spawn: ZHELL_CATALOG.spawn,
				mutate: ZHELL_CATALOG.mutate,
				cast: ZHELL_CATALOG.cast,
				castCharges: ZHELL_CATALOG.castCharges
			},
			token: {
				teleport: ZHELL_UTILS.teleportTokens,
				target: ZHELL_UTILS.targetTokens,
				damage: ZHELL_UTILS.apply_damage,
				getOwnerIds: ZHELL_UTILS.get_token_owner_ids
			},
			helper: {
				wait: ZHELL_UTILS.wait,
				nth: ZHELL_UTILS.nth,
				roman: ZHELL_UTILS.romanize,
				rollItemMacro: ZHELL_UTILS.rollItemMacro,
				whisperPlayers: ZHELL_UTILS.whisper_players,
				loadTextureForAll: ZHELL_UTILS.loadTextureForAll,
				createTiles: ZHELL_UTILS.createTiles,
				titleCard: ZHELL_UTILS.title_card,
				dialog: ZhellDialog
			},
			exhaustion: {
				increase: ZHELL_UTILS.increase_exhaustion,
				decrease: ZHELL_UTILS.decrease_exhaustion,
				update: ZHELL_UTILS.update_exhaustion,
				effects: EXHAUSTION_EFFECTS
			}
		}
	}
}
