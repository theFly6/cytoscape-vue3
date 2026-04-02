<template>
    <div class="app-container">
        <Sidebar @reload="handleReload" @clearDetails="handleClearDetails" />

        <TopologyGraph :elements="currentElements" :current-node-id="currentNodeId" :trigger-reset="resetCounter"
            @select-element="handleElementSelect" @drill-down="currentNodeId = $event" />
        <DetailPanel :info="selectedInfo" :cpuNum="cpuNum" :gpuNum="gpuNum" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import TopologyGraph from './components/TopologyGraph.vue';
import DetailPanel from './components/DetailPanel.vue';
import { topologyData as rawTopologyData } from '@/data/index-data'; // 移出的静态模拟数据
import { useTopologyStore } from '@/stores/useIndexStore';
import axios from 'axios';
import { edgeLineColor, nodeBackgroundColor, nodeShape } from '@/data/styleFunctions';
import { ElMessage } from 'element-plus';
// 从 store 获取状态
const { currentNodeId, nodes, cy } = useTopologyStore();
const selectedInfo = ref<any>(null);
const resetCounter = ref(0);

const currentElements = ref([])
const cpuNum = ref(0)
const gpuNum = ref(0)
watch(currentNodeId, async () => {
    console.log('当前选中节点ID变化:', currentNodeId.value);
    if (currentNodeId.value == 'global_network' || currentNodeId.value == "node_ai_01") {
        console.log('当前节点为Fake节点');
        // 1. 获取当前选中节点的原始数据（深拷贝防止污染原始数据）
        const data = JSON.parse(JSON.stringify((rawTopologyData as any)[currentNodeId.value] || []));

        // 2. 遍历并加工数据
        const res = data.map((el: any) => {
            // 针对 HOST 类型节点（物理服务器），构建展示用的多行 Label
            if (el.data.type === 'HOST') {
                const props = el.data.properties || {};
                const id = el.data.id;

                // --- 模拟原代码中的卡片构建逻辑 ---
                let cardText = `${el.data.label}\n`;
                cardText += `--------------------------\n`; // 分隔线

                // 根据 ID 或属性定制化展示内容
                if (id === 'node_ai_01') {
                    cardText += `🚀 加速卡: H100 x 8\n`;
                    cardText += `💻 CPU: Epyc x 4\n`;
                    cardText += `📊 负载: 75% | 🌡️ 65°C`;
                } else if (id === 'node_hpc_02') {
                    cardText += `🚀 加速卡: H100 x 8\n`;
                    cardText += `💻 CPU: Epyc x 4\n`;
                    cardText += `💾 内存: 1024GB`;
                } else {
                    // 通用节点展示逻辑
                    cardText += `📍 IP: ${props.ip || 'N/A'}\n`;
                    cardText += `状态: 🟢 运行中`;
                }

                // 将处理好的字符串存入 fullLabel，供 Cytoscape 的 style 渲染
                el.data.fullLabel = cardText;
            }

            return el;
        });
        console.log('res', res);
        return currentElements.value = res;
    }

    console.log('当前节点为普通节点，使用真实数据');
    const curNode = nodes.value.find(n => n.value === currentNodeId.value) || [];
    const { ip, hostname, port } = curNode as any;
    console.log('curNode', ip, hostname);
    // const res = await axios.get(`http://localhost:3000/topology/cytoscape?ip=${ip}&hostname=${hostname}`)
    // 将指定节点的拓扑数据存放到Neo4j中
    currentElements.value = []

    try {
        await axios.get('http://localhost:3000/topology/info/node?ip=' + ip + '&hostname=' + hostname + '&port=' + port)
    } catch (error) {
        ElMessage.error(`获取节点拓扑信息失败，请检查节点数据信息与状态`);
        return;
    }
    // 然后从Neo4j中获取该节点的拓扑数据
    const neo4j_data = await axios.get(`http://localhost:3000/topology/cytoscape?ip=${ip}&hostname=${hostname}`)
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
})

const handleReload = () => {
    resetCounter.value++;
    selectedInfo.value = null;
};

const handleClearDetails = () => {
    selectedInfo.value = null;
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