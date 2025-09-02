<template>
  <div class="cy-container">
    <div ref="cyContainer" class="cy" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

import { arrayOfClusterArrays } from '@/data/graph'

let cy
const cyContainer = ref(null)

onMounted(async () => {
  if (!cyContainer.value) return
  const cytoscapeModule = await import('@/utils/cytoscape')

  // 初始化 Cytoscape
  cy = cytoscapeModule.default({
    container: cyContainer.value,
    style: [
      {
        selector: 'node',
        style: {
          'content': 'data(id)'
        }
      },

      {
        selector: 'edge',
        style: {
          'target-arrow-shape': 'triangle'
        }
      },

      {
        selector: ':selected',
        style: {

        }
      }
    ],
    ready: function () {
      var graphStr = '<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">'
        + '<graph id="G" edgedefault="undirected">'
        + '<node id="n0"/>'
        + '<node id="n1"/>'
        + '<node id="n2"/>'
        + '<node id="n3"/>'
        + '<node id="n4"/>'
        + '<node id="n5">'
        + '<graph id="n5:" edgedefault="undirected">'
        + '<node id="n5::n0"/>'
        + '<node id="n5::n1"/>'
        + '<node id="n5::n2"/>'
        + '<edge id="e0" source="n5::n0" target="n5::n2"/>'
        + '<edge id="e1" source="n5::n1" target="n5::n2"/>'
        + '</graph>'
        + '</node>'
        + '<node id="n6">'
        + '<graph id="n6:" edgedefault="undirected">'
        + '<node id="n6::n0">'
        + '<graph id="n6::n0:" edgedefault="undirected">'
        + '<node id="n6::n0::n0"/>'
        + '</graph>'
        + '</node>'
        + '<node id="n6::n1"/>'
        + '<node id="n6::n2"/>'
        + '<edge id="e10" source="n6::n1" target="n6::n0::n0"/>'
        + '<edge id="e11" source="n6::n1" target="n6::n2"/>'
        + '</graph>'
        + '</node>'
        + '<edge id="e2" source="n5::n2" target="n0"/>'
        + '<edge id="e3" source="n0" target="n2"/>'
        + '<edge id="e4" source="n0" target="n1"/>'
        + '<edge id="e5" source="n1" target="n3"/>'
        + '<edge id="e6" source="n3" target="n2"/>'
        + '<edge id="e7" source="n2" target="n4"/>'
        + '<edge id="e8" source="n3" target="n6::n1"/>'
        + '<edge id="e9" source="n6::n1" target="n4"/>'
        + '</graph>'
        + '</graphml>';
      this.graphml({ layoutBy: 'circle' });
      this.graphml(graphStr);
    }
  })
})

// 点击按钮触发 CISE 布局
const runCiseLayout = () => {
  if (!cy) return

  const layout = cy.layout({
    name: 'cise',
    allowNodesInsideCircle: true,
    allowNodesOutsideCircle: true,
    nodeSeparation: 20,
    refresh: 1,
    animate: true,
    animationDuration: 1000,
    clusters: arrayOfClusterArrays,
  })

  layout.run()
}

</script>

<style scoped>
.cy {
  width: 100%;
  height: 90vh;
}

.cy-container {
  margin-top: 5px;
  background-color: rgba(11, 87, 87, 0.185);
}
</style>
