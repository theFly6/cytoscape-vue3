<template>
    <div class="control-panel">
        <div class="controls-title">
            <h1>demo</h1>
            <div class="infoImg">
                <div class="tooltipImg">
                    <img :src="informationImg" style="display: inline-block; width:18px; height:18px" />
                    <span class="tooltipImgtext">
                        CiSE演示帮助<br /><br />
                        通过本演示，您可以：
                        <ul>
                            <li>导入GraphML格式的图形。如果您希望图形在加载时自动聚类，请勾选“Apply Markov Clustering on Load”</li>
                            <li>使用CISE风格进行布局</li>
                            <li>右键点击节点以添加一些随机邻居节点</li>
                            <li>使用“新增Cluster”/“移除Cluster”按钮更改当前Cluster</li>
                            <li>调整布局选项（有关这些选项的说明，请参考README中的API）</li>
                        </ul>
                    </span>
                </div>
            </div>
        </div>

        <BaseButton @click="shiftFormOpen">布局选项</BaseButton>
        <BaseButton @click="removeHighlights">清除高亮</BaseButton>
        <input ref="fileInput" type="file" style="display:none" @change="onFileChange" />
        <BaseButton @click="importGraphML">导入GraphML</BaseButton>
        <BaseButton @click="importJsonConfig">导入JSON配置</BaseButton>
        <BaseButton @click="exportJsonConfig">导出JSON配置</BaseButton>
        <input ref="importInput" type="file" style="display:none" @change="importGraphConfig" />
        <div class="form-popup" v-show="isFormOpen">
            <div class="form-container">
                <div class="options">
                    <b>Animation Type:</b>
                    <input type="radio" name="radio" value="end" v-model="animationType" class="radio" /> End
                    <input type="radio" name="radio" value="during" v-model="animationType" class="radio" />
                    During
                </div>

                <div class="options">
                    <b>Node Separation:</b>
                    <input type="number" v-model="nodeSeparation" step="0.1" min="0" />
                </div>

                <div class="options">
                    <b>Allow Nodes In Circles:</b>
                    <input type="radio" name="radio2" :value="false" v-model="allowNodesInCircles" class="radio" />
                    No
                    <input type="radio" name="radio2" :value="true" v-model="allowNodesInCircles" class="radio" />
                    Yes
                </div>

                <div class="options">
                    <b>Max Ratio Of Nodes Inside Circle:</b>
                    <input type="number" v-model="maxRatioOfNodesInCircle" step="0.1" min="0" max="1" />
                </div>

                <div class="options">
                    <b>Ideal Inter-Cluster Edge Length Coef:</b>
                    <input type="number" v-model="idealEdgeLengthCoef" step="0.1" min="0" />
                </div>

                <div class="options">
                    <b>Pack Components:</b>
                    <input type="checkbox" v-model="packComponents" />
                </div>

                <div class="options">
                    <b>Randomize:</b>
                    <input type="checkbox" v-model="randomize" />
                </div>

                <div class="options">
                    <b>Fit:</b>
                    <input type="checkbox" v-model="fit" />
                </div>

                <div class="options">
                    <b>Apply Markov Clustering on Load:</b>
                    <input type="checkbox" v-model="markovClusteringApplied" />
                </div>

                <button type="button" class="btn cancel" @click="isFormOpen = false"><b>Close Options</b></button>
            </div>
        </div>

        <BaseButton @click="runCiseLayout">运行Cise布局</BaseButton>
        <!-- 右键菜单 -->
        <div v-if="contextMenuVisible" :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
            class="context-menu">
            <ul>
                <li @click="contextAddNode">添加子节点</li>
                <li @click="contextShowNodeDetails">节点详情</li>
                <li @click="contextRemoveHighlights">清除高亮</li>
                <li @click="contextRemoveNode">移除节点</li>
                <li @click="contextRecoverNode">恢复节点</li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue'
import informationImg from '@/assets/information-button.png'

// 引入通用按钮组件
import BaseButton from '@/components/common/BaseButton.vue'

// 引入 cy 实例 hook
import { useCyInstance } from '../hooks/useCyInstance'
const { cy } = useCyInstance()

// 引入layoutUtilities布局相关 hook
import { useCyLayout } from '../hooks/useCyLayout'
const { runCiseLayout } = useCyLayout(cy)

// 引入 GraphML hook
import { useGraphML } from '../hooks/useGraphML'
const { fileInput, onFileChange, importGraphML } = useGraphML(cy)

// 引入viewUtilities视图相关 hook
import { useCyView } from '../hooks/useCyView'
import { onMounted, ref, toRaw, watchEffect, type Ref } from 'vue'
const { removeHighlights } = useCyView(cy)

