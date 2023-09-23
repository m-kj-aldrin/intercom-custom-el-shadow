import { Chain, Module } from "../elements/base.js";

/**
 *
 * @param {import("./drag").HTMLEvent<MouseEvent>} e
 */
function actionClick(e) {
    const meta = e.metaKey;
    const alt = e.altKey;

    /**@type {Chain | Module | null} */
    const target = e.target.closest("com-chain,com-module");

    if (!target) return;

    if (alt) {
        target.remove();
    }
}

document.addEventListener("click", actionClick);
