import "./interact/menu.js";
import { dragZone, draggable } from "./interact/drag.js";
import flip from "./interact/flip.js";

document.body.addEventListener("com:bus:context", (e) => {
    let signature = {};

    if (e.target instanceof COMModule) {
        signature = e.target.signature;
    }
    if (e.target instanceof COMParameter) {
        // console.log(e.target, e.detail);
    }

    console.log({
        signature,
        ...e.detail,
    });
});

export class Base extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        this._init = false;
        this._open_connection = true;

        /**@type {HTMLTemplateElement} */ // @ts-ignore
        const templateBase = document.getElementById(`template-BASE`);

        /**@type {HTMLTemplateElement} */ // @ts-ignore
        const template = document.getElementById(`template-${this.tagName}`);

        this.shadowRoot.appendChild(templateBase.content.cloneNode(true));
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.addEventListener("com:bus:context", (e) => {
            if (
                e.currentTarget instanceof COMParameter &&
                e.detail.type != "change"
            ) {
                e.stopPropagation();
            }
            if (e.currentTarget instanceof COMList) return;
            if (e.currentTarget == e.target) return;

            let name = this.constructor.name;

            e.detail[name] = this;
        });
    }

    connectedCallback() {
        if (this.hasAttribute("silent")) {
            this.removeAttribute("silent");
            return;
        }
        this.emitContext("connected");
    }

    disconnectedCallback() {
        // this.emitContext("disconnected");
    }

    /**@param {boolean} should_flip */
    remove(should_flip = false) {
        if (!this.parentElement) return this;

        // TODO - Should the FLIP animation be handle inside the remove method? This seems to tight ...

        // let F;
        // if (should_flip) {
        //     const children = this.parentElement.children;
        //     F = flip(children);
        // }

        this.emitContext("disconnected");

        let r = this.parentElement.removeChild(this);
        // F?.play();

        return r;
    }

    /**@param {"connected" | "disconnected" | "change"} type */
    emitContext(type) {
        this.dispatchEvent(
            new CustomEvent("com:bus:context", {
                bubbles: true,
                detail: {
                    emitter: this,
                    type,
                },
            })
        );
    }
}

export class COMList extends Base {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }
}

export class COMNetwork extends Base {
    constructor() {
        super();
    }

    addChain() {
        const c = document.createElement("com-chain");
        this.appendChild(c);
    }
}

export class COMChain extends Base {
    constructor() {
        super();
    }

    /**
     *
     * @param {string} type
     * @param {boolean} silent
     */
    addModule(type, silent = false) {
        const m = document.createElement("com-module");
        m.setAttribute("type", type);
        if (silent) {
            m.setAttribute("silent", "");
        }
        this.appendChild(m);
    }

    connectedCallback() {
        super.connectedCallback();

        dragZone(this, "com-module", ["com-module"]);
    }
}

const MODULE_TYPES = {
    PTH: [],
    LFO: [
        { name: "AMP", value: 0.5 },
        { name: "FREQ", value: 0.125 },
    ],
    CHA: [{ name: "CHNS", value: 0.5 }],
};

/**@typedef {keyof typeof MODULE_TYPES} ModuleTypes */

export class COMModule extends Base {
    /**
     * @param {ModuleTypes} type
     * @returns {string} HTMLString <com-paramter>...</com-parameter>
     */
    static buildParametersString(type) {
        const params = MODULE_TYPES[type];

        let paramsHTMLString = "";

        for (let i = 0; i < params?.length; i++) {
            const param = params[i];

            paramsHTMLString += `
            <com-parameter slot="parameters" data-index="${i}" name="${param.name}" >
                <input value="${param.value}" draggable="true" ondragstart="event.preventDefault()"/>
            </com-parameter>
            `;
        }

        return paramsHTMLString;
    }

    constructor() {
        super();
    }

    get signature() {
        let type = "";

        type = this.getAttribute("type") ?? "PTH";

        return {
            type,
        };
    }

    remove(should_flip) {
        // TODO - is this needed? How does the OUTS reference the node they are attached to? Does the index needs to be updated?
        // this.querySelectorAll("com-out").forEach((o) =>
        //     o.emitContext("disconnected")
        // );

        return super.remove(should_flip);
    }

    connectedCallback() {
        super.connectedCallback();

        if (!this._init) {
            const sig = this.signature;

            const paramsHTML = COMModule.buildParametersString(sig.type);

            this.innerHTML += `
            <span slot="type">${sig.type}</span>
            ${paramsHTML}
            `;

            draggable(this);
            dragZone(this, "com-out", ["com-out"]);

            this._init = true;
        }
    }
}

export class COMParameter extends Base {
    constructor() {
        super();

        this._init = false;

        this.addEventListener("change", (e) => {
            this.emitContext("change");
        });
    }

    connectedCallback() {
        super.connectedCallback();

        if (!this._init) {
            const name = this.getAttribute("name");
            this.innerHTML += `
            <span slot="name">${name}</span>
            `;

            this._init = true;
        }
    }
}

export class COMOut extends Base {
    constructor() {
        super();

        this.addEventListener("input", (e) => {
            this.dispatchEvent(
                new CustomEvent("com:bus:context", {
                    bubbles: true,
                    detail: {
                        type: "change",
                        emitter: this,
                    },
                })
            );
        });
    }
    connectedCallback() {
        // TODO -- Is this nessecary? Should the outs signal to intercom everytime the module they are attached to move?
        if (this._open_connection || this.hasAttribute("data-dragged")) {
            super.connectedCallback();
            this._open_connection = false;
        }

        if (!this._init) {
            draggable(this);

            this._init = true;
        }
    }
}

export class COMPeriphial extends Base {
    /**
     * @param {number} pid
     * @returns {number}
     */
    static pidToCh(pid) {
        return [8, 8, 8, 8, 8, 4, 12, 16]?.[pid] ?? 0;
    }
    constructor() {
        super();

        this.shadowRoot.addEventListener(
            "input",
            /**@param {InputEvent & {target:HTMLInputElement}} e */
            (e) => {
                // PID determine number of channels, midi = 16, cv = 8 and so on
                if (e.target.getAttribute("name") != "pid") return;

                const { value } = e.target;

                const nChannels = COMPeriphial.pidToCh(+value - 1);

                let selectHTMLString = "";
                for (let i = 0; i < nChannels; i++) {
                    selectHTMLString += `<option value="${i}">${
                        i + 1
                    }</option>`;
                }

                this.shadowRoot.querySelector("select[name='ch']").innerHTML =
                    selectHTMLString;
            }
        );
    }
}

customElements.define("com-network", COMNetwork);
customElements.define("com-list", COMList);
customElements.define("com-chain", COMChain);
customElements.define("com-module", COMModule);
customElements.define("com-parameter", COMParameter);
customElements.define("com-out", COMOut);
customElements.define("com-periphial", COMPeriphial);

document.body.innerHTML += `
<com-network silent>
    ${`
    <com-chain silent>
        ${`
        <com-module type="LFO" silent></com-module>
        <com-module type="CHA" silent></com-module>
        <com-module silent>
            <com-out slot="outs" silent></com-out>
            <com-out slot="outs" silent></com-out>
            <com-out slot="outs" silent></com-out>
            <com-out slot="outs" silent></com-out>
        </com-module>
            `.repeat(1)}
    </com-chain>
        `.repeat(2)}
</com-network>
`;
