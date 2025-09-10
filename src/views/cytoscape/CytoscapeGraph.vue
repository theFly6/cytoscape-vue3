<!-- CytoscapeGraph.vue -->
<template>
    <div id="cy" class="cy" ref="cyContainer"></div>
    <div v-show="contextMenuVisible" :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
        class="context-menu">
        <ul>
            <li @click="contextAddNode">添加节点</li>
            <li @click="contextExpandNode">展开节点</li>
            <li @click="contextCollapseNode">收缩节点</li>
        </ul>
    </div>
    <input ref="fileInput" type="file" style="display:none" @change="onFileChange" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from '@/utils/cytoscape'

import type { ViewUtilitiesInstance } from '@/types/cytoscape'
import type { LayoutUtilitiesInstance } from '@/types/cytoscape'

const cyContainer = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let cy: cytoscape.Core

// 选项配置
import { useGraphSettings } from '@/stores/graphSettings'

const settings = useGraphSettings()

// —— 非响应式变量
const { elements, clusters, layoutOptions, style, fetchGraphData } = useGraphData('http://localhost:3000/api/graph')
let arrayOfClusterArrays: string[][]
let clusterColors: string[] = []
let legendColors = ref()
import { useGraphData } from '@/composables/cytoscape/useGraphData'
import { hexToRgbString, fullColorHex } from '@/data/cytoscape-data'

// 导入配置变量
import { nodeBackgroundColor, nodeShape, edgeLineColor } from '@/data/styleFunctions'
function restoreStyle(importedStyle: any[]) {
    return importedStyle.map(rule => {
        const newRule: any = { selector: rule.selector, style: {} }

        Object.entries(rule.style).forEach(([k, v]) => {
            if (k === "background-color") newRule.style[k] = nodeBackgroundColor
            else if (k === "shape") newRule.style[k] = nodeShape
            else if (k === "line-color") newRule.style[k] = edgeLineColor
            else newRule.style[k] = v
        })

        return newRule
    })
}

// —— 初始化 Cytoscape
onMounted(async () => {
    if (!cyContainer.value) return
    await fetchGraphData()
    arrayOfClusterArrays = JSON.parse(JSON.stringify(clusters.value))

    // 阻止右键菜单默认行为
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })
    cy = cytoscape({
        container: cyContainer.value,
        layout: { name: 'concentric', clusters: clusters.value },
        ready: function () {
            // initialize layout-utilities extension
            this.layoutUtilities({
                desiredAspectRatio: this.width() / this.height()
            });
        },
        elements: elements.value,
        style: style.value,
        wheelSensitivity: 0.5,
    } as any)

    cy.on('cxttap', 'node', (e) => {
        e.preventDefault()
        currentNode = e.target
        contextMenuX.value = e.originalEvent.pageX
        contextMenuY.value = e.originalEvent.pageY
        contextMenuVisible.value = true
    })

    // 点击空白处隐藏菜单
    cy.on('tap', (e) => {
        if (!e.target || e.target === cy) {
            contextMenuVisible.value = false
        }
    })

    // 初始化 layoutUtilities
    instance2 = cy.layoutUtilities("get")

    // 初始化 viewUtilities
    instance1 = cy.viewUtilities(layoutOptions.value)

    // 初始样式和 Legend
    legendColors.value = getClusterColorsFromElements()
})

// 测试
const testFunc = () => {
    console.log('test')
}

// —— CISE 实例
let instance1: ViewUtilitiesInstance
let instance2: LayoutUtilitiesInstance

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
let currentNode: cytoscape.NodeSingular | null = null

