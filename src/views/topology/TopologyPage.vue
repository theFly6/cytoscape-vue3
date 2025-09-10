<!-- TopologyPage.vue -->
<template>
    <div class="topology-page">
        <!-- 控制图布局/刷新 -->
        <ControlPanel />

        <!-- 显示并交互 Cytoscape 图谱 -->
        <TopologyGraph />

        <!-- 显示图例Legend以及节点信息NodeInfoPanel -->
        <div class="right-side">
            <Legend />
            <NodeInfoPanel />
        </div>
    </div>
</template>

<script setup lang="ts">
import ControlPanel from './components/ControlPanel.vue'
import TopologyGraph from './components/TopologyGraph.vue'
import Legend from './components/Legend.vue'
import NodeInfoPanel from './components/NodeInfoPanel.vue'
</script>

<style scoped>
.topology-page {
    margin-top: 10px;
    gap: 5px;
    display: grid;
    grid-template-columns: 1fr 6fr 2fr;
    height: 100%;
}
</style>
