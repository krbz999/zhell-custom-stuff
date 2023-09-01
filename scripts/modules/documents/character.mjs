export default class ActorExtension {
  static init() {
    CONFIG.Actor.documentClass = class Actor5e extends CONFIG.Actor.documentClass {
      prepareDerivedData() {
        super.prepareDerivedData();
      }

      get babonus() {
        const babonus = game.modules.get("babonus")?.api;
        if (!babonus) return null;
        return babonus.getCollection(this);
      }
    }
  }
}
