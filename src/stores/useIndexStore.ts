import { ref } from 'vue';
import axios from 'axios';

// 定义静态初始选项
const initialNodes = [
    { value: 'global_network', label: '🌐 全局网络视图 [moke]' },
    { value: 'node_ai_01', label: '🤖 AI-Training-01 [moke]' },
    // { value: 'mccx', label: '192.168.1.3' },
];

// 将状态放在函数外部，实现单例模式（类似简单的 Pinia）
const nodes = ref([...initialNodes]);
const currentNodeId = ref('');
const isLoading = ref(false);
const cy = ref();

export function useTopologyStore() {

    const fetchNodes = async () => {
        // if (nodes.value.length > initialNodes.length) return; // 避免重复加载

        isLoading.value = true;
        try {
            const res = await axios.get(`http://localhost:3000/topology/info/nodes`);
            const remoteNodes = res.data['nodes'].map((node: any) => ({
                value: node.ip,
                ip: node.ip,
                port: node.port,
                hostname: node.hostname,
                label: `${node.hostname} [${node.ip}]`
            }));
            // 直接更新 ref，所有引用的组件都会同步
            nodes.value = [...initialNodes, ...remoteNodes];
        } catch (error) {
            console.error('加载节点列表失败', error);
        } finally {
            isLoading.value = false;
        }
    };

    // const addNode = async (newNode: any) => {
    //     const res = await axios.post('/info/nodes/add', newNode);
    //     nodes.value = res.data.nodes; // 重新同步前端列表
    // };

    // const deleteNode = async (ip: any) => {
    //     const res = await axios.post('/info/nodes/delete', { ip });
    //     nodes.value = res.data.nodes;
    // };

    const updateNodes = async (newNodes: any) => {
        // console.log('newNodes', newNodes.slice(2));
        // return
        await axios.post('http://localhost:3000/topology/info/nodes/update', { nodes: newNodes.slice(2) });
        fetchNodes(); // 重新加载节点列表
    };

    return {
        nodes,
        currentNodeId,
        isLoading,
        fetchNodes,
        cy,
        // addNode,
        // deleteNode,
        updateNodes
    };
}