<!-- CytoscapeGraph.vue -->
<template>
    <div id="cy" class="cy" ref="cyContainer"></div>
    <input ref="fileInput" type="file" style="display:none" @change="onFileChange" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from '@/utils/cytoscape'

import { elements, style, arrayOfClusterArrays as initClusters, options1 } from '@/data/graph'
import type { ViewUtilitiesInstance } from '@/types/cytoscape'
import type { LayoutUtilitiesInstance } from '@/types/cytoscape'

const cyContainer = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let cy: cytoscape.Core

// 选项配置
import { useGraphSettingsStore } from '@/stores/graphSettings'

const settings = useGraphSettingsStore()

// —— 非响应式变量
let arrayOfClusterArrays: string[][] = JSON.parse(JSON.stringify(initClusters))
let clusterColors: string[] = []
let legendColors = ref()

// —— 初始化 Cytoscape
onMounted(() => {
    if (!cyContainer.value) return

    cy = cytoscape({
        container: document.getElementById('cy'),
        layout: { name: 'concentric', clusters: arrayOfClusterArrays },
        ready: function () {
            // initialize layout-utilities extension
            this.layoutUtilities({
                desiredAspectRatio: this.width() / this.height()
            });
        },
        elements,
        style,
        wheelSensitivity: 0.5,
    } as any)
    // 初始化 layoutUtilities
    instance2 = cy.layoutUtilities("get")

    // 初始化 viewUtilities
    instance1 = cy.viewUtilities(options1)

    // 初始样式和 Legend
    legendColors.value = getClusterColorsFromElements()
})

// 测试
const testFunc = () => {
    console.log(cy)
}

// —— CISE 实例
let instance1: ViewUtilitiesInstance
let instance2: LayoutUtilitiesInstance

// —— 防止重复注册右键事件
// let isRightClickRegistered = false
// let prevClickedNodeId = ''

// —— 工具函数
const rgbToHex = (rgb: number) => rgb.toString(16).padStart(2, '0')
const fullColorHex = (r: number, g: number, b: number) => rgbToHex(r) + rgbToHex(g) + rgbToHex(b)
function hexToRgbString(hex: string): string {
    const parsed = hex.replace("#", "");
    const r = parseInt(parsed.substring(0, 2), 16);
    const g = parseInt(parsed.substring(2, 4), 16);
    const b = parseInt(parsed.substring(4, 6), 16);
    return `rgb(${r} ${g} ${b})`;
}

// —— 右键添加新节点
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
    updateLegend();
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

// —— 运行 CISE 布局
function runCiseLayout() {
    cy.nodes().on('cxttap', handleRightClickAddNodes)
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
    fileInput.value?.click()
}

function onFileChange(evt: Event) {
    const target = evt.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0) return
    const reader = new FileReader()
    reader.readAsText(files[0])
    reader.onload = (event) => {
        const contents = event.target?.result as string
        console.log('$', $)
        // 调试输出
        console.log('[DEBUG] GraphML contents:', contents.slice(0, 200))

        cy.style().clear()
        cy.remove('nodes')
        cy.remove('edges')
        console.log(cy.graphml)
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
// 暴露给父组件调用
defineExpose({
    runCiseLayout,
    addCluster,
    removeCluster,
    clusterColors: legendColors,
    removeHighlights,
    testFunc,
    onImportClick
})
</script>

<style scoped>
.cy {
    width: 100%;
    height: 90vh;
}
</style>
