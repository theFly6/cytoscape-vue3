<template>
    <div class="playground-container">
        <div ref="playgroundContainer" class="playground" />
        <button @click="runLayout">运行布局</button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from '@/utils/cytoscape'

// Cytoscape 容器 DOM 引用
const playgroundContainer = ref(null)

let cy: cytoscape.Core
onMounted(async () => {
    if (!playgroundContainer.value) return

    // 初始化 Cytoscape
    cy = cytoscape({
        container: playgroundContainer.value,
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(id)',
                    'color': '#111',
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
        ]
    })

    cy.graphml({ layoutBy: 'circle' });

    // 动态导入 GraphML 数据
    const module = await import('@/data/playground-data');
    const graphStr = module.graphStr;
    cy.graphml(graphStr);

    cy.nodes().forEach(node => {
        const id = node.id();
        const depth = id.split('::').length;  // 以 :: 分割，长度就是深度
        node.data('depth', depth);
    });

    // options 可自定义按钮样式、动画等
    const api = cy.expandCollapse({
        fisheye: false,    // 是否开启鱼眼效果
        animate: true,     // 动画效果
        undoable: false    // 是否支持撤销
    });

    // cy.nodes().forEach(node => {
    //     if (node.data('depth') >= 1) {
    //         api.collapse(node);  // 折叠二级及以上节点
    //     }
    // });

    cy.nodes().forEach(node => {
        if (node.isParent()) {
            console.log('父节点', node.id());
            node.data('collapsible', true)  // 标记为可折叠节点
        } else {
            node.data('collapsible', false)
        }
    });

    cy.style()
        .selector('node[depth = 1]')
        .style({
            'background-color': '#4DA8DA'
        })
        .selector('node[depth = 2]')
        .style({
            'background-color': '#FFB74D'
        })
        .selector('node[depth = 3]')
        .style({
            'background-color': '#81C784'
        })
        .selector('node[depth > 3]')  // 深层节点
        .style({
            'background-color': '#BA68C8'
        })
        .selector('edge')
        .style({
            'width': 2,
            'line-color': '#B0BEC5',
            'target-arrow-color': '#B0BEC5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        })

        .update();

})

// 运行布局
const runLayout = () => {
    const clusters = cy.nodes()
        .filter(n => {
            console.log('节点', n.id(), '是否父节点', n.isParent(), '是否可见', n.visible(), '是否有父节点', n.parent().length > 0);
            return n.visible() && n.parent().length === 0
        }) // 只包含父节点且可见
        .map(n => [n.id()])

    const layout = cy.layout({
        name: 'cise',
        allowNodesInsideCircle: true,
        allowNodesOutsideCircle: true,
        nodeSeparation: 20,
        refresh: 1,
        animate: 'end',
        animationDuration: 1000,
        clusters  // 每个父节点作为一个 cluster
    } as cytoscape.LayoutOptions);

    layout.run()
}

</script>

<style scoped>
.playground {
    width: 100%;
    height: 90vh;
}

.playground-container {
    margin-top: 5px;
    background-color: rgba(11, 87, 87, 0.185);
}
</style>
