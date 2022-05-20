import { ZHELL } from "./zhell-custom-stuff.mjs";

export class api {
	
	static register(){
		api.globals();
	}
	
	static globals(){
		globalThis.ZHELL = {
			toggleLR: ZHELL.toggleLR,
			toggleSR: ZHELL.toggleSR
		};
	}
}