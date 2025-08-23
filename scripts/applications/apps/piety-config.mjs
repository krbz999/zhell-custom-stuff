const { NumberField, StringField } = foundry.data.fields;

/**
 * Configuration application for an actor's piety attribute.
 */
export default class PietyConfig extends dnd5e.applications.actor.BaseConfigSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    position: {
      width: 420,
    },
  };

  /* -------------------------------------------- */

  /** @override */
  static PARTS = {
    config: {
      template: "modules/zhell-custom-stuff/templates/apps/piety-config/config.hbs",
    },
  };

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.localize("ZHELL.PIETY.CONFIG.title");
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    const source = this.document.getFlag(ZHELL.id, "piety") ?? { value: 0, deity: "" };

    context.data = source;
    context.fields = {
      value: new NumberField({ min: 0, nullable: false, integer: true }),
      deity: new StringField({ required: true, blank: true }),
    };
    context.deityOptions = Object.entries(ZHELL.config.pietyDeities).map(([k, v]) => ({ value: k, label: v.label }));

    if (context.data.deity && !(context.data.deity in ZHELL.config.pietyDeities)) {
      context.deityOptions.unshift({ value: context.data.deity, label: context.data.deity });
    }

    return context;
  }
}
