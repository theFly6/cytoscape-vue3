// ./hooks/useCyLayout.ts
// 运行布局
import cytoscape from '@/utils/cytoscape'
import type { Ref } from 'vue';

// 防抖函数
import { useDebounceFn } from '@/utils/useDebounceFn'

// 引入 cy 样式 hook
import { clusterColorMap } from './useCyStyle'

// 引入配置选项
import { useGraphSettings } from './useGraphSettings'
const settings = useGraphSettings()

export function useCyLayout(cy: Ref<cytoscape.Core | undefined>, options?: cytoscape.LayoutOptions) {
    let runCiseLayout = () => {
        const visibleNodes = cy.value?.nodes()
            .filter(n => {
                // 过滤掉不可见节点和灰色节点
                return n.visible() && n.style('background-color') !== `rgb(153,153,153)`
            }).map(n => n.id())
        console.log('所有可见节点:', visibleNodes)

        let clusters = Object.values(clusterColorMap.value)
            .map(arr => arr.filter(id => visibleNodes?.includes(id))) // 只保留可见节点
            .filter(arr => arr.length > 0) // 移除空 cluster

        console.log('clusterColorMap:', clusterColorMap.value)
        console.log(' clusters:', clusters)

        const layOutOption = {
            name: 'cise',
            nodeSeparation: settings.nodeSeparation.value,
            allowNodesInsideCircle: settings.allowNodesInCircles.value,
            maxRatioOfNodesInsideCircle: settings.maxRatioOfNodesInCircle.value,
            allowNodesOutsideCircle: true,
            refresh: 1,
            randomize: settings.randomize,
            animate: settings.animationType.value == 'end' ? 'end' : true,
            idealInterClusterEdgeLengthCoefficient: settings.idealEdgeLengthCoef.value,
            animationDuration: 1000,
            fit: settings.fit,
            packComponents: settings.packComponents.value,
            clusters  // 每个父节点作为一个 cluster
        } as cytoscape.LayoutOptions
        const layout = cy.value?.layout(layOutOption);

        layout?.run()
    }

    runCiseLayout = useDebounceFn(runCiseLayout, 300)

    return { runCiseLayout }
}