/**
 * Make changes to the 5e system config.
 */
export default function systemChanges() {
  // Add to status conditions.
  CONFIG.DND5E.statusEffects.reaction = {
    hud: false,
    img: "systems/dnd5e/icons/svg/activity/forward.svg",
    name: "ZHELL.CONDITION.REACTION.NAME",
  };

  // Assign additional handlers to actor sheet.
  Object.assign(dnd5e.applications.actor.CharacterActorSheet.DEFAULT_OPTIONS.actions, {
    openCraftingMenu: function(event, target) {
      target.disabled = true;
      const application = new ZHELL.applications.apps.CraftingMenu({ document: this.document });
      application.render({ force: true }).then(() => target.disabled = false);
    },
    adjustPiety: function(event, target) {
      const path = "system.attributes.piety.value";
      const delta = parseInt(target.dataset.delta);
      const value = foundry.utils.getProperty(this.document, path);
      const next = value + delta <= 0 ? null : value + delta;
      this.document.update({ [path]: next });
    }
  });
}
