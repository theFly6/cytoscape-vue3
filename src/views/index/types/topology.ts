export interface TopologyElement {
    data: {
        id?: string;
        label?: string;
        source?: string;
        target?: string;
        parent?: string;
        type?: 'NUMA' | 'CPU' | 'GPU' | 'PCIe' | 'SWITCH' | 'HOST' | 'LINK' | 'NET_LINK' | 'QPI' | 'PCIe_LINK' | 'NV_LINK';
        properties?: TopologyProperty;
        fullLabel?: string;
    };
}

export interface TopologyProperty {
    [key: string]: string | number | boolean | undefined;
}

export interface DetailInfo {
    id: string;
    label: string;
    type: string;
    properties: TopologyProperty;
}

export type TopologyDataMap = Record<string, TopologyElement[]>;