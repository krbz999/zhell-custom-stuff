//STILL ISSUES WHEN NO TOKEN IS USED FOR START POS.

export class PickPosition {
  /**
  * Pick a position within a certain number of feet from a token.
  * @param {Token} token                   The token origin.
  * @param {number} radius                 The maximum radius, in feet.
  * @param {object} config                 Additional options to configure the workflow.
  * @param {string} config.icon            Path of an icon image to show if showIcon is true.
  * @param {string} config.type            The type of restriction ('move' or 'sight').
  * @param {boolean} config.showToken      Show the token's image on the cursor.
  * @param {boolean} config.showIcon       Show icon image on the cursor.
  * @param {boolean} config.showLabel      Show label on the cursor.
  * @param {color} config.invalidColor     The color used for invalid positions.
  * @param {color} config.validColor       The color used for valid positions.
  * @param {number} config.alpha           The opacity of the drawn shapes.
  * @param {boolean} config.highlight      Highlight the gridspace of the current position.
  * @param {string} config.cursor		 	     CSS style name for mouse cursor type (default "pointer").
  * @param {string|function} config.label  Custom label ... Has to be set after creating the PickPosition instance if you want to use the distance function, function has to return a string or number.
  *
  * @returns {Promise<object|null>}        A promise that resolves to an object of coordinates.
  */
  constructor({token = null, radius = 30, config = {}, startPosition = {x: 0, y: 0}} = {}) {
    this.token = canvas.tokens.controlled[0] ?? token;
    this.radius = radius;
    this.config = config;
    this.startPosition = this.token ? this.token.center : startPosition;
  }
  /**
   * PIXI Graphics - created by pickPosition based of vision or move limits.
   */
  #drawing = null;
  /**
   * PIXI Container - created by pickPosition
   */
  #pointerSpriteContainer = null;
  /**
   * PIXI Sprite - created by pickPosition based on token.
   */
  #pointerSpriteToken = null;
  /**
   * PIXI Sprite - created by pickPosition based on icon.
   */
  #pointerSpriteIcon = null;
  /**
   * PreciseText - created by pickPosition based on Label
   */
  #pointerLabel = null;
  /**
   * Boolean whether highlighting the grid should be on or off
   */
  #highlightOn = true;
  /**
   * Boolean based on ray between pointer and origin being blocked or not.
   */
  #blocked = false;
  /**
   * Boolean based on whether pointer is inside vision range or outside
   */
  #outside = false;
  /**
   * String - created by pickPostion based on Token id or icon name
   */
  #highlightName = null;
  /**
   * Number - radius in pixels
   */
  #pixels = null;
  /**
   * Object - result of pickPosition {x: number, y: number}
   */
  endPosition = null;
  /**
  * Object - startPosition, either from token or set via config
  */
  set c(value) {this.startPosition = value;}
  get c() {return this.startPosition;}