// 右键菜单相关
import { useContextMenu } from '../hooks/useContextMenu'
const { contextMenuVisible, contextMenuX, contextMenuY, showContextMenu, currentNode } = useContextMenu()
import { useContextActions } from '../hooks/useContextActions'
const { addNode, removeNode, recoverNode } = useContextActions(cy)

// 引入配置选项
import { useGraphSettings } from '../hooks/useGraphSettings'
const settings = useGraphSettings()
const { isFormOpen,
    animationType, nodeSeparation,
    allowNodesInCircles, markovClusteringApplied,
    maxRatioOfNodesInCircle, idealEdgeLengthCoef, packComponents,
    randomize, fit
} = settings
const shiftFormOpen = () => {
    isFormOpen.value = true
}

// 新增子节点
const contextAddNode = () => {
    addNode(currentNode.value)
    // 隐藏右键菜单
    contextMenuVisible.value = false
}

// 引入节点信息 hook
import { useNodeInfo, drawerVisible } from '../hooks/useNodeInfo'
const { loading, error, fetchNodeInfo } = useNodeInfo()
import { ElMessage } from 'element-plus'

// 显示节点详情
const contextShowNodeDetails = useDebounceFn(async () => {
    const nodeID = currentNode.value?.data().id
    contextMenuVisible.value = false
    if (nodeID) await fetchNodeInfo(nodeID)
    if (error.value) {
        return ElMessage.error(`获取节点信息失败: ${error.value.message || error.value}`)
    }
    drawerVisible.value = true
}, 300)

// 恢复节点
const contextRecoverNode = () => {
    recoverNode()
    contextMenuVisible.value = false
}

// 移除节点
const contextRemoveNode = () => {
    removeNode()
    contextMenuVisible.value = false
}

// 清除高亮
const contextRemoveHighlights = () => {
    removeHighlights()
    contextMenuVisible.value = false
}

onMounted(() => {
    // 阻止右键菜单默认行为
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })

    setTimeout(() => {
        // 监听右键事件，显示菜单
        cy.value?.on('cxttap', 'node', showContextMenu)

        // 点击空白处隐藏菜单
        cy.value?.on('tap', (e) => {
            if (!e.target || e.target === toRaw(cy.value)) {
                contextMenuVisible.value = false
            }
        })
    }, 1000);
})

// 引入JSON配置导入导出 hook
import { useJSONAction } from '../hooks/useJSONAction'
import { useDebounceFn } from '@/utils/useDebounceFn'
const { importGraphConfig, importInput, exportGraphConfig } = useJSONAction(cy)

const importJsonConfig = useDebounceFn(() => {
    if (!importInput.value) return
    importInput.value.value = ''  // 清空 value
    importInput.value.click()
}, 300)

const exportJsonConfig = () => {
    exportGraphConfig()
}

</script>


<style scoped>
/* 右键菜单样式 */
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

/* 布局弹窗样式 */
.form-popup {
    /* display: none; */
    position: absolute;
    top: 30px;
    left: 5px;
    width: 450px;
    border: 3px solid #f1f1f1;
    z-index: 999;
}

b {
    font-weight: bolder;
}

.form-popup[style*="display: block"] {
    display: block !important;
}

.form-container {
    max-width: 450px;
    padding: 10px;
    background-color: white;
}

.form-container input[type=number] {
    width: 30%;
    padding: 7px 7px;
    border: none;
    background: #f1f1f1;
}

.form-container .btn {
    background-color: #4CAF50;
    color: white;
    padding: 5px 5px;
    border: none;
    cursor: pointer;
    width: 100%;
    margin-bottom: 10px;
    opacity: 0.8;
}

.form-container .cancel {
    margin-top: 10px;
    background-color: #ff5b49;
}

.form-container .btn:hover,
.open-button:hover {
    opacity: 1;
}

.options {
    margin-top: 5px;
    margin-bottom: 30px;
    margin-left: 5px;
}

.radio {
    margin-left: 20px;
}

/* 标题Tips */

.controls-title {
    display: flex;
    align-items: center;
    justify-self: center;
    gap: 10px;
    width: 100px;
}

h1 {
    opacity: 0.5;
    font-size: 1em;
    font-weight: bold;
    margin: 0;
    margin-bottom: 5px;
    height: 100%;
}


.tooltipImg {
    height: 100%;
}

.tooltipImg .tooltipImgtext {
    visibility: hidden;
    width: 400px;
    background-color: black;
    color: #ddd;
    text-align: left;
    padding: 8px 8px;
    border-radius: 6px;
    position: absolute;
    z-index: 999;
}

.tooltipImg:hover .tooltipImgtext {
    visibility: visible;
}
</style>