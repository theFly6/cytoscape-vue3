<template>
    <div id="cy" ref="cyContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, onUnmounted, nextTick } from 'vue';
import cytoscape from 'cytoscape';
import { typeData } from '@/data/index-data';
import { useTopologyStore } from '@/stores/useIndexStore';
// 使用共享 store
const { cy } = useTopologyStore();

// 假设我们通过 props 获取当前节点的 ID，用于存储 Key
const props = defineProps<{
    elements: any[];
    triggerReset: number;
    currentNodeId: string; // 需要父组件传入当前选中的 ID
}>();

const emit = defineEmits(['select-element', 'drill-down']);
const cyContainer = ref<HTMLElement | null>(null);


// --- 修正逻辑：获取存储 Key ---
const getStorageKey = () => `topology_pos_${props.currentNodeId}`;

// --- 修正逻辑：保存坐标到缓存 ---
const savePositions = () => {
    if (!cy) return;
    const positions: Record<string, any> = {};
    cy.value.nodes().forEach((node: any) => {
        positions[node.id()] = node.position();
    });
    localStorage.setItem(getStorageKey(), JSON.stringify(positions));
};

const initCy = async (isCose = false) => {
    if (!cyContainer.value) return;
    if (cy) cy.value?.destroy();

    // 如果props.elements为空，直接返回
    if (!props.elements.length) return;

    // --- 修正逻辑：读取缓存坐标 ---
    if (!isCose) {
        const savedPositions = JSON.parse(localStorage.getItem(getStorageKey()) || "{}");
        const hasSavedPos = Object.keys(savedPositions).length > 0;

        // 将缓存位置合并到 elements 数据中
        const elementsWithPos = props.elements.map(el => {
            if (el.data?.id && savedPositions[el.data.id]) {
                return {
                    ...el,
                    position: savedPositions[el.data.id],
                };
            }
            return el;
        });
        cy.value = cytoscape({
            container: cyContainer.value,
            elements: elementsWithPos,
            style: typeData as any,
            layout: {
                // 核心逻辑：如果有保存位置且不是强制重载(isCose)，则使用 preset 布局
                name: hasSavedPos ? 'preset' : 'cose',
                padding: 50,
                // animate: true
            }
        });
    } else {
        cy.value = cytoscape({
            container: cyContainer.value,
            style: typeData as any,
            elements: props.elements,
            layout: {
                name: 'cose',
                padding: 50,
                // animate: true
            }
        });
    }

    // --- 修正逻辑：监听拖拽释放事件 ---
    cy.value.on('dragfree', 'node', () => {
        savePositions();
    });

    // 其他原有事件处理...
    cy.value.on('tap', 'node, edge', (evt: any) => emit('select-element', evt.target.data()));
    cy.value.on('dbltap', 'node[type="HOST"]', (evt: any) => emit('drill-down', evt.target.id()));

    // 初始化后自动保存一次位置
    setTimeout(() => {
        savePositions();
    }, 500);
};

// 监听数据和 ID 变化
watch(() => [props.elements, props.currentNodeId], () => {
    initCy()
}, { deep: false });
watch(() => props.triggerReset, () => {
    initCy(true)
}); // 强制重载时传入 true 以使用 cose 重新布局

onMounted(async () => {
    initCy()
});
onUnmounted(() => cy.value?.destroy());
</script>

<style scoped>
#cy {
    flex-grow: 1;
    background: radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%);
    position: relative;
}
</style>