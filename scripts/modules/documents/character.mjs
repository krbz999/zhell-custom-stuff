export default class ActorExtension {
  static init() {
    CONFIG.Actor.documentClass = class Actor5e extends CONFIG.Actor.documentClass {
      prepareDerivedData() {
        super.prepareDerivedData();
      }
    }
  }
}
