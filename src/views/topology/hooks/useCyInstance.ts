// ./hooks/useCyInstance.ts
// 核心实例，其它 hook 都依赖它
import { ref, onUnmounted, type Ref } from 'vue'
import cytoscape from '@/utils/cytoscape'

import type { ViewUtilitiesInstance, LayoutUtilitiesInstance } from '@/types/cytoscape'

// 全局共享 cy 实例
const cy = ref<cytoscape.Core>()
const instance1 = ref<ViewUtilitiesInstance>()
const instance2 = ref<LayoutUtilitiesInstance>()

// 引入布局样式
import { highlightStyle } from './useCyStyle'

export function useCyInstance() {
  const initCy = (container: HTMLElement, style: cytoscape.StylesheetJson) => {
    console.log('layoutOptions', highlightStyle.value)
    cy.value = cytoscape({
      container,
      ready: function () {
        this.layoutUtilities({
          desiredAspectRatio: this.width() / this.height()
        });
      },
      style,
      wheelSensitivity: 0.5,
    } as any)
    instance2.value = cy.value.layoutUtilities('get')
    instance1.value = cy.value.viewUtilities(highlightStyle.value)
  }

  const destroyCy = () => {
    console.log('销毁 cy  实例')
    // cy.value?.destroy()
  }

  // onUnmounted(destroyCy)

  return { cy, initCy, destroyCy, instance1, instance2 }
}
