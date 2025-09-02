<!-- CytoscapePage.vue -->
<template>
  <div class="cytoscape-page">
    <!-- 左上角的功能按键 -->
    <GraphControls @run-cise="graphRef?.runCiseLayout()" @remove-highlights="graphRef?.removeHighlights()"
      @add-cluster="graphRef?.addCluster()" @remove-cluster="graphRef?.removeCluster()"
      @import-graphml="graphRef?.onImportClick" @test-func="graphRef?.testFunc()" />
    <!-- 封装 Cytoscape 的图视图及相关布局逻辑 -->
    <CytoscapeGraph ref="graphRef" />
    <!-- 显示图例（legend），响应式更新颜色 -->
    <ClusterLegend :colors="graphRef?.clusterColors ?? []" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CytoscapeGraph from './CytoscapeGraph.vue'
import GraphControls from './GraphControls.vue'
import ClusterLegend from './ClusterLegend.vue'

const graphRef = ref<InstanceType<typeof CytoscapeGraph> | null>(null)
</script>

<style scoped>
.cytoscape-page {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 4fr 1fr;
  height: 100%;
}
</style>
