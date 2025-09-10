// ./hooks/useContextActions.ts
// 具体右键操作逻辑（添加节点），依赖 cy 实例和 collapsedMap。
import type cytoscape from 'cytoscape'
import { ref, toRaw, type Ref } from 'vue'

// 引入 cytoscape 实例
import { useCyInstance } from './useCyInstance'
const { cy, instance2, instance1 } = useCyInstance()

// 引入 cy 样式 hook
import { useCyStyle } from './useCyStyle'
const { mapClusterColors } = useCyStyle(cy)

// 引入右键菜单数据 hook
import { useContextMenu } from '../hooks/useContextMenu'
const { currentNode } = useContextMenu()

export function useContextActions(cy: Ref<cytoscape.Core | undefined>) {
  const collapsedMap = ref<Map<string, cytoscape.ElementDefinition[]>>(new Map())
  let contextMenuNode = ref<cytoscape.NodeSingular | null>(null)
  // 右键添加子节点
  const addNode = (node: cytoscape.NodeSingular | null) => {
    contextMenuNode.value = node
    if (!cy.value || !contextMenuNode.value) return
    const arrayOfClusterArrays: string[][] = [] // 假设每个 cluster 的节点数组
    const sourceId = contextMenuNode.value.data('id')
    const clusterId = contextMenuNode.value.data('clusterID')
    const color = contextMenuNode.value.data('color') || '#999'
    console.log('节点ID:', sourceId, '集群ID:', clusterId, '颜色:', color, '背景色:', contextMenuNode.value.style('background-color'))

    const random = Math.floor(1 + 5 * Math.random()) // 随机生成1-5个节点
    const newNodes: string[] = []
    for (let i = 1; i <= random; i++) {
      const nodeId = sourceId + '::n' + i
      const edgeId = sourceId + '::e' + i

      // 初始化 cluster 数组
      if (!arrayOfClusterArrays[clusterId]) arrayOfClusterArrays[clusterId] = []

      if (!arrayOfClusterArrays[clusterId].includes(nodeId)) {
        arrayOfClusterArrays[clusterId].push(nodeId)
        newNodes.push(nodeId)

        // 添加节点和边
        cy.value.add([
          { group: 'nodes', data: { id: nodeId, clusterID: clusterId, color } },
          { group: 'edges', data: { id: edgeId, source: sourceId, target: nodeId, color } }
        ])

        // 设置节点颜色
        cy.value.$id(nodeId).style('background-color', contextMenuNode.value.style('background-color'))
      }
    }

    // 放置新节点
    const nodesToBeAdded = cy.value.collection();
    newNodes.forEach(id => {
      const node = toRaw(cy.value?.$id(id))
      if (node && node.nonempty()) {
        nodesToBeAdded.merge(node)
      }
    })
    console.log('新添加的节点:', nodesToBeAdded.jsons())
    instance2.value?.placeNewNodes(nodesToBeAdded);

    // 将nodesToBeAdded加上本节点
    nodesToBeAdded.merge(contextMenuNode.value)

    instance1.value?.highlight(nodesToBeAdded)

    mapClusterColors()
  }

  // 移除节点
  const removeNode = () => {
    // 获取所有被selected的节点

    // const nodeId = contextMenuNode.value?.data('id')
    // cy.value?.$id(nodeId).style('background-color', '#999')
    console.log('移除节点', cy.value?.nodes(':selected'))
    cy.value?.nodes(':selected').forEach(node => {
      // 将原有的颜色保存
      node.data('originalColor', node.style('background-color'))
      node.style('background-color', '#999')
    })
    mapClusterColors()
  }

  // 恢复节点
  const recoverNode = () => {
    console.log('恢复节点', cy.value?.nodes(':selected'))
    cy.value?.nodes(':selected').forEach(node => {
      if (!node.data('originalColor')) return
      // 恢复原有的颜色
      const originalColor = node.data('originalColor')
      node.style('background-color', originalColor)
      node.removeData('originalColor')
    })
    mapClusterColors()
  }

  return { contextMenuNode, addNode, collapsedMap, removeNode, recoverNode }
}
