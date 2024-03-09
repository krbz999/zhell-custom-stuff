import {draconiz} from "./itemacros/boons/draconiz.mjs";
import {murk} from "./itemacros/boons/murk.mjs";
import {alchemist} from "./itemacros/features/artificer-alchemist.mjs";
import {twilight} from "./itemacros/features/cleric-twilight.mjs";
import {hearth} from "./itemacros/features/paladin-hearth.mjs";
import {paladin} from "./itemacros/features/paladin.mjs";
import {sorcerer} from "./itemacros/features/sorcerer.mjs";
import {wizard} from "./itemacros/features/wizard.mjs";
import {items} from "./itemacros/items.mjs";
import {poisons} from "./itemacros/items/poisons.mjs";
import {spells} from "./itemacros/spells.mjs";

// item, speaker, actor, token, character, event, args
export const ITEMACRO = {
  // class, subclass, and race features
  ...alchemist,
  ...twilight,
  ...hearth,
  ...paladin,
  ...sorcerer,
  ...wizard,
  // boons
  ...draconiz,
  ...murk,
  // items
  ...items,
  ...poisons,
  // spells
  ...spells,
};

export class ItemMacroHelpers {
  /**
   * Helper function to verify that all module dependencies are installed and active for a particular item macro.
   * @param {string[]} moduleIds      The array of module ids.
   * @returns {boolean}               Whether all the given modules are active.
   */
  static _getDependencies(...moduleIds) {
    let abi = true;
    for (const id of moduleIds) {
      if (!game.modules.get(id)?.active) {
        ui.notifications.warn(`Missing module for Item Macro: '${id}'.`);
        abi = false;
      }
    }
    return abi;
  }

  /**
   * Helper function to return a string of options for each spell slot level for which you have
   * slots available. Optionally instead levels for which you have expended spell slots.
   * Optionally with a maximum level.
   * @param {Actor} actor           The actor with spell slots.
   * @param {boolean} [missing]     Whether to instead find levels for which you have expended slots.
   * @param {number} [maxLevel]     The maximum spell slot level to use as an option.
   * @returns {object}              The select options.
   */
  static _constructSpellSlotOptions(actor, {missing = false, maxLevel = Infinity} = {}) {
    const isValid = (d) => {
      if (!d.level || !d.max || (d.level > maxLevel)) return false;
      if (missing) return (d.max - d.value) > 0;
      else return d.value > 0;
    };

    const spellLabel = (k, d) => {
      const type = /spell[0-9]+/.test(k) ? "DND5E.SpellLevelSlot" : `DND5E.SpellLevel${k.capitalize()}`;
      return game.i18n.format(type, {
        level: d.level,
        n: `${d.value}/${d.max}`
      });
    };

    return Object.entries(actor.system.spells).reduce((acc, [k, d]) => {
      if (isValid(d)) acc[k] = spellLabel(k, d);
      return acc;
    }, {});
  }

  /**
   * Helper function to get spell level of the returned value from Item5e#use.
   * @param {ChatMessage|object} use      The returned value from an item usage.
   * @returns {number}                    The level at which an item was used.
   */
  static _getSpellLevel(use) {
    return use.flags?.dnd5e?.use?.spellLevel ?? 0;
  }

  /**
   * Helper function to create very basic form for a Dialog.
   * @param {string} [label=""]             The label before the select/input.
   * @param {string} [type="text"]          The type of input ('text', 'number', 'select').
   * @param {string} [options=""]           The string of options in case of a select input.
   * @param {boolean} [autofocus=true]      Whether to add autofocus to the created input.
   * @returns {string}                      The dialog content.
   */
  static _basicFormContent({label = "", type = "text", options = "", autofocus = true}) {
    const lab = label.length ? `<label>${label}</label>` : "";
    const auto = autofocus ? "autofocus" : "";
    const inp = {
      "select": `<select ${auto}>${options}</select>`,
      "number": `<input type="number" ${auto}>`
    }[type] ?? `<input type="text" ${auto}>`;
    return `
    <form class="dnd5e">
      <div class="form-group">
        ${lab}
        <div class="form-fields">${inp}</div>
      </div>
    </form>`;
  }

  /**
   * Draw a circle around a token placeable.
   * @param {Token} token         A token placeable.
   * @param {number} radius       The radius of the circle (in ft).
   * @returns {PIXIGraphics}      The pixi graphics element.
   */
  static drawCircle(token, radius) {
    const {x, y} = token.center;
    const tokenRadius = Math.abs(token.document.x - x);
    const pixels = radius * canvas.scene.dimensions.distancePixels + tokenRadius;
    const color = game.user.color.replace("#", "0x");
    const p = new PIXI.Graphics()
      .beginFill(color, 0.5).drawCircle(x, y, pixels).endFill()
      .beginHole().drawCircle(x, y, pixels - 5).endHole();
    canvas.app.stage.addChild(p);
    return p;
  }