  async pickPosition() {
    this.config = foundry.utils.mergeObject({
      type: "move",
      showToken: true,
      showLabel: true,
      label: () => `${this.distance()}${canvas.scene.grid.units}.`,
      showIcon: false,
      icon: null,
      invalidColor: new Color(0xFF0000),
      validColor: new Color(0x00FF00),
      alpha: 0.75,
      highlight: true,
      cursor: "pointer",
      useGridDistance: true
    }, this.config);
    this.config.showIcon = (this.config.icon && this.config.showIcon);
    this.config.showToken = (this.token && this.config.showToken);

    const baseTextureToken = this.token ? PIXI.utils.BaseTextureCache[this.token.document.texture.src] ?? this.token.document.texture.src : null;
    const baseTextureIcon = this.config.icon ? PIXI.utils.BaseTextureCache[this.config.icon] ?? this.config.icon : null;
    this.#pointerSpriteToken = this.config.showToken && baseTextureToken ? PIXI.Sprite.from(baseTextureToken) : null;
    this.#pointerSpriteIcon = this.config.showIcon && baseTextureIcon ? PIXI.Sprite.from(baseTextureIcon) : null;
    this.#highlightName = this.config.highlight && this.token ? `pick-position-${this.token.id}` : this.config.highlight && !this.token && this.config.icon ? `pick-position-${AudioHelper.getDefaultSoundName(this.config.icon)}` : null;
    this.#pixels = this.token ? this.radius * canvas.scene.dimensions.distancePixels + Math.abs(this.token.x - this.c.x) : this.radius * canvas.scene.dimensions.distancePixels;

    // get the value for where you picked.
    this.endPosition = await new Promise(resolve => {
      this.resolve = resolve; // adds the resolve to the picker instance so i can reference it in called functions.

      // set up the sprite and labels, move to separate functions?
      this.#pointerSpriteContainer = (this.config.showLabel || this.config.showToken || this.config.showIcon) ? new PIXI.Container() : null; // if one is true then we make the container
      if (this.config.showToken) {
        this.#pointerSpriteToken.width = this.token.w;
        this.#pointerSpriteToken.height = this.token.h;
        this.#pointerSpriteToken.alpha = this.config.alpha;
        this.#pointerSpriteContainer.addChild(this.#pointerSpriteToken);
      }
      if (this.config.showLabel) {
        this.#pointerLabel = new PreciseText(``, CONFIG.canvasTextStyle);
        this.#pointerLabel.anchor.set(0.5, 0);
        this.#pointerLabel.position.set(canvas.grid.size / 2, canvas.grid.size);
        this.#pointerSpriteContainer.addChild(this.#pointerLabel);
      }
      if (this.config.showIcon) {
        this.#pointerSpriteIcon.width = canvas.scene.grid.size;
        this.#pointerSpriteIcon.height = canvas.scene.grid.size;
        this.#pointerSpriteIcon.alpha = this.config.alpha;
        this.#pointerSpriteContainer.addChild(this.#pointerSpriteIcon);
      }
      if (this.#pointerSpriteContainer) {
        this.#pointerSpriteContainer.visible = (this.config.showToken || this.config.showIcon || this.config.showLabel);
        this.#pointerSpriteContainer.eventMode = "none";
        canvas.controls.addChild(this.#pointerSpriteContainer);
        canvas.app.ticker.add(this.#pointerImage, this);
      }

      // set up the range display graphics
      this.#drawing = new PIXI.Graphics();
      const movePoly = CONFIG.Canvas.polygonBackends[this.config.type].create(this.c, {
        type: this.config.type, hasLimitedRadius: true, radius: this.#pixels
      });
      this.#drawing.eventMode = "dynamic";
      this.#drawing.beginFill(0xFFFFFF, 0.2);
      this.#drawing.drawShape(movePoly);
      this.#drawing.endFill();
      this.#drawing.tint = this.#drawing.containsPoint(canvas.mousePosition) ? this.config.validColor : this.config.invalidColor;
      this.#drawing.cursor = this.config.cursor;
      this.#drawing.alpha = this.config.alpha;

      // set up interactions, click, right click, hover and such.
      this.#drawing.on('click', this.#onClick, this);   // on click run method #hoverIn with 'this' as the context ensuring 'this' in that function is the correct context.
      this.#drawing.on('pointerover', this.#hoverIn, this);
      this.#drawing.on('pointerout', this.#hoverOut, this);
      this.#drawing.on('rightclick', this.#onCancel, this);
      this.#drawing.on("mousemove", this.#onMove, this);
      canvas.tokens.addChild(this.#drawing);
    });
    return this.endPosition;
  }
  #onMove() {
    return; // nonfunctional test
    const pos = this.#getPosition(...Object.values(canvas.mousePosition));
    const isIn = this.#drawing.containsPoint(pos);
    console.warn(isIn);
    this.#drawing.tint = isIn ? this.config.validColor : this.config.invalidColor;
  }
  #hoverIn() {
    this.#drawing.tint = this.config.validColor;
    this.#highlightOn = true;
    this.#outside = false;
    if (this.config.showToken || this.config.showIcon || this.config.showLabel) this.#pointerSpriteContainer.visible = true;
  }
  #hoverOut() {
    this.#highlightOn = false;
    this.#outside = true;
    this.#drawing.tint = this.config.invalidColor;
    if (this.config.showToken || this.config.showIcon || this.config.showLabel) this.#pointerSpriteContainer.visible = false;
  }
  #getPosition(x, y) {
    const types = CONST.GRID_TYPES;
    if (canvas.scene.grid.type === types.GRIDLESS) {
      return {x: Math.roundDecimals(x, 2), y: Math.roundDecimals(y, 2)};
    }
    else return canvas.grid.getSnappedPosition(x, y);
  }

  #onClick() {
    if (this.#blocked) return;
    const dx = this.#pointerSpriteToken ? this.#pointerSpriteToken.width / 2 : this.#pointerSpriteIcon ? this.#pointerSpriteIcon.width / 2 : 0;
    const dy = this.#pointerSpriteToken ? this.#pointerSpriteToken.height / 2 : this.#pointerSpriteIcon ? this.#pointerSpriteIcon.height / 2 : 0;
    const x = canvas.mousePosition.x - dx;
    const y = canvas.mousePosition.y - dy;
    const targetLoc = this.#getPosition(x, y);
    this.resolve(targetLoc);
    this.#drawing.destroy();
    if (this.config.highlight) canvas.grid.clearHighlightLayer(this.#highlightName);
    if (this.config.showToken || this.config.showIcon || this.config.showLabel) {
      canvas.app.ticker.remove(this.#pointerImage, this);
      this.#pointerSpriteContainer.destroy({children: true, texture: true});
    }
  }

  #pointerImage() {
    const dx = this.#pointerSpriteToken ? this.#pointerSpriteToken.width / 2 : this.#pointerSpriteIcon ? this.#pointerSpriteIcon.width / 2 : 0;
    const dy = this.#pointerSpriteToken ? this.#pointerSpriteToken.height / 2 : this.#pointerSpriteIcon ? this.#pointerSpriteIcon.height / 2 : 0;
    const x = canvas.mousePosition.x - dx;
    const y = canvas.mousePosition.y - dy;
    const pos = this.#getPosition(x, y);
    if (this.config.highlight) canvas.grid.clearHighlightLayer(this.#highlightName);
    if (this.config.showToken || this.config.showIcon || this.config.showLabel) {
      if (this.config.showLabel) this.#pointerLabel.text = this.config.label instanceof Function ? this.config.label() : this.config.label;
      this.#pointerSpriteContainer.x = pos.x;
      this.#pointerSpriteContainer.y = pos.y;
    }
    this.#blocked = !canvas.effects.visibility.testVisibility({x: pos.x + dx, y: pos.y + dy}, this.startPosition);
    if (this.#blocked || this.distance() > this.radius || this.distance() === 0) {
      this.#pointerSpriteContainer.visible = false;
      this.#drawing.tint = this.config.invalidColor;
    }
    else {
      this.#pointerSpriteContainer.visible = this.#highlightOn ? true : false;
      this.#drawing.tint = this.#outside ? this.config.invalidColor : this.config.validColor;
    }
    if (this.config.highlight && this.#highlightOn && !this.#blocked) {
      canvas.grid.highlightPosition(this.#highlightName, pos);
    }
  }

  #onCancel() {
    this.resolve(null);
    this.#drawing.destroy();
    if (this.config.highlight) canvas.grid.clearHighlightLayer(this.#highlightName);
    if (this.config.showToken || this.config.showIcon || this.config.showLabel) {
      canvas.app.ticker.remove(this.#pointerImage, this);
      this.#pointerSpriteContainer.destroy({children: true, texture: true});
    }
  }

  distance() {
    const mousePos = this.token ? this.#getPosition(canvas.mousePosition.x - this.token.w / 2, canvas.mousePosition.y - this.token.h / 2)
      : this.#getPosition(canvas.mousePosition.x, canvas.mousePosition.y);
    mousePos.x = this.token ? mousePos.x + this.token.w / 2 : mousePos.x;
    mousePos.y = this.token ? mousePos.y + this.token.h / 2 : mousePos.y;
    const dist = canvas.grid.measureDistance(this.startPosition, mousePos, {gridSpaces: this.config.useGridDistance});
    return dist;
  }
}
/*
//example macro
const picker = new PickPosition({config: {showToken: true, showIcon: true, icon: "icons/svg/target.svg"}});
const pos = await picker.pickPosition();
token.document.update(pos);
*/
