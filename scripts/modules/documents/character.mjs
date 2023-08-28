import {InventorySectionConfig} from "../applications/inventory-section-config.mjs";

export default class ActorExtension {
  static init() {
    CONFIG.Actor.documentClass = class Actor5e extends CONFIG.Actor.documentClass {
      prepareDerivedData() {
        super.prepareDerivedData();
      }

      /**
       * Configure custom inventory sections on this sheet.
       */
      configureInventorySections() {
        return new InventorySectionConfig(this).render(true);
      }
    }
  }
}
