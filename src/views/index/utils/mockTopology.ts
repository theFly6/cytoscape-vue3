import { topologyData } from '@/data/index-data';
import { isMockNode } from '@/stores/useIndexStore';

export type MockElement = {
    data: Record<string, unknown>;
    position?: { x: number; y: number };
};

/** index-data.ts 中所有可离线渲染的拓扑 key（含 drill-down 子图） */
export const MOCK_TOPOLOGY_KEYS = new Set(Object.keys(topologyData));

export function isMockTopologyKey(nodeId: string): boolean {
    return isMockNode({ value: nodeId }) || MOCK_TOPOLOGY_KEYS.has(nodeId);
}

function buildHostFullLabel(el: MockElement): string {
    const props = (el.data.properties as Record<string, unknown>) || {};
    const id = el.data.id as string;
    let cardText = `${el.data.label}\n`;
    cardText += `--------------------------\n`;

    if (id === 'node_ai_01') {
        cardText += `🚀 加速卡: H100 x 8\n`;
        cardText += `💻 CPU: Epyc x 4\n`;
        cardText += `📊 负载: 75% | 🌡️ 65°C`;
    } else if (id === 'node_hpc_02') {
        cardText += `🚀 加速卡: H100 x 8\n`;
        cardText += `💻 CPU: Epyc x 4\n`;
        cardText += `💾 内存: 1024GB`;
    } else {
        cardText += `📍 IP: ${props.ip || 'N/A'}\n`;
        cardText += `状态: 🟢 运行中`;
    }
    return cardText;
}

export function loadMockTopology(nodeId: string): {
    elements: MockElement[];
    cpuNum: number;
    gpuNum: number;
} {
    const raw = (topologyData as Record<string, MockElement[]>)[nodeId];
    if (!raw) {
        return { elements: [], cpuNum: 0, gpuNum: 0 };
    }

    const elements = JSON.parse(JSON.stringify(raw)).map((el: MockElement) => {
        if (el.data.type === 'HOST') {
            el.data.fullLabel = buildHostFullLabel(el);
        }
        return el;
    });

    const cpuNum = elements.filter((el: MockElement) => el.data?.type === 'CPU').length;
    const gpuNum = elements.filter((el: MockElement) => el.data?.type === 'GPU').length;

    return { elements, cpuNum, gpuNum };
}
