import { ref } from 'vue';
import { api } from '@/api/client';

export interface TopologyNodeOption {
    value: string;
    label: string;
    ip?: string;
    port?: number | string;
    hostname?: string;
}

/** 前端内置 mock 节点，不参与 workers.conf 同步 */
const MOCK_NODES: TopologyNodeOption[] = [
    { value: 'global_network', label: '🌐 全局网络视图 [moke]' },
    { value: 'node_ai_01', label: '🤖 AI-Training-01 [moke]' },
];

const MOCK_NODE_VALUES = new Set(MOCK_NODES.map((n) => n.value));

export function isMockNode(node: { value?: string }): boolean {
    return MOCK_NODE_VALUES.has(node.value ?? '');
}

function mapRemoteNode(node: { hostname: string; ip: string; port?: number | string }): TopologyNodeOption {
    return {
        value: node.ip,
        ip: node.ip,
        port: node.port ?? 22,
        hostname: node.hostname,
        label: `${node.hostname} [${node.ip}]`,
    };
}

function toWorkersPayload(nodes: TopologyNodeOption[]) {
    return nodes
        .filter((n) => !isMockNode(n))
        .map(({ hostname, ip, port }) => ({
            hostname,
            ip,
            port: port ?? 22,
        }));
}

const nodes = ref<TopologyNodeOption[]>([...MOCK_NODES]);
const currentNodeId = ref('');
const isLoading = ref(false);
const cy = ref();

export function useTopologyStore() {
    const fetchNodes = async () => {
        isLoading.value = true;
        try {
            const res = await api.get('/topology/info/nodes');
            const remoteNodes = (res.data.nodes as Array<{ hostname: string; ip: string; port?: number | string }>).map(
                mapRemoteNode,
            );
            nodes.value = [...MOCK_NODES, ...remoteNodes];
        } catch (error) {
            console.error('加载节点列表失败', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const updateNodes = async (remoteNodes: TopologyNodeOption[]) => {
        const payload = toWorkersPayload(remoteNodes);
        try {
            await api.post('/topology/info/nodes/update', { nodes: payload });
            await fetchNodes();
        } catch (error) {
            console.error('更新节点列表失败', error);
            throw error;
        }
    };

    const getRemoteNodes = () => nodes.value.filter((n) => !isMockNode(n));

    return {
        nodes,
        currentNodeId,
        isLoading,
        fetchNodes,
        updateNodes,
        getRemoteNodes,
        isMockNode,
        cy,
    };
}
