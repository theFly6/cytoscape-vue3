<!-- Legend.vue -->
<template>
    <div class="legend">
        <div class="legend-title">Node Colors</div>
        <div class="legend-scale">
            <ul class="legend-labels">
                <li v-for="(ids, color, index) in clusterColorMap" :title="ids.join(', ')" :key="color">
                    <span :style="{ background: color }" v-if="color !== 'rgb(153,153,153)'"></span>
                    <span style="background: #999" v-else></span>
                    <div class="cluster-name" v-if="color !== 'rgb(153,153,153)'">
                        Cluster #{{ index + 1 }} ({{ ids.length }} nodes)
                    </div>
                    <div class="cluster-name" v-else>
                        Unclustered #({{ ids.length }} nodes)
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clusterColorMap } from '../hooks/useCyStyle';
</script>

<style scoped>
.legend {
    margin-left: 10px;
}

.legend .legend-title {
    font-weight: bold;
    font-size: 90%;
}

.legend .legend-scale ul {
    padding: 0;
    list-style: none;
    font-family: helvetica neue, helvetica, liberation sans, arial, sans-serif;
    /* 设置子元素间距 */
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.legend .legend-scale ul li {
    list-style: none;
    display: flex;
    font-size: 90%;
}

.legend .legend-scale ul li:hover {
    background-color: #eaecae;
    cursor: pointer;
}

/* legend颜色块 */
.legend ul.legend-labels li span {
    width: 30px;
    border: 1px solid #999;
}

/* cluster名称 */
.legend ul.legend-labels li .cluster-name {
    margin-left: 5px;
    color: #333;
}
</style>