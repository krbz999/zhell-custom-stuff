CONFIG.statusEffects = [
	,{
		label: 'Exhaustion 1',
		"flags.convenientDescription": 'Disadvantage on all ability checks',
		icon: 'modules/dfreds-convenient-effects/images/exhaustion1.svg'
	},{
		label: 'Exhaustion 2',
		"flags.convenientDescription": 'Disadvantage on all ability checks and half movement',
		icon: 'modules/dfreds-convenient-effects/images/exhaustion2.svg'
	},{
		label: 'Exhaustion 3',
		"flags.convenientDescription": 'Disadvantage on all ability checks, half movement, disadvantage on all attacks, and disadvantage on all saving throws',
		icon: 'modules/dfreds-convenient-effects/images/exhaustion3.svg'
	},{
		label: 'Exhaustion 4',
		"flags.convenientDescription": 'Disadvantage on all ability checks, half movement, disadvantage on all attacks, disadvantage on all saving throws, and half HP',
		icon: 'modules/dfreds-convenient-effects/images/exhaustion4.svg',
		changes: [{
			key: 'data.attributes.hp.max',
			mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
			value: '0.5',
			priority: 5
		}]
	},{
		label: 'Exhaustion 5',
		"flags.convenientDescription": 'Disadvantage on all ability checks, zero movement, disadvantage on all attacks, disadvantage on all saving throws, and half HP',
		icon: 'modules/dfreds-convenient-effects/images/exhaustion5.svg',
		changes: [{
			key: 'data.attributes.hp.max',
			mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
			value: '0.5',
			priority: 5
		}]
	},,{
		label: 'Hard Target',
		"flags.convenientDescription": 'Grants disadvantage to all who attack',
		icon: 'systems/dnd5e/icons/spells/air-burst-sky-2.jpg'
	},{
		label: 'Easy Target',
		"flags.convenientDescription": 'Grants advantage to all who attack',
		icon: 'systems/dnd5e/icons/spells/fire-arrows-jade-2.jpg'
	},{
		label: 'Turned',
		"flags.convenientDescription": 'No active effects. Expires on taking damage',
		icon: 'systems/dnd5e/icons/skills/yellow_19.jpg'
	},{
		label: "Diseased",
		"flags.convenientDescription": "You have a disease.",
		icon: "modules/zhell-custom-stuff/images/symbols/condition_diseased.webp"
	}
];