// —— 右键添加节点功能
function handleRightClickAddNodes(e: cytoscape.EventObject) {
    const clickedNode = e.target;
    const sourceId = clickedNode.data('id');
    const clusterId = clickedNode.data('clusterID');
    // if (!sourceId || prevClickedNodeId === sourceId) return;
    // prevClickedNodeId = sourceId;

    const height = clickedNode.data('height');
    const width = clickedNode.data('width');
    const color = clickedNode.data('color');
    const borderColor = clickedNode.data('borderColor');
    const text = clickedNode.data('text');
    const textFont = clickedNode.data('textFont');
    const textColor = clickedNode.data('textColor');
    const shape = clickedNode.data('shape');

    const random = Math.floor(1 + 5 * Math.random());
    const newNodes: string[] = [];
    const collection = cy.collection().union(clickedNode);
    // 生成新节点及连向 source 节点的边
    for (let i = 1; i <= random; i++) {
        const nodeId = sourceId + 'n' + i;
        const edgeId = sourceId + 'e' + i;
        if (!arrayOfClusterArrays[clusterId]?.includes(nodeId)) {
            arrayOfClusterArrays[clusterId].push(nodeId);
            newNodes.push(nodeId);

            cy.add([
                { group: 'nodes', data: { id: nodeId, height, width, color, borderColor, text, textFont, textColor, clusterID: clusterId, shape } },
                { group: 'edges', data: { id: edgeId, source: sourceId, target: nodeId, color, style: 'Solid', arrow: 'None', width: '1' } }
            ]);
            collection.merge(cy.$id(nodeId));
            cy.$id(nodeId).style('background-color', clusterColors[clusterId]);
        }
    }

    // 放置新节点
    const nodesToBeAdded = cy.collection();
    newNodes.forEach(id => nodesToBeAdded.merge(cy.$id(id)));
    instance2?.placeNewNodes(nodesToBeAdded);

    // 生成新节点之间的随机边（复刻 HTML/JS 版逻辑）
    let remainingNodes = [...newNodes]; // 剩余节点数组，用于防止重复选择
    const randomEdge = Math.floor(1 + (random - 1) * Math.random());

    for (let i = 0; i < randomEdge; i++) {
        if (remainingNodes.length < 2) break; // 不够节点生成边
        // 随机选择 idx1, idx2
        let idx1 = Math.floor(1 + (remainingNodes.length - 1) * Math.random()); // 从 1 开始，避免 source 节点
        let idx2 = Math.floor(1 + (remainingNodes.length - 1) * Math.random());

        if (idx1 === idx2) {
            if (idx2 + 1 < remainingNodes.length) idx2++;
            else if (idx2 - 1 >= 0) idx2--;
        }

        const n1 = remainingNodes[idx1];
        const n2 = remainingNodes[idx2];

        if (n1 && n2) {
            cy.add({ group: 'edges', data: { id: n1 + 'e' + n2, source: n1, target: n2, color, style: 'Solid', arrow: 'None', width: '1' } });
            remainingNodes.splice(idx1, 1); // 移除已使用的 idx1 节点，避免重复
        }
    }
    instance1?.highlight(collection);
}

function updateLegend() {
    legendColors.value = clusterColors.map(hexToRgbString)
}

// 从elements中提取颜色以及簇
function getClusterColorsFromElements() {
    const colorMap: Record<string, number> = {}
    const colors: string[] = []

    let clusterId = 0
    for (const node of cy.nodes()) {
        const color = node.data('color') || node.style('background-color')
        if (typeof color === 'string' && !(color in colorMap)) {
            colorMap[color] = clusterId++
            colors.push(`rgb(${color})`) // 例如 "58 196 225" -> "rgb(58 196 225)"
        }
    }
    return colors
}

// 右键的三个功能函数
function contextAddNode() {
    if (currentNode) handleRightClickAddNodes({ target: currentNode } as any)
    contextMenuVisible.value = false
}

function contextExpandNode() {
    console.log('expand', currentNode?.data('id'))
    contextMenuVisible.value = false
}

// 存放每个被收缩节点隐藏的邻居
const collapsedMap = new Map<string, cytoscape.ElementDefinition[]>()
function contextCollapseNode() {
    if (!currentNode) return
    const id = currentNode.id()

    // 已经收缩过就不重复
    if (collapsedMap.has(id)) {
        contextMenuVisible.value = false
        return
    }

    const neighbors = currentNode.connectedEdges().connectedNodes().filter(n => n.id() !== id)
    const edges = currentNode.connectedEdges().filter(edge => {
        const src = edge.source().id()
        const tgt = edge.target().id()
        return src === id || tgt === id
    })

    // 存储被隐藏的节点和边的定义
    const hiddenElements: cytoscape.ElementDefinition[] = []

    neighbors.forEach(node => {
        hiddenElements.push({ group: 'nodes', data: node.data() })
        node.remove()
    })

    edges.forEach(edge => {
        // 只隐藏连接 collapsed 节点的边
        hiddenElements.push({ group: 'edges', data: edge.data() })
        edge.remove()
    })

    collapsedMap.set(id, hiddenElements)
    contextMenuVisible.value = false
}


