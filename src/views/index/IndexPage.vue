<template>
    <div class="app-container">
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
import { useTopologyStore } from '@/stores/useIndexStore';
import { api } from '@/api/client';
import { edgeLineColor, nodeBackgroundColor, nodeShape } from '@/data/styleFunctions';
import { ElMessage } from 'element-plus';
// 从 store 获取状态
const { currentNodeId, nodes, cy } = useTopologyStore();
const selectedInfo = ref<any>(null);
const resetCounter = ref(0);

const currentElements = ref([])
const cpuNum = ref(0)
const gpuNum = ref(0)
const allSshNodes = ref([]);
const nodesLabel = ref()

watch(currentNodeId, async () => {
    console.log('当前选中节点ID变化:', currentNodeId.value);
    selectedInfo.value = null;

    if (isMockTopologyKey(currentNodeId.value)) {
        console.log('当前节点为 Mock 拓扑');
        const { elements, cpuNum: cpus, gpuNum: gpus } = loadMockTopology(currentNodeId.value);
        cpuNum.value = cpus;
        gpuNum.value = gpus;
        allSshNodes.value = [];
        nodesLabel.value = undefined;
        currentElements.value = elements as any;
        if (elements.length === 0) {
            ElMessage.warning('Mock 拓扑数据为空');
        }
        return;
    }
    // 如果'/'符号在currentNodeId中，说明是一个多节点间链路
    if (currentNodeId.value.includes('/')) {
        console.log('当前节点为多节点链路，使用后端数据绘制全相联拓扑');
        const curNode = nodes.value.find(n => n.value === currentNodeId.value) || [];
        const { ip: subnet, port } = curNode as any;
        currentElements.value = []
        try {
            let nodes = await api.get('/topology/info/nodes');
            nodes = nodes.data.nodes.map((node: { hostname: string; ip: string }) => ({
                value: node.ip,
                label: node.hostname,
            }))
            const result = await api.get('/network/nodes', { params: { subnet, port } });
            const { ssh_ready_nodes } = result.data;
            allSshNodes.value = ssh_ready_nodes;
            if (ssh_ready_nodes.length === 0) {
                ElMessage({
                    message: '当前子网内没有SSH可达节点，请检查节点状态是否正确',
                    type: 'warning',
                });
            }
            nodesLabel.value = Object.fromEntries((nodes as any).map((item: any) => [item.value, item.label]));

            // ====================== 自动生成全相联拓扑 ======================
            let elements = [];

            // 1. 添加所有节点
            ssh_ready_nodes.forEach((ip: any) => {
                elements.push({
                    data: {
                        id: ip,               // 用IP作为唯一ID
                        label: ip,           // 显示IP
                        fullLabel: (nodes as any).find((n: any) => n.value === ip)?.label + '\n' + ip, // 显示hostname
                        type: 'O_HOST',
                        properties: { ip }
                    }
                });
            });

            // 2. 全相联连接：每两个节点之间都连一条线（无向、不重复）
            const len = ssh_ready_nodes.length;
            for (let i = 0; i < len; i++) {
                for (let j = i + 1; j < len; j++) {
                    const source = ssh_ready_nodes[i];
                    const sourceHostname = (nodes as any).find((n: any) => n.value === source)?.label || source;
                    const target = ssh_ready_nodes[j];
                    const targetHostname = (nodes as any).find((n: any) => n.value === target)?.label || target;
                    elements.push({
                        data: {
                            id: `${source}-${target}`,
                            source,
                            target,
                            sourceHostname,
                            targetHostname,
                            label: '', // 可以根据需要添加标签
                            type: 'NET_LINK'
                        }
                    });
                }
            }

            // 赋值给画布显示
            currentElements.value = elements as any;
            console.log('✅ 全相联拓扑生成完成，节点数：', elements);

        } catch (err) {
            console.error('获取节点失败', err);
            currentElements.value = [];
        }
        return;
    }
    else {
        console.log('当前节点为普通节点，使用真实数据');
        const curNode = nodes.value.find(n => n.value === currentNodeId.value) || [];
        const { ip, hostname, port } = curNode as any;
        console.log('curNode', ip, hostname);
        // 将指定节点的拓扑数据存放到Neo4j中
        currentElements.value = []

        try {
            await api.get('/topology/info/node', { params: { ip, hostname, port } })
        } catch (error) {
            ElMessage.error(`获取节点拓扑信息失败，请检查节点数据信息与状态`);
            return;
        }
        // 然后从Neo4j中获取该节点的拓扑数据
        const neo4j_data = await api.get('/topology/cytoscape', { params: { ip, hostname } })
        console.log('从后端获取的拓扑数据:', neo4j_data.data.elements);
        const data = neo4j_data.data;
        data.elements = data.elements.map((el: any) => {
            if (el.group == "nodes") {
                el.data = {
                    parent: el.data.parent,
                    id: el.data.id,
                    label: el.data.label || el.data.name || el.data.id,
                    type: el.data.type || 'DEFAULT',
                    properties: el.data.properties || {},
                    ip: ip,
                    port: port
                };
                if (!el.data.parent) {
                    el.data.type = "HOST"
                    el.data.fullLabel = el.data.label;
                    el.data.port = port;
                    // 判断加速卡类型的函数
                    const acceleratiorType = (label: string) => {
                        console.log('判断加速卡类型的ID:', label);
                        if (label.includes("mccx")) return "摩尔线程";
                        if (label.includes("mx")) return "MetaX";
                        return "Unknown";
                    };
                    el.data.properties = {
                        accelerators: acceleratiorType(el.data.label),
                        // model: 'NVIDIA QM9700',
                        role: 'Core',
                        ip: el.data.id,
                    }
                    el.style = {
                        'text-valign': 'top',    // 文字对齐到节点上方
                        'text-halign': 'center', // 文字水平居中
                        'text-margin-y': -15,    // 向上偏移 15 像素，避免压线
                        'font-size': '34px',     // 甚至可以直接在这里改字体
                        'text-wrap': 'wrap'      // 确保 \n 换行符生效
                    };
                }
                if (el.data.id.includes("numa")) {
                    el.data.type = "NUMA"
                }
                if (el.data.id.includes("cpu")) {
                    el.data.type = "CPU"
                }
                if (el.data.id.includes("gpu")) {
                    el.data.type = "GPU"
                }
                if (el.data.id.includes("pci")) {
                    el.data.type = "PCIe"
                }
                if (el.data.id.includes("nic")) {
                    el.data.type = "NIC"
                }
            }
            if (el.group == "edges") {
                el.data.type = "LINK"
                el.data.label = ``;
                el.data.ip = ip;
                el.data.port = port;
            }

            return el;
        })
        data.elements.basicInfo = {
            ip,
            hostname,
            port
        }
        console.log('data.elements.', data.elements);
        cpuNum.value = data.elements.filter((item: any) =>
            item.group === 'nodes' && item.data?.type === 'CPU'
        ).length;
        gpuNum.value = data.elements.filter((item: any) =>
            item.group === 'nodes' && item.data?.type === 'GPU'
        ).length;
        currentElements.value = data.elements;
        // 最后检测currentElements如果为空则提示用户
        if (currentElements.value.length === 0) {
            ElMessage({
                message: '当前节点不存在或拓扑信息获取失败，请检查节点状态是否正确',
                type: 'warning',
            });
        }
    }
})