  /**
   * Pick a position within a certain number of feet from a token.
   * @param {Token} token                   The token origin.
   * @param {number} radius                 The maximum radius, in feet.
   * @param {object} config                 Additional options to configure the workflow.
   * @param {string} config.type            The type of restriction ('move' or 'sight').
   * @param {boolean} config.showImage      Show the given image on the cursor.
   * @param {string} config.img             The image to show on the cursor, if any.
   * @param {color} config.red              The color used for invalid positions.
   * @param {color} config.grn              The color used for valid positions.
   * @param {number} config.alpha           The opacity of the drawn shapes.
   * @param {boolean} config.highlight      Highlight the gridspace of the current position.
   * @param {number} config.width           The width of the position picker.
   * @param {number} config.height          The height of the position picker.
   * @returns {Promise<object|null>}        A promise that resolves to an object of coordinates.
   */
  static async pickPosition(token, radius, config = {}) {
    config = foundry.utils.mergeObject({
      type: "move",
      showImage: true,
      img: token.document.texture.src,
      red: 0xFF0000,
      grn: 0x00FF00,
      alpha: 0.5,
      highlight: true,
      width: token.document.width,
      height: token.document.height
    }, config);

    const pointerSprite = new PIXI.Sprite(await loadTexture(config.img));
    const name = `pick-position.${token.id}`;
    const layer = canvas.grid.addHighlightLayer(name);

    const getPosition = (x, y) => {
      const types = CONST.GRID_TYPES;
      if (canvas.scene.grid.type === types.GRIDLESS) {
        return {x: Math.roundDecimals(x, 2), y: Math.roundDecimals(y, 2)};
      } else {
        return canvas.grid.getSnappedPosition(x, y);
      }
    };

    return new Promise(resolve => {
      const c = token.center;
      const pixels = radius * canvas.scene.dimensions.distancePixels + Math.abs(token.document.x - c.x);

      async function onClick() {
        const x = canvas.mousePosition.x - Math.abs(token.document.x - c.x);
        const y = canvas.mousePosition.y - Math.abs(token.document.y - c.y);
        const targetLoc = getPosition(x, y);
        resolve(targetLoc);
        drawing.destroy();
        canvas.app.ticker.remove(pointerImage);
        canvas.grid.clearHighlightLayer(name);
        pointerSpriteContainer.destroy();
      }

      function pointerImage(delta) {

        const x = canvas.mousePosition.x - pointerSprite.width / 2;
        const y = canvas.mousePosition.y - pointerSprite.height / 2;
        const pos = getPosition(x, y);
        canvas.grid.clearHighlightLayer(name);

        if (config.showImage) {
          pointerSpriteContainer.x = pos.x;
          pointerSpriteContainer.y = pos.y;
        }

        if (config.highlight) {
          for (let i = 0; i < config.width; i++) {
            for (let j = 0; j < config.height; j++) {
              canvas.grid.highlightPosition(name, {
                x: pos.x + i * canvas.dimensions.size,
                y: pos.y + j * canvas.dimensions.size
              });
            }
          }
        }
      }

      function cancel() {
        resolve(null)
        drawing.destroy();
        canvas.app.ticker.remove(pointerImage);
        pointerSpriteContainer.destroy();
        canvas.grid.clearHighlightLayer(name);
      }

      const drawing = new PIXI.Graphics();
      const pointerSpriteContainer = new PIXI.Container();

      pointerSprite.width = token.w;
      pointerSprite.height = token.h;
      pointerSprite.alpha = config.alpha;
      pointerSpriteContainer.addChild(pointerSprite);
      pointerSpriteContainer.visible = config.showImage;
      pointerSpriteContainer.eventMode = "none"
      canvas.controls.addChild(pointerSpriteContainer);
      canvas.app.ticker.add(pointerImage);

      const movePoly = CONFIG.Canvas.polygonBackends[config.type].create(c, {
        type: config.type, hasLimitedRadius: true, radius: pixels
      });

      drawing.eventMode = "dynamic";
      drawing.beginFill(0xFFFFFF, 0.2);
      drawing.drawShape(movePoly);
      drawing.endFill();
      drawing.tint = drawing.containsPoint(canvas.mousePosition) ? config.grn : config.red;
      drawing.cursor = "pointer";
      drawing.alpha = config.alpha;
      drawing.on('click', onClick);
      drawing.on('pointerover', () => {
        drawing.tint = config.grn;
        pointerSpriteContainer.visible = config.showImage;
      });
      drawing.on('pointerout', () => {
        drawing.tint = config.red;
        pointerSpriteContainer.visible = false;
      });
      drawing.on('rightclick', cancel);
      canvas.tokens.addChild(drawing);
    });
  }
}
