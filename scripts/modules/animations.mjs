export class ZHELL_ANIMATIONS {
  static onCreateMeasuredTemplate(templateDoc, _, userId) {
    if (userId !== game.user.id) return;

    const uuid = templateDoc.getFlag("dnd5e", "origin");
    if (!uuid) return;

    const item = fromUuidSync(uuid);
    if (!item || !(item instanceof Item)) return;

    // BREATH WEAPON.
    const type = item.getFlag("world", "breath-weapon.type");
    if (type) {
      return new Sequence().effect().file(type).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // SCORCHING CLEAVER.
    const name = item.name.includes("Erupting Slash");
    if (name) {
      const file = "jb2a.fire_jet.orange";
      return new Sequence().effect().file(file).atLocation(templateDoc).stretchTo(templateDoc).play();
    }

    // CALL LIGHTNING
    const callLightning = item.name.includes("Call Lightning");
    if (callLightning) {
      const file = "jb2a.lightning_strike.blue.0";
      return new Sequence().effect().file(file).atLocation(templateDoc).scale(2).play();
    }
  }

  static onItemRollAttack(item, roll, ammo) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    if (name === "Eldritch Blast") {
      if(!target || !token) return;
      const file = "jb2a.eldritch_blast.rainbow";
      return new Sequence().effect().stretchTo(target).atLocation(token).file(file).play();
    }
  }

  static onItemRollDamage(item, roll) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    if (name === "Healing Word" && actor.name.includes("Arkorow")) {
      const file1 = "jb2a.healing_generic.400px.yellow";
      const file2 = "jb2a.butterflies.few.bright_orange";
      if (target) {
        return new Sequence()
          .effect().attachTo(target).file(file1).scaleIn(0, 500)
          .effect().attachTo(target).file(file2).scaleIn(0, 500).fadeOut(500)
          .play();
      } else if (token) {
        return new Sequence().effect().attachTo(token).file(file2).scaleIn(0, 500).fadeOut(500).play();
      }
    } else if (name === "Healing Word" && actor.name.includes("Devinn")) {
      if (!target) return;
      const file = "jb2a.cure_wounds.400px.red";
      return new Sequence().effect().attachTo(target).file(file).scaleIn(0, 500).play();
    } else if (name === "Eldritch Smite") {
      if (!target) return;
      const file = "jb2a.divine_smite.target.purplepink";
      return new Sequence().effect().attachTo(target).file(file).play();
    }
  }

  static onItemUse(item) {
    const { name, actor } = item;
    if (!actor) return;
    const token = actor.token?.object ?? actor.getActiveTokens()[0];
    const target = game.user.targets.first();

    if (name.startsWith("Call of the ")) {
      if (!token) return;
      const file = "assets/images/tiles/symbols/holy/hav_draconiz_gold.webp";
      return new Sequence().effect()
        .file(file).duration(2000).atLocation(token).scaleIn(.5, 2000)
        .size(2.5, { gridUnits: true }).fadeIn(500).fadeOut(500).play();
    } else if (name === "Spotlight") {
      if (!token) return;
      const file = "jb2a.template_circle.out_pulse.01.burst.bluewhite";
      return new Sequence().effect().file(file).atLocation(token).scale(0.75).play();
    } else if (name === "Pipe" && actor.name.includes("Drazvik")) {
      if (!token) return;
      const file = "jb2a.smoke.puff.centered.dark_green.1";
      return new Sequence().effect().file(file).atLocation(token, {
        offset: { x: canvas.grid.size / 3, y: -canvas.grid.size / 4 }
      }).size(canvas.grid.size).play();
    }
  }

  static collapsibleSetup() {
    document.addEventListener("click", (event) => {
      const t = event.target.closest(".zhell-collapsible-header");
      if (!t) return;
      t.closest(".zhell-collapsible").classList.toggle("active");
    });
  }
}

export function _initD20(dice3d) {
  dice3d.addSystem({ id: "zhell-custom-stuff", name: "The Rollsmith - Package Jam 2022" }, false);
  dice3d.addDicePreset({
    type: "d20",
    labels: "",
    modelFile: "assets/animations/dice/dice_20.gltf",
    system: "zhell-custom-stuff"
  });
}

Hooks.on("renderJournalPageSheet", function(app, html) {
  if (app.object.parent.name !== "Index: Available Classes") return;
  const spells = html[0].querySelectorAll("a.content-link[data-pack='zhell-catalogs.spells']");
  spells.forEach(s => {
    const A = document.createElement("A");
    A.classList.add("spell-desc-toggle");
    A.setAttribute("data-uuid", s.dataset.uuid);
    A.innerHTML = "<i class='fa-solid fa-plus'></i>";
    s.after(A);
  });

  html[0].addEventListener("click", async (event) => {
    const a = event.target.closest(".spell-list .sub-spell-list .spell-desc-toggle");
    if (!a) return;
    const uuid = a.dataset.uuid;
    const shown = html[0].querySelector(`.spell-description[data-uuid='${uuid}']`);
    if (shown) return shown.remove();
    const p = a.closest("p");
    const spell = await fromUuid(uuid);
    const desc = spell.system.description.value;
    const DIV = document.createElement("DIV");
    DIV.innerHTML = desc;
    DIV.classList.add("spell-description");
    DIV.setAttribute("data-uuid", uuid);
    p.appendChild(DIV);
  });
});

Hooks.on("renderJournalPageSheet", function(app, html) {
  if (app.object.parent.name !== "Index: Table Rules") return;
  if (app.object.name !== "Equipment") return;
  html[0].addEventListener("click", (event) => {
    event.target.closest(".zhell-equipment-tables :is(h1,h2,h3)")?.classList.toggle("collapsed");
  });
});

Hooks.on("preUpdateToken", function(doc, update) {
  if (doc.lockRotation) return;
  if (!foundry.utils.hasProperty(update, "x") && !foundry.utils.hasProperty(update, "y")) return;
  const ray = new Ray(doc, { x: update.x ?? doc.x, y: update.y ?? doc.y });
  update.rotation = ray.angle * 180 / Math.PI - 90;
});