const handleReload = () => {
    resetCounter.value++;
    selectedInfo.value = null;
};

const handleClearDetails = () => {
    selectedInfo.value = null;
};

const handleDrillDown = (nodeId: string) => {
    console.log('接收到 drill-down 事件，节点ID:', nodeId);
    currentNodeId.value = nodeId;
    handleClearDetails();
};

const handleElementSelect = (data: any) => {
    // 1. 结构化数据，确保 DetailPanel 接收到的格式一致
    // 2. 逻辑容错：如果是复合节点或没有特定类型的节点，给定默认值
    selectedInfo.value = {
        id: data.id || `${data.source}-${data.target}`,
        label: data.label || (data.source ? '链路' + data.source.split("-").slice(1).join("-") + '-> *' : '未知组件'),
        type: data.type || (data.source ? 'LINK' : 'NODE'),
        // 确保 properties 始终是一个对象，防止 DetailPanel 遍历报错
        properties: data.properties || {},
        ip: data.ip || '',
        port: data.port || ''
    };

    // 2. 如果是链路，提取 source 和 target
    if (selectedInfo.value.type === 'LINK') {
        selectedInfo.value.source = data.source;
        selectedInfo.value.target = data.target;

        // 如果target为Marslink，添加labels属性
        if (data.target && data.target.includes("marslink")) {
            selectedInfo.value.labels = [
                "gpu*",
                ...Array.from({ length: gpuNum.value }, (_, i) => `gpu${i}`)
            ];

        }
    }

    // 3. 如果是节点间链路
    if (selectedInfo.value.type === 'NET_LINK') {
        selectedInfo.value.source = data.source;
        selectedInfo.value.target = data.target;

        selectedInfo.value.label = `${data.sourceHostname} <-> ${data.targetHostname}`;
    }

    // 4. 如果是节点
    if (selectedInfo.value.type === 'O_HOST') {
        selectedInfo.value.label = data.fullLabel.split('\n')[0];
    }


    console.log("当前选中详情:", selectedInfo.value);
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