import { ZHELL } from "./zhell-custom-stuff.mjs";

export class api {
	
	static register(){
		api.globals();
	}
	
	static globals(){
		globalThis.ZHELL = {
			toggleLR: ZHELL.toggleLR,
			toggleSR: ZHELL.toggleSR,
			fromCatalog: ZHELL.fromCatalog,
			spawnCatalog: ZHELL.spawnFromCatalog,
			mutateCatalog: ZHELL.mutateFromCatalog,
			castCatalog: ZHELL.castFromCatalog,
			castCharges: ZHELL.magicItemCast,
			setForageDC: ZHELL.setMateriaMedicaForagingDC,
			rollItemMacro: ZHELL.rollItemMacro
		};
	}
}