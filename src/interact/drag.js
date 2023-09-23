import { COMModule, COMOut } from "../app.js";
import flip from "./flip.js";

/**
 * @typedef {Object} HTMLTarget
 * @property {HTMLElement} target
 * @property {HTMLElement} currentTarget
 */

/**
 * @template {DragEvent | InputEvent | MouseEvent} T
 * @typedef {T & HTMLTarget} HTMLEvent
 */

/**@param {HTMLEvent<DragEvent>} e */
function dragStart(e) {
    if (e.currentTarget != e.target) return;
    e.currentTarget.setAttribute("data-dragged", "true");
    document.documentElement.classList.add(e.currentTarget.tagName);
    document.documentElement.setAttribute("data-dragging", "true");
}

/**@param {HTMLEvent<DragEvent>} e */
function dragEnd(e) {
    e.currentTarget.removeAttribute("data-dragged");
    document.documentElement.classList.remove(e.currentTarget.tagName);
    document.documentElement.removeAttribute("data-dragging");
}

/**
 * @template {HTMLElement} T
 * @param {T} target
 */
export function draggable(target) {
    target.draggable = true;

    target.addEventListener("dragstart", dragStart);
    target.addEventListener("dragend", dragEnd);

    return target;
}

/**
 * @param {NodeListOf<HTMLElement>} children
 * @param {number} y
 */
function getClosest(children, y) {
    let closestElement = null;
    let closestoffsetY = Number.NEGATIVE_INFINITY;

    for (const child of children) {
        const childBox = child.getBoundingClientRect();
        const offsetY = y - childBox.top - childBox.height / 2;

        if (offsetY < 0 && offsetY > closestoffsetY) {
            closestElement = child;
            closestoffsetY = offsetY;
        }
    }

    return closestElement;
}

/**
 * @param {string} selector
 * @param {string[]} acceptList
 * @param {HTMLEvent<DragEvent>} e
 */
function dragOver(selector, acceptList, e) {
    e.preventDefault();

    /**@type {COMModule | COMOut} */ // @ts-ignore
    const dragged = document.querySelector("[data-dragged='true']");

    if (!acceptList.find((s) => dragged.tagName.toLowerCase() == s)) return;

    /**@type {NodeListOf<HTMLElement>} */
    const children = e.currentTarget.querySelectorAll(
        `${selector}:not([data-dragged="true"])`
    );

    let closest = null;
    closest = getClosest(children, e.clientY);

    const fromList = dragged.parentElement;
    if (!fromList) return;
    const toList = e.currentTarget;
    if (!toList) return;

    if (dragged instanceof COMOut && fromList == toList) return;

    // console.log(children);

    const F = flip([
        ...children,
        dragged,
        ...(fromList != toList
            ? fromList.querySelectorAll(
                  `${selector}:not([data-dragged="true"])`
              )
            : []),
    ]);

    if (closest == null) {
        if (dragged == toList.lastElementChild) return;
        const d = dragged.remove();
        toList.appendChild(d);
    } else if (closest.previousElementSibling != dragged) {
        const d = dragged.remove();
        toList.insertBefore(d, closest);
    }

    F.play();
}

/**
 * @template {HTMLElement} T
 * @param {T} target
 * @param {string} selector
 * @param {string[]} acceptList
 */
export function dragZone(target, selector, acceptList) {
    target.addEventListener(
        "dragover",
        dragOver.bind({}, selector, acceptList)
    );
    return target;
}