// —— 运行 CISE 布局
function runCiseLayout() {
    const layout = cy.layout({
        name: 'cise',
        nodeSeparation: settings.nodeSeparation,
        allowNodesInsideCircle: settings.allowNodesInCircles,
        maxRatioOfNodesInsideCircle: settings.maxRatioOfNodesInCircle,
        animate: settings.animationType == 'end' ? 'end' : true,
        animationDuration: 1000,
        clusters: arrayOfClusterArrays,
        refresh: 1,
        idealInterClusterEdgeLengthCoefficient: settings.idealEdgeLengthCoef,
        randomize: settings.randomize,
        fit: settings.fit,
        packComponents: settings.packComponents,
    } as any)

    layout.run()
}
// 移除选中 cluster 的高亮效果
const removeHighlights = () => {
    const t = cy.viewUtilities()
    t.removeHighlights();
}
// 新增选中 cluster
const addCluster = () => {
    if (!cy || cy.nodes(':selected').length === 0) return;

    const clusterColorsTemp: Record<number, string> = {};
    const uniqueClusterIDs: Record<number, string[]> = {};
    let uniqueClusterNum = 0;

    cy.nodes(':unselected').forEach(node => {
        let clusterID = node.data('clusterID');
        if (typeof clusterID !== 'number') clusterID = Number(clusterID);

        if (clusterID !== -1 && typeof clusterID === 'number') {
            if (clusterID in uniqueClusterIDs) {
                uniqueClusterIDs[clusterID].push(node.data('id'));
            } else {
                uniqueClusterIDs[clusterID] = [node.data('id')];
                clusterColorsTemp[clusterID] = node.style('background-color');
                uniqueClusterNum++;
            }
        }
    });

    const newClusters: string[][] = [];
    const newColors: string[] = [];
    let count = 0;
    const maxClusterID = Math.max(...Object.keys(uniqueClusterIDs).map(Number), 0);

    for (let i = 0; i <= maxClusterID; i++) {
        if (i in uniqueClusterIDs) {
            newClusters[i - count] = uniqueClusterIDs[i];
            newColors[i - count] = clusterColorsTemp[i];
            cy.nodes(`[clusterID = ${i}]:unselected`).forEach(node => {
                node.data('clusterID', i - count);
            });
        } else {
            count++;
        }
    }

    // 生成新颜色
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    const rgbColor = `rgb(${r}, ${g}, ${b})`;

    const newID = newClusters.length;
    newClusters.push([]);
    newColors.push(rgbColor);

    // 处理选中的节点
    cy.nodes(':selected').forEach(node => {
        node.data('clusterID', newID);
        newClusters[newID].push(node.data('id'));
    });

    // 更新响应式数据
    arrayOfClusterArrays = newClusters;
    clusterColors = newColors;

    // 更新样式
    cy.style()
        .selector('node')
        .style({
            content: 'data(id)',
            'background-color': ele => {
                for (let i = 0; i < newClusters.length; i++) {
                    if (newClusters[i].includes(ele.data('id'))) {
                        return newColors[i];
                    }
                }
                return '#756D76';
            }
        })
        .selector('edge')
        .style({
            'curve-style': 'bezier',
            width: 5,
            opacity: 0.65,
            'line-color': ele => {
                const source = ele.source().data('id');
                const target = ele.target().data('id');
                for (let i = 0; i < newClusters.length; i++) {
                    if (newClusters[i].includes(source) && newClusters[i].includes(target)) {
                        return newColors[i];
                    }
                }
                return '#756D76';
            }
        })
        .update();

    // 更新图例颜色（legendColors）
    legendColors.value = [...newColors];
};
// 移除选中 cluster
function removeCluster() {
    if (!cy || cy.nodes(':selected').length === 0) return

    cy.nodes(':selected').forEach((node: any) => node.data('clusterID', -1))

    const clusterColorsTemp: Record<number, string> = {}
    const uniqueClusterIDs: Record<number, string[]> = {}
    let uniqueClusterNum = 0

    cy.nodes(':unselected').forEach(node => {
        let clusterID = node.data('clusterID')
        if (typeof clusterID !== 'number') clusterID = Number(clusterID)
        if (clusterID !== -1) {
            if (clusterID in uniqueClusterIDs) {
                uniqueClusterIDs[clusterID].push(node.data('id'))
            } else {
                uniqueClusterIDs[clusterID] = [node.data('id')]
                clusterColorsTemp[clusterID] = node.style('background-color')
                uniqueClusterNum++
            }
        }
    })

    const newClusters: string[][] = []
    const newColors: string[] = []
    let count = 0
    const maxClusterID = Math.max(...Object.keys(uniqueClusterIDs).map(Number), 0)

    for (let i = 0; i <= maxClusterID; i++) {
        if (i in uniqueClusterIDs) {
            newClusters[i - count] = uniqueClusterIDs[i]
            newColors[i - count] = clusterColorsTemp[i]
            cy.nodes(`[clusterID = ${i}]:unselected`).forEach(node => {
                node.data('clusterID', i - count)
            })
        } else {
            count++
        }
    }

    arrayOfClusterArrays = newClusters
    clusterColors = newColors

    cy.style()
        .selector('node')
        .style({
            content: 'data(id)',
            'background-color': ele => {
                for (let i = 0; i < newClusters.length; i++) {
                    if (newClusters[i].includes(ele.data('id'))) {
                        return newColors[i]
                    }
                }
                return '#756D76'
            }
        })
        .selector('edge')
        .style({
            'curve-style': 'bezier',
            width: 5,
            opacity: 0.65,
            'line-color': ele => {
                const source = ele.source().data('id')
                const target = ele.target().data('id')
                for (let i = 0; i < newClusters.length; i++) {
                    if (newClusters[i].includes(source) && newClusters[i].includes(target)) {
                        return newColors[i]
                    }
                }
                return '#756D76'
            }
        })
        .update()
}

