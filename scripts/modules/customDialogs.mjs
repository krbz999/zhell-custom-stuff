import {MODULE} from "../const.mjs";

export async function imageAnchorDialog({label = "OK", callback, title, allowMultiple = false, top = [], middle = [], bottom = []}) {
  const content = await renderTemplate(`modules/${MODULE}/templates/imageAnchorDialog.hbs`, {top, middle, bottom});
  return Dialog.prompt({
    title,
    label,
    content,
    callback,
    options: {classes: ["dialog", "image-selector"]},
    render: (html) => _imageAnchorDialogOnRender(html, allowMultiple),
    rejectClose: false
  });
}

function _imageAnchorDialogOnRender(html, allowMultiple) {
  const top = html[0].querySelector(".image-selector .top-selection");
  const mid = html[0].querySelector(".image-selector .middle-selection");
  const btm = html[0].querySelector(".image-selector .bottom-selection");
  const topC = top?.childElementCount;
  const midC = mid?.childElementCount;
  const btmC = btm?.childElementCount;
  if (topC) top.style.gridTemplateColumns = `repeat(${topC}, 1fr)`;
  if (midC) mid.style.gridTemplateColumns = `repeat(${midC}, 1fr)`;
  if (btmC) btm.style.gridTemplateColumns = `repeat(${btmC}, 1fr)`;
  top?.firstElementChild?.classList.add("active");
  mid?.firstElementChild?.classList.add("active");
  btm?.firstElementChild?.classList.add("active");

  html[0].querySelectorAll(".image-selector a").forEach(a => a.addEventListener("click", _onClick));

  function _onClick(event) {
    const wasActive = event.currentTarget.classList.contains("active");
    if (allowMultiple) {
      const length = event.currentTarget.parentNode.querySelectorAll(".active").length;
      if ((length > 1) || !wasActive) event.currentTarget.classList.toggle("active");
    } else if (!wasActive) {
      for (const child of event.currentTarget.parentNode.children) {
        child.classList.toggle("active", child === event.currentTarget);
      };
    }
  }
}

export async function elementalDialog({types = [], content, title}) {
  const icon = {
    acid: "flask",
    cold: "snowflake",
    fire: "fire",
    lightning: "bolt",
    thunder: "cloud",
    poison: "skull"
  };

  const buttons = types.reduce((acc, type) => {
    acc[type] = {
      icon: `<i class="fa-solid fa-${icon[type]}"></i>`,
      label: CONFIG.DND5E.damageTypes[type],
      callback: () => type
    }
    return acc;
  }, {});

  return Dialog.wait({title, buttons, content}, {classes: ["dialog", "elemental"]});
}

export async function columnDialog({title, content, buttons, render}) {
  return Dialog.wait({
    title, content, buttons, render, close: () => false
  }, {
    classes: ["dialog", "column-dialog"]
  });
}
