import { MODULE } from "../const.mjs";

// Handles setting up all handlebar helpers
export class HandlebarHelpers {
    // Registers the handlebar helpers
    registerHelpers(){
        this._registerRemainingTimeLabelHelper();
        this._registerEncodingDescription();
    }
    
    _registerRemainingTimeLabelHelper(){
        Handlebars.registerHelper("remainingTimeLabel", (effect) => {
            
            const SECONDS = {
                IN_ONE_ROUND: 6,
                IN_ONE_MINUTE: 60,
                IN_TWO_MINUTES: 120,
                IN_ONE_HOUR: 3_600,
                IN_TWO_HOURS: 7_200,
                IN_ONE_DAY: 86_400,
                IN_TWO_DAYS: 172_800,
                IN_ONE_WEEK: 604_800,
                IN_TWO_WEEKS: 1_209_600,
                IN_ONE_YEAR: 31_536_000,
                IN_TWO_YEARS: 63_072_000
            }
            
            const remainingSeconds = effect.remainingSeconds;
            
            if ( remainingSeconds == Infinity && effect.turns ) {
                if ( effect.turns == 1 ) return "1 turn";
                else return `${effect.turns} turns`;
            }
            else if ( remainingSeconds == Infinity ) return "Unlimited";
            else if ( remainingSeconds >= SECONDS.IN_TWO_YEARS ) return `${Math.floor(remainingSeconds / SECONDS.IN_ONE_YEAR)} years`;
            else if ( remainingSeconds >= SECONDS.IN_ONE_YEAR ) return "1 year";
            else if ( remainingSeconds >= SECONDS.IN_TWO_WEEKS ) return `${Math.floor(remainingSeconds / SECONDS.IN_ONE_WEEK)} weeks`;
            else if ( remainingSeconds >= SECONDS.IN_ONE_WEEK ) return "1 week";
            else if ( remainingSeconds >= SECONDS.IN_TWO_DAYS ) return `${Math.floor(remainingSeconds / SECONDS.IN_ONE_DAY)} days`;
            else if ( remainingSeconds >= SECONDS.IN_TWO_HOURS ) return `${Math.floor(remainingSeconds / SECONDS.IN_ONE_HOUR)} hours`;
            else if ( remainingSeconds >= SECONDS.IN_TWO_MINUTES ) return `${Math.floor(remainingSeconds / SECONDS.IN_ONE_MINUTE)} minutes`;
            else if ( remainingSeconds >= 2 ) return `${remainingSeconds} seconds`;
            else if ( remainingSeconds === 1 ) return "1 second";
            else return "Expired";
        });
    }
    
    _registerEncodingDescription(){
        Handlebars.registerHelper("encodeMyString", function(inputData){
            return new Handlebars.SafeString(inputData);
        });
    }
}

export class EffectsPanelController {
    /**
     * Initializes the controller and its dependencies
     *
     * @param {EffectsPanelController} viewMvc - the app that the controller can interact with
     */
    constructor(viewMvc){
        this._viewMvc = viewMvc;
    }
    
    get data(){
        return {
            enabledEffects: this._actorEffects.filter((effectData) => !effectData.disabled),
            disabledEffects: this._actorEffects.filter((effectData) => effectData.disabled)
        }
    }
    
    get _actorEffects(){
        const actor = this._actor;
        if ( !actor ) return [];
        
        return actor.effects.map((effect) => {
            const effectData = effect.clone({}, {keepId: true});
            effectData.remainingSeconds = this._getSecondsRemaining(effectData.duration);
            effectData.turns = effectData.duration.turns;
            effectData.isExpired = effectData.remainingSeconds <= 0;
            return effectData;
        }).sort((a, b) => {
            if ( a.isTemporary ) return -1;
            if ( b.isTemporary ) return 1;
            return 0;
        }).filter((effectData) => {
            return !!effectData.isTemporary;
        });
    }
    
    // delete on right-click.
    async onIconRightClick(event){
        const div = event.target.closest("div[data-effect-id]");
        if ( !div ) return;
        const effectId = div.dataset.effectId;
        const effect = this._actor.effects.get(effectId);
        if ( !effect ) return;
        
        await Dialog.confirm({
            title: "Delete Effect",
            content: `<h4>Delete ${effect.label}?</h4>`,
            yes: async () => {
                await effect.delete();
                this._viewMvc.refresh();
            }
        });
    }
    