// —— GraphML 导入功能
function onImportClick() {
    if (!fileInput.value) return
    fileInput.value.value = ''  // 清空 value，确保选择同名文件也会触发 change
    fileInput.value?.click()
}

function onFileChange(evt: Event) {
    console.log('导入graphml')
    const target = evt.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0) return
    const reader = new FileReader()
    reader.readAsText(files[0])
    reader.onload = (event) => {
        const contents = event.target?.result as string
        // 调试输出
        cy.style().clear()
        cy.remove('nodes')
        cy.remove('edges')
        cy.graphml({ layoutBy: "circle" })
        cy.graphml(contents);


        // —— 可选 Markov Clustering
        if (settings.markovClusteringApplied) {
            const clusters = cy.elements().markovClustering({ expandFactor: 3 })
            clusters.forEach((cluster: any, i: number) => {
                cluster.forEach((node: any) => node._private.data.clusterID = i)
            })
        }

        // —— 根据节点生成 cluster 数组 & 颜色
        const clusterColorsTemp: Record<string, string> = {}
        const uniqueClusterIDs: Record<string, string[]> = {}
        cy.nodes().forEach(node => {
            const clusterID = node.data('clusterID') ?? 'unclustered'
            if (clusterID in uniqueClusterIDs) uniqueClusterIDs[clusterID].push(node.data("id"))
            else {
                uniqueClusterIDs[clusterID] = [node.data("id")]
                const r = Math.floor(Math.random() * 255)
                const g = Math.floor(Math.random() * 255)
                const b = Math.floor(Math.random() * 255)
                clusterColorsTemp[clusterID] = '#' + fullColorHex(r, g, b)
            }
        })

        const maxClusterID = Math.max(...Object.keys(uniqueClusterIDs).map(k => Number(k)))
        arrayOfClusterArrays = new Array(Object.keys(uniqueClusterIDs).length)
        clusterColors = new Array(Object.keys(uniqueClusterIDs).length)
        let count = 0
        for (let i = 0; i <= maxClusterID; i++) {
            if (!(i in uniqueClusterIDs)) count++
            else {
                arrayOfClusterArrays[i - count] = uniqueClusterIDs[i]
                clusterColors[i - count] = clusterColorsTemp[i]
                cy.nodes(`[clusterID = ${i}]`).forEach((node: any) => node.data("clusterID", i - count))
            }
        }

        // —— 更新样式
        cy.style()
            .selector('node:selected').style({ 'border-color': '#00FF00', 'border-width': '4px' })
            .selector('node').style({
                content: 'data(id)',
                'background-color': ele => {
                    for (let i = 0; i < arrayOfClusterArrays.length; i++)
                        if (arrayOfClusterArrays[i].includes(ele.data("id"))) return clusterColors[i]
                    return '#756D76'
                }
            })
            .selector('edge').style({
                'curve-style': 'bezier',
                width: 5,
                opacity: 0.65,
                'line-color': ele => {
                    const source = ele.source()
                    const target = ele.target()
                    for (let i = 0; i < arrayOfClusterArrays.length; i++)
                        if (arrayOfClusterArrays[i].includes(source.data("id")) &&
                            arrayOfClusterArrays[i].includes(target.data("id"))) return clusterColors[i]
                    return '#756D76'
                }
            }).update()

        updateLegend()
    }
}

