import { dragZone, draggable } from "./interact/drag.js";

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
        this.emitContext("connected");
    }

    remove() {
        if (!this.parentElement) return this;
        this.emitContext("disconnected");
        return this.parentElement.removeChild(this);
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
}

export class COMChain extends Base {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        dragZone(this, "com-module", ["com-module"]);
    }
}

const MODULE_TYPES = {
    LFO: [
        { name: "AMP", value: 0.5 },
        { name: "FREQ", value: 0.125 },
    ],
};

export class COMModule extends Base {
    constructor() {
        super();

        this._init = false;
    }

    get signature() {
        let type = "";

        type = this.getAttribute("type") ?? "PTH";

        return {
            type,
        };
    }

    connectedCallback() {
        super.connectedCallback();

        const sig = this.signature;

        const params = MODULE_TYPES[sig.type];

        const paramsHTML = `
        ${params
            ?.map((p, i) => {
                return `
            <com-parameter slot="parameters" data-index="${i}" name="${p.name}" >
                <input value="${p.value}" draggable="true" ondragstart="event.preventDefault()"/>
            </com-parameter>`;
            })
            .join("\n")}
        `;

        if (!this._init) {
            this.innerHTML += `
            <span slot="type">${sig.type}</span>
            ${paramsHTML}
            `;
            this._init = true;

            draggable(this);
            dragZone(this, "com-out", ["com-out"]);
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

    // get signature() {
    //     let type = "";

    //     type = this.getAttribute("type") ?? "PTH";

    //     return {
    //         type,
    //     };
    // }

    connectedCallback() {
        super.connectedCallback();

        // const sig = this.signature;

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
        super.connectedCallback();

        draggable(this);
    }
}

customElements.define("com-network", COMNetwork);
customElements.define("com-list", COMList);
customElements.define("com-chain", COMChain);
customElements.define("com-module", COMModule);
customElements.define("com-parameter", COMParameter);
customElements.define("com-out", COMOut);