    // disable effect on double-click.
    onIconDoubleClick(event){
        const div = event.target.closest("div[data-effect-id]");
        if ( !div ) return;
        const effectId = div.dataset.effectId;
        const effect = this._actor.effects.get(effectId);
        if ( !effect ) return;
        return effect.update({ disabled: !effect.disabled });
    }
    
    get _actor(){
        return canvas.tokens.controlled[0]?.actor ?? game.user.character ?? null;
    }
    
    _getSecondsRemaining(duration){
        if ( duration.seconds || duration.rounds ) {
            const seconds = duration.seconds ?? duration.rounds * (CONFIG.time.roundTime ?? 6);
            return duration.startTime + seconds - game.time.worldTime;
        } else return Infinity;
    }
    
}

// Application class for handling the UI of the effects panel
export class EffectsPanelApp extends Application {
    static get defaultOptions(){
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "effects-panel",
            popOut: false,
            template: `modules/${MODULE}/templates/effects-panel.hbs`
        });
    }
    
    // Initializes the application and its dependencies
    constructor(){
        super();
        this._controller = new EffectsPanelController(this);
        
        // Debounce and slightly delayed request to re-render this panel.
        // Necessary for situations where it is not possible to properly wait for promises to resolve before refreshing the UI.
        this.refresh = foundry.utils.debounce(this.render.bind(this), 100);
        this._initialSidebarWidth = ui.sidebar.element.outerWidth();
    }
    
    /** @override */
    async getData(options){
        const enabledEffects = [];
        const disabledEffects = [];

        // set up enable effects.
        for ( const eff of this._controller.data.enabledEffects ) {
            let desc = foundry.utils.getProperty(eff, "flags.convenientDescription");
            const {_id, icon, label, isTemporary, isExpired, remainingSeconds, turns} = eff;
            const effect = {_id, icon, label, isTemporary, isExpired, remainingSeconds, turns};
            if ( !!desc ) effect.desc = await TextEditor.enrichHTML(desc, {async: true});
            enabledEffects.push(effect);
        }
        
        for ( const eff of this._controller.data.disabledEffects ) {
            let desc = foundry.utils.getProperty(eff, "flags.convenientDescription");
            const {_id, icon, label, isTemporary, isExpired, remainingSeconds, turns} = eff;
            const effect = {_id, icon, label, isTemporary, isExpired, remainingSeconds, turns};
            if ( !!desc ) effect.desc = await TextEditor.enrichHTML(desc, {async: true});
            disabledEffects.push(effect);
        }
        const data = {enabledEffects, disabledEffects};
        return data;
    }
    
    /** @override */
    activateListeners(html){
        html[0].addEventListener("contextmenu", this._controller.onIconRightClick.bind(this._controller));
        html[0].addEventListener("dblclick", this._controller.onIconDoubleClick.bind(this._controller));
    }
    
    // Handles when the sidebar expands or collapses. true: collapse, false: expand.
    handleExpand(bool){
        if ( !bool ) {
            const right = `${this._initialSidebarWidth + 18}px`;
            this.element.animate({ right }, 150);
        } else this.element.delay(250).animate({ right: "50px" }, 150);
    }
    
    /** @inheritdoc */
    async _render(force = false, options = {}){
        await super._render(force, options);
        if ( ui.sidebar._collapsed ) this.element.css("right", "50px");
        else this.element.css("right", `${this._initialSidebarWidth + 18}px`);
    }
    
}

export class ZHELL_EFFECTS_PANEL {
    static createEffectsPanel = () => {
        this.effectsPanel = new EffectsPanelApp();
    }
}

// function to create input field on active effect configs.
export function createEffectTextField(sheet, html){
    const table = html[0].querySelector(".effect-change.effects-header.flexrow");
    const div = document.createElement("DIV");
    div.classList.add("zhell-effect-description");
    const desc = sheet.object.flags.convenientDescription ?? "";
    div.innerHTML = `<input type="text" name="flags.convenientDescription" value="${desc}" placeholder="Description...">`;
    table.before(div);
}