function importGraphConfig(evt: Event) {
    console.log("importGraphConfig")
    const target = evt.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0) return

    const reader = new FileReader()
    reader.readAsText(files[0])
    reader.onload = async (event) => {
        try {
            const contents = event.target?.result as string
            const data = JSON.parse(contents)
            if (!cy) return

            // 清空现有图
            cy.elements().remove()
            cy.style().clear().update()

            // 添加节点和边
            data.elements.forEach((ele: any) => cy.add(ele))

            // 恢复簇和颜色
            arrayOfClusterArrays = data.clusters
            clusterColors = data.clusterColors

            // 恢复 layoutOptions
            layoutOptions.value = data.layoutOptions

            // 恢复样式，函数样式从库中恢复
            style.value = data.style.map((rule: any) => {
                const newStyle: any = {}
                Object.entries(rule.style).forEach(([k, v]) => {
                    if (k === 'background-color') newStyle[k] = nodeBackgroundColor
                    else if (k === 'shape') newStyle[k] = nodeShape
                    else if (k === 'line-color') newStyle[k] = edgeLineColor
                    else newStyle[k] = v
                })
                return {
                    selector: rule.selector,
                    style: newStyle
                }
            })

            // 更新 Cytoscape 样式
            cy.style(style.value)

            // 更新图例
            updateLegend()

            // 可选：运行布局
            const layout = cy.layout({ name: 'concentric', clusters: arrayOfClusterArrays } as any)
            layout.run()
        } catch (err) {
            console.error('导入配置失败', err)
        }
    }
}

const exportGraphConfig = () => {
    if (!cy) return;

    // 1. 获取节点和边元素
    const elementsToExport = cy.elements().map(ele => {
        const data = { ...ele.data() }  // 深拷贝节点数据
        // 可选：把函数 style 或不可序列化字段去掉
        return { group: ele.group(), data }
    })

    // 2. 保存簇数组和颜色
    const clustersToExport = arrayOfClusterArrays
    const colorsToExport = legendColors.value

    // 3. 保存 layoutOptions
    const layoutOptionsToExport = layoutOptions.value

    // 4. 保存 style（函数不能直接序列化，建议只保存字符串化的或纯数据样式）
    const styleToExport = style.value.map(rule => {
        return {
            selector: rule.selector,
            style: Object.fromEntries(
                Object.entries(rule.style).map(([k, v]) => [
                    k,
                    typeof v === 'function' ? v.toString() : v
                ])
            )
        }
    })
    console.log('clusterColors', legendColors)
    // 5. 整合成 JSON
    const exportData = {
        elements: elementsToExport,
        clusters: clustersToExport,
        clusterColors: colorsToExport,
        layoutOptions: layoutOptionsToExport,
        style: styleToExport
    }

    // 6. 下载文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph-config.json'
    a.click()
    URL.revokeObjectURL(url)
}

// 暴露给父组件调用
defineExpose({
    runCiseLayout,
    addCluster,
    removeCluster,
    clusterColors: legendColors,
    removeHighlights,
    testFunc,
    onImportClick,
    importGraphConfig,
    exportGraphConfig
})
</script>

<style scoped>
.cy {
    width: 100%;
    height: 90vh;
}

.context-menu {
    position: absolute;
    background: #fff;
    border: 1px solid #ccc;
    z-index: 1000;
    width: 150px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.context-menu ul {
    list-style: none;
    padding: 5px 0;
    margin: 0;
}

.context-menu li {
    padding: 8px 12px;
    cursor: pointer;
}

.context-menu li:hover {
    background-color: #f0f0f0;
}
</style>
