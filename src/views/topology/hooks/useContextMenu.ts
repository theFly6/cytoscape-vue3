// ./hooks/useContextMenu.ts
// 管理右键菜单显示/隐藏、位置、当前节点。
import { ref } from 'vue'
import type cytoscape from '@/utils/cytoscape'

export function useContextMenu() {
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)
  const currentNode = ref<cytoscape.NodeSingular | null>(null)

  const showContextMenu = (e?: cytoscape.EventObject) => {
    currentNode.value = e?.target || null
    console.log('右键节点:', currentNode.value)
    // 使得该节点的:selected生效
    currentNode.value?.select()
    contextMenuX.value = e?.originalEvent.pageX || 0
    contextMenuY.value = e?.originalEvent.pageY || 0
    contextMenuVisible.value = true
  }

  const hideContextMenu = () => {
    contextMenuVisible.value = false
    currentNode.value = null
  }

  return {
    contextMenuVisible,
    contextMenuX,
    contextMenuY,
    currentNode,
    showContextMenu,
    hideContextMenu
  }
}