<!-- TopologyGraph.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 引入 cy 实例 hook
import { useCyInstance } from '../hooks/useCyInstance'
const { cy, initCy } = useCyInstance()

// 引入 cy 样式 hook
import { useCyStyle, style } from '../hooks/useCyStyle'
const { updateStyle } = useCyStyle(cy)

// 图谱容器
const typologyGraphContainer = ref<HTMLElement>()

onMounted(async () => {
    if (!typologyGraphContainer.value) return
    // 初始化 cy 实例
    initCy(typologyGraphContainer.value, style.value)

    // 动态导入 GraphML 数据
    cy.value?.graphml({ layoutBy: 'circle' });
    const module = await import('@/data/topology-data');
    const graphStr = module.graphStr;
    cy.value?.graphml(graphStr);

    // 更新样式
    updateStyle()
})
</script>

<template>
    <div ref="typologyGraphContainer" class="typologyGraphContainer"></div>
</template>

<style scoped>
.typologyGraphContainer {
    margin-top: 5px;
    background-color: rgba(11, 87, 87, 0.185);

    width: 100%;
    height: 90vh;
}
</style>
