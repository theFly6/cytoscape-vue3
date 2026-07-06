<template>
    <div class="app-container" v-loading="isTopologyLoading" element-loading-text="正在加载拓扑...">
        <Sidebar @reload="handleReload" @clearDetails="handleClearDetails" />

        <TopologyGraph :elements="currentElements" :current-node-id="currentNodeId" :trigger-reset="resetCounter"
            @select-element="handleElementSelect" @drill-down="handleDrillDown($event)" />
        <DetailPanel :info="selectedInfo" :cpuNum="cpuNum" :gpuNum="gpuNum" :allSshNodes="allSshNodes"
            :nodesLabel="nodesLabel" @clearDetails="handleClearDetails" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import TopologyGraph from './components/TopologyGraph.vue';
import DetailPanel from './components/DetailPanel.vue';
import { isMockTopologyKey, loadMockTopology } from '@/views/index/utils/mockTopology';
import { loadRealNodeTopology } from '@/views/index/utils/realTopology';
import { useTopologyStore } from '@/stores/useIndexStore';
import { api } from '@/api/client';
import { ElMessage } from 'element-plus';

const { currentNodeId, nodes } = useTopologyStore();
const selectedInfo = ref<any>(null);
const resetCounter = ref(0);
const isTopologyLoading = ref(false);

const currentElements = ref<any[]>([]);
const cpuNum = ref(0);
const gpuNum = ref(0);
const allSshNodes = ref<string[]>([]);
const nodesLabel = ref<Record<string, string>>();

let loadSeq = 0;

watch(currentNodeId, async () => {
    const seq = ++loadSeq;
    selectedInfo.value = null;

    if (isMockTopologyKey(currentNodeId.value)) {
        const { elements, cpuNum: cpus, gpuNum: gpus } = loadMockTopology(currentNodeId.value);
        cpuNum.value = cpus;
        gpuNum.value = gpus;
        allSshNodes.value = [];
        nodesLabel.value = undefined;
        currentElements.value = elements;
        if (elements.length === 0) {
            ElMessage.warning('Mock 拓扑数据为空');
        }
        return;
    }

    if (currentNodeId.value.includes('/')) {
        isTopologyLoading.value = true;
        currentElements.value = [];
        try {
            const curNode = nodes.value.find((n) => n.value === currentNodeId.value);
            if (!curNode?.ip) {
                ElMessage.warning('子网节点配置无效');
                return;
            }
            const { ip: subnet, port } = curNode as { ip: string; port?: number | string };

            const nodesRes = await api.get('/topology/info/nodes');
            if (seq !== loadSeq) return;

            const nodeOptions = nodesRes.data.nodes.map((node: { hostname: string; ip: string }) => ({
                value: node.ip,
                label: node.hostname,
            }));
            const result = await api.get('/network/nodes', { params: { subnet, port } });
            if (seq !== loadSeq) return;

            const { ssh_ready_nodes } = result.data;
            allSshNodes.value = ssh_ready_nodes ?? [];
            if (ssh_ready_nodes.length === 0) {
                ElMessage.warning('当前子网内没有 SSH 可达节点，请检查节点状态');
            }
            nodesLabel.value = Object.fromEntries(nodeOptions.map((item: any) => [item.value, item.label]));

            const elements: any[] = [];
            ssh_ready_nodes.forEach((ip: string) => {
                elements.push({
                    data: {
                        id: ip,
                        label: ip,
                        fullLabel: `${nodeOptions.find((n: any) => n.value === ip)?.label ?? ip}\n${ip}`,
                        type: 'O_HOST',
                        properties: { ip },
                    },
                });
            });

            const len = ssh_ready_nodes.length;
            for (let i = 0; i < len; i++) {
                for (let j = i + 1; j < len; j++) {
                    const source = ssh_ready_nodes[i];
                    const target = ssh_ready_nodes[j];
                    elements.push({
                        data: {
                            id: `${source}-${target}`,
                            source,
                            target,
                            sourceHostname: nodeOptions.find((n: any) => n.value === source)?.label || source,
                            targetHostname: nodeOptions.find((n: any) => n.value === target)?.label || target,
                            label: '',
                            type: 'NET_LINK',
                        },
                    });
                }
            }
            cpuNum.value = 0;
            gpuNum.value = 0;
            currentElements.value = elements;
        } catch (err) {
            console.error('获取子网拓扑失败', err);
            currentElements.value = [];
            ElMessage.error('获取子网拓扑失败，请检查 express 与 topo-server');
        } finally {
            if (seq === loadSeq) isTopologyLoading.value = false;
        }
        return;
    }

    const curNode = nodes.value.find((n) => n.value === currentNodeId.value);
    if (!curNode?.ip || !curNode?.hostname) {
        currentElements.value = [];
        ElMessage.warning('请从侧边栏选择有效的集群节点');
        return;
    }

    const ctx = {
        ip: curNode.ip!,
        hostname: curNode.hostname!,
        port: curNode.port ?? 22,
    };

    isTopologyLoading.value = true;
    currentElements.value = [];
    allSshNodes.value = [];
    nodesLabel.value = undefined;

    try {
        const { elements, cpuNum: cpus, gpuNum: gpus } = await loadRealNodeTopology(ctx);
        if (seq !== loadSeq) return;

        cpuNum.value = cpus;
        gpuNum.value = gpus;
        currentElements.value = elements;
        if (elements.length === 0) {
            ElMessage.warning('拓扑数据为空');
        }
    } catch (err) {
        if (seq !== loadSeq) return;
        console.error('加载真实节点拓扑失败', err);
        currentElements.value = [];
        cpuNum.value = 0;
        gpuNum.value = 0;
        ElMessage.error(err instanceof Error ? err.message : '加载拓扑失败');
    } finally {
        if (seq === loadSeq) isTopologyLoading.value = false;
    }
});

const handleReload = () => {
    resetCounter.value++;
    selectedInfo.value = null;
};

const handleClearDetails = () => {
    selectedInfo.value = null;
};

const handleDrillDown = (nodeId: string) => {
    currentNodeId.value = nodeId;
    handleClearDetails();
};

const handleElementSelect = (data: any) => {
    selectedInfo.value = {
        id: data.id || `${data.source}-${data.target}`,
        label: data.label || (data.source ? `链路 ${data.source} -> ${data.target}` : '未知组件'),
        type: data.type || (data.source ? 'LINK' : 'NODE'),
        properties: data.properties || {},
        ip: data.ip || '',
        port: data.port || '',
        hostname: data.properties?.hostname || '',
    };

    if (selectedInfo.value.type === 'LINK') {
        selectedInfo.value.source = data.source;
        selectedInfo.value.target = data.target;

        if (data.target?.includes('marslink')) {
            selectedInfo.value.labels = ['gpu*', ...Array.from({ length: gpuNum.value }, (_, i) => `gpu${i}`)];
        }
    }

    if (selectedInfo.value.type === 'NET_LINK') {
        selectedInfo.value.source = data.source;
        selectedInfo.value.target = data.target;
        selectedInfo.value.label = `${data.sourceHostname} <-> ${data.targetHostname}`;
    }

    if (selectedInfo.value.type === 'O_HOST' || selectedInfo.value.type === 'HOST') {
        selectedInfo.value.label = (data.fullLabel || data.label || '').split('\n')[0];
    }
};
</script>

<style scoped>
.app-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #f8fafc;
}
</style>
