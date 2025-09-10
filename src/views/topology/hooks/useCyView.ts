// ./hooks/useCyView.ts
// viewUtilities 视图相关功能，如高亮等
import cytoscape from '@/utils/cytoscape'
import type { Ref } from 'vue';


export function useCyView(cy: Ref<cytoscape.Core | undefined>) {
    const removeHighlights = () => {
        const t = cy.value?.viewUtilities()
        t?.removeHighlights();
    }

    return { removeHighlights }
}