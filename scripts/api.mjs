import { ZHELL } from "./zhell-custom-stuff.mjs";

export class api {
	
	static register(){
		globalThis.ZHELL = {
			setting: {
				toggleLR: ZHELL.toggleLR,
				toggleSR: ZHELL.toggleSR,
				setForageDC: ZHELL.setMateriaMedicaForagingDC
			},
			catalog: {
				from: ZHELL.fromCatalog,
				spawn: ZHELL.spawnFromCatalog,
				mutate: ZHELL.mutateFromCatalog,
				cast: ZHELL.castFromCatalog,
				castCharges: ZHELL.magicItemCast
			},
			token: {
				teleport: ZHELL.teleportTokens,
				target: ZHELL.targetTokens,
				damage: ZHELL.apply_damage,
				getOwnerIds: ZHELL.get_token_owner_ids
			},
			helper: {
				wait: ZHELL.wait,
				nth: ZHELL.nth,
				roman: ZHELL.romanize,
				rollItemMacro: ZHELL.rollItemMacro,
				whisperPlayers: ZHELL.whisper_players
			}
		}
	}
}
