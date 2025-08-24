/**
 * Make changes to the 5e system config.
 */
export default function systemChanges() {
  // Add to status conditions.
  CONFIG.DND5E.conditionTypes.reaction = {
    id: "reaction",
    name: "ZHELL.CONDITION.REACTION.NAME",
    img: "systems/dnd5e/icons/svg/activity/forward.svg",
    duration: { rounds: 1 },
    description: "<p>You have spent your reaction. You cannot take another reaction until the start of your next turn.</p>",
  };

  // Assign additional handlers to actor sheet.
  Object.assign(dnd5e.applications.actor.CharacterActorSheet.DEFAULT_OPTIONS.actions, {
    openCraftingMenu: function(event, target) {
      target.disabled = true;
      const application = new ZHELL.applications.apps.CraftingMenu({ document: this.document });
      application.render({ force: true }).then(() => target.disabled = false);
    },
    showPietyConfiguration: function(event, target) {
      const application = new ZHELL.applications.apps.PietyConfig({ document: this.document });
      application.render({ force: true });
    },
  });

  // Wrap character actor sheet prep to move boons.
  const original = dnd5e.applications.actor.CharacterActorSheet.prototype._prepareFeaturesContext;
  dnd5e.applications.actor.CharacterActorSheet.prototype._prepareFeaturesContext = async function(context, options) {
    context = await original.call(this, context, options);

    const Inventory = customElements.get(this.options.elements.inventory);
    const columns = Inventory.mapColumns([{ id: "uses", order: 200 }, "recovery", "controls"]);
    const sections = [{
      columns,
      id: "boons",
      label: "Boons",
      order: 2500,
      groups: { origin: "boons" },
    }];
    context.sections.push(...Inventory.prepareSections(sections));

    return context;
  };

  const _original = dnd5e.applications.actor.CharacterActorSheet.prototype._prepareItemFeature;
  dnd5e.applications.actor.CharacterActorSheet.prototype._prepareItemFeature = async function(item, ctx) {
    await _original.call(this, item, ctx);
    if (item.type === "facility") return;
    if (item.img.includes("havilon")) ctx.groups.origin = "boons";
  };
}
