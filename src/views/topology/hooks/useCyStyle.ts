// ./hooks/useCyStyle.ts
// 样式：节点、边的颜色，节点展开收起等功能
import { ref, type Ref } from 'vue'
import cytoscape from '@/utils/cytoscape'

// 默认样式
export const style = ref<cytoscape.StylesheetJson>([
    {
        selector: 'node',
        style: {
            'label': 'data(id)',
            'color': '#111',    // 字体颜色
            'text-outline-color': '#ffffff',
            'text-outline-width': 1,
            'border-color': '#226597',
            'border-width': 2,
            'font-size': 12
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#B0BEC5',
            'target-arrow-color': '#B0BEC5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        }
    },
    {
        selector: ':selected',
        style: {
            'border-width': 4,
            'border-color': '#F9A825',
            'line-color': '#F9A825',
            'target-arrow-color': '#F9A825'
        }
    }
])

export const highlightStyle = ref({
    "highlightStyles": [{ "node": { "border-color": "#ff9900", "border-width": 5 }, "edge": { "line-color": "#ff9900", "source-arrow-color": "#ff9900", "target-arrow-color": "#ff9900", "width": 6 } }]
})

// 
export const layoutOptions = ref([{ "node": { "border-color": "#ff9900", "border-width": 5 }, "edge": { "line-color": "#ff9900", "source-arrow-color": "#ff9900", "target-arrow-color": "#ff9900", "width": 6 } }])

// 用于存储每个 cluster 的颜色映射
// clusterColor: {'rgb(...)': ['id1', 'id2']}
export const clusterColorMap = ref<Record<string, string[]>>({})

export function useCyStyle(cy: Ref<cytoscape.Core | undefined>) {
    // 样式更新函数
    const updateStyle = (newStyle?: cytoscape.StylesheetJson) => {
        // 如果 newStyle 存在，则更新样式
        if (newStyle) {
            style.value = newStyle
            console.log('使用用户传入样式');
        } else {
            console.log('使用默认样式');
        }

        cy?.value?.nodes().forEach(node => {
            const id = node.id();
            const depth = id.split('::').length;  // 以 :: 分割，长度就是深度
            node.data('depth', depth);
        });

        // options 可自定义按钮样式、动画等
        cy?.value?.expandCollapse({
            fisheye: false,    // 是否开启鱼眼效果
            animate: true,     // 动画效果
            undoable: false    // 是否支持撤销
        });

        // cy.value?.style()
        //     .selector('node[depth = 1]')
        //     .style({
        //         'background-color': '#4DA8DA'
        //     })
        //     .selector('node[depth = 2]')
        //     .style({
        //         'background-color': '#FFB74D'
        //     })
        //     .selector('node[depth = 3]')
        //     .style({
        //         'background-color': '#81C784'
        //     })
        //     .selector('node[depth > 3]')  // 深层节点
        //     .style({
        //         'background-color': '#BA68C8'
        //     })
        //     .selector('edge')
        //     .style({
        //         'width': 2,
        //         'line-color': '#B0BEC5',
        //         'target-arrow-color': '#B0BEC5',
        //         'target-arrow-shape': 'triangle',
        //         'curve-style': 'bezier'
        //     })
        //     .update();

        detectClusters() // 🔥 识别簇并着色
        mapClusterColors();


    }

    // 颜色映射函数
    const mapClusterColors = () => {
        // 清空旧映射
        clusterColorMap.value = {}
        // 遍历所有节点，构建颜色到节点ID的映射
        cy?.value?.nodes().forEach(node => {
            const id = node.id()
            const color = node.css('background-color')  // 样式应用后的实际颜色
            if (!clusterColorMap.value[color]) {
                clusterColorMap.value[color] = []
            }
            clusterColorMap.value[color].push(id)
        })
        console.log('clusterColorMap:', clusterColorMap.value)
    }

    const getRandomColor = (): string => {
        const r = Math.floor(Math.random() * 180 + 30)
        const g = Math.floor(Math.random() * 180 + 30)
        const b = Math.floor(Math.random() * 180 + 30)
        return `rgb(${r},${g},${b})` === 'rgb(153,153,153)' ? getRandomColor() : `rgb(${r},${g},${b})` // 避免灰色
    }

    // 利用 BFS 识别连通子图作为 cluster
    const detectClusters = () => {
        const visited = new Set<string>()
        const clusters: string[][] = []

        cy?.value?.nodes().forEach(node => {
            const id = node.id()
            if (visited.has(id)) return

            const cluster: string[] = []
            const queue = [node]

            while (queue.length > 0) {
                const curr = queue.shift()
                if (!curr) continue

                const currId = curr.id()
                if (visited.has(currId)) continue

                visited.add(currId)
                cluster.push(currId)

                // 找到所有相邻的节点
                const neighbors = curr.connectedEdges()
                    .connectedNodes()
                    .filter(n => !visited.has(n.id()))

                neighbors.forEach(n => {
                    if (!visited.has(n.id())) {
                        queue.push(n)
                    }
                })
            }

            if (cluster.length > 0) {
                clusters.push(cluster)
            }
        })

        // 随机分配颜色并标记 clusterID
        detectAndColorClusters(clusters)

        console.log('[Cluster] 识别完成，共', clusters.length, '个簇', clusterColorMap.value)
    }

    // 为每个簇随机分配颜色
    const detectAndColorClusters = (clusters: string[][]) => {
        // 给每个 cluster 分配颜色并标记 clusterID
        clusterColorMap.value = {}

        clusters.forEach((ids, idx) => {
            const color = getRandomColor()

            clusterColorMap.value[color] = ids

            // 为每个节点设置 clusterID
            ids.forEach(id => {
                const node = cy?.value?.getElementById(id)
                // console.log(`节点 ${id} 分配到 Cluster #${idx + 1}，颜色 ${node?.style('background-color')}`)
                if (node?.style('background-color') !== 'rgb(153,153,153)') { // 不覆盖灰色节点
                    return
                }

                node?.data('clusterID', idx)
                node?.style('background-color', color)
            })
        })
    }

    return {
        updateStyle,
        style,
        mapClusterColors,
        detectClusters,
    }
}