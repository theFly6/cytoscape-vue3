<!-- GraphControls.vue -->
<template>
    <div class="graph-controls">
        <div class="controls-title">
            <h1>cytoscape-cise demo</h1>
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

        <!-- 布局参数设置弹窗按钮 -->
        <button class="open-button" @click="isFormOpen = !isFormOpen">布局选项</button>

        <!-- 参数表单弹窗 -->
        <div class="form-popup" v-show="isFormOpen">
            <div class="form-container">
                <div class="options">
                    <b>Animation Type:</b>
                    <input type="radio" name="radio" value="end" v-model="settings.animationType" class="radio" /> End
                    <input type="radio" name="radio" value="during" v-model="settings.animationType" class="radio" />
                    During
                </div>

                <div class="options">
                    <b>Node Separation:</b>
                    <input type="number" v-model="settings.nodeSeparation" step="0.1" min="0" />
                </div>

                <div class="options">
                    <b>Allow Nodes In Circles:</b>
                    <input type="radio" name="radio2" :value="false" v-model="settings.allowNodesInCircles"
                        class="radio" /> No
                    <input type="radio" name="radio2" :value="true" v-model="settings.allowNodesInCircles"
                        class="radio" /> Yes
                </div>

                <div class="options">
                    <b>Max Ratio Of Nodes Inside Circle:</b>
                    <input type="number" v-model="settings.maxRatioOfNodesInCircle" step="0.1" min="0" max="1" />
                </div>

                <div class="options">
                    <b>Ideal Inter-Cluster Edge Length Coef:</b>
                    <input type="number" v-model="settings.idealEdgeLengthCoef" step="0.1" min="0" />
                </div>

                <div class="options">
                    <b>Pack Components:</b>
                    <input type="checkbox" v-model="settings.packComponents" />
                </div>

                <div class="options">
                    <b>Randomize:</b>
                    <input type="checkbox" v-model="settings.randomize" />
                </div>

                <div class="options">
                    <b>Fit:</b>
                    <input type="checkbox" v-model="settings.fit" />
                </div>

                <div class="options">
                    <b>Apply Markov Clustering on Load:</b>
                    <input type="checkbox" v-model="settings.markovClusteringApplied" />
                </div>

                <button type="button" class="btn cancel" @click="isFormOpen = false"><b>Close Options</b></button>
            </div>
        </div>


        <button @click="$emit('remove-highlights')">移除HightLights</button>
        <button @click="$emit('add-cluster')">新增Cluster</button>
        <button @click="$emit('remove-cluster')">移除Cluster</button>
        <button @click="$emit('import-graphml')">导入GraphML</button>
        <button @click="$emit('run-cise')">运行CISE布局</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGraphSettingsStore } from '@/stores/graphSettings'
import informationImg from '@/assets/information-button.png'

const settings = useGraphSettingsStore()
const isFormOpen = ref(false)

defineEmits([
    'remove-highlights',
    'add-cluster',
    'remove-cluster',
    'import-graphml',
    'run-cise',
    'test-func'
])
</script>

<style scoped>
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

.controls-title {
    display: flex;
    text-align: center;
    align-items: center;
    gap: 10px;
}

h1 {
    opacity: 0.5;
    font-size: 1em;
    font-weight: bold;
    margin: 0;
    margin-bottom: 5px;
    height: 100%;
}

.graph-controls {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
}

button {
    background-color: #555;
    color: white;
    padding: 7px 10px;
    border: none;
    cursor: pointer;
    opacity: 0.8;
    width: 150px;
    margin-right: 3px;
    margin-bottom: 5px;
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
