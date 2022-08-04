export class ZhellDialog extends Dialog {
	constructor(data, options) {
		super(options);
		this.data = data;
	}
	
	/**
	* @override
	* @returns {DialogOptions}
	*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "templates/hud/dialog.html",
			classes: ["dialog", "zhell-dialog"],
			width: 300,
			height: "auto",
			jQuery: true
		});
	}
}
