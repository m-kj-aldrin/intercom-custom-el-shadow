import { COMChain, COMModule, COMNetwork } from "../app.js";

/**
 *
 * @param {import("./drag").HTMLEvent<MouseEvent>} e
 */
function actionClick(e) {
    const meta = e.metaKey;
    const alt = e.altKey;

    /**@type {COMChain | COMModule | COMNetwork | null} */
    const target = e.target.closest("com-network,com-chain,com-module");

    if (!target) return;

    if (alt && !(target instanceof COMNetwork)) {
        target.remove();
    }

    if (meta) {
        if (target instanceof COMChain) {
            target.addModule("LFO");
        }

        if (target instanceof COMNetwork) {
            target.addChain();
        }
    }
}

document.addEventListener("click", actionClick);
