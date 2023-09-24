import { COMChain, COMModule, COMNetwork, COMOut } from "../app.js";

/**
 *
 * @param {import("./drag").HTMLEvent<MouseEvent>} e
 */
function actionClick(e) {
    const meta = e.metaKey;
    const alt = e.altKey;

    /**@type { COMNetwork | COMChain | COMModule | COMOut | null} */
    const target = e.target.closest("com-network,com-chain,com-module,com-out");

    if (!target) return;

    if (alt && !(target instanceof COMNetwork)) {
        target.remove(true);
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
