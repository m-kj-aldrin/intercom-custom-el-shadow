import {
    COMChain,
    COMList,
    COMModule,
    COMNetwork,
    COMOut,
    COMParameter,
} from "./app";

interface BusEventDetail {
    type: "connected" | "disconnected" | "change";
}

declare global {
    interface HTMLElementTagNameMap {
        "com-list": COMList;
        "com-network": COMNetwork;
        "com-chain": COMChain;
        "com-module": COMModule;
        "com-out": COMOut;
        "com-parameter": COMParameter;
    }
    interface HTMLElementEventMap {
        "com:bus:context": CustomEvent<BusEventDetail>;
    }
}
