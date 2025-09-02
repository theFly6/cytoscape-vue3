<!-- ClusterLegend.vue -->
<template>
    <div class="my-legend">
        <div class="legend-title">Node Colors</div>
        <div class="legend-scale">
            <ul class="legend-labels" id="legend">
                <li id="unclusteredLegend">
                    <span style="background: #756D76"></span>Unclustered
                </li>
                <li v-for="(color, index) in colors" :key="index">
                    <span :style="{ background: color }"></span>Cluster #: {{ index }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{ colors: string[] }>()
watch(
    () => props.colors,
    (newColors, oldColors) => {
        console.log('colors changed:', newColors)
    },
    { deep: true } // 数组或对象变化要加 deep
)
</script>

<style scoped>
.my-legend .legend-title {
    margin-left: 30px;
    font-weight: bold;
    font-size: 90%;
}

.my-legend .legend-scale ul {
    margin-left: 30px;
    padding: 0;
    list-style: none;
    font-family: helvetica neue, helvetica, liberation sans, arial, sans-serif;
}

.my-legend .legend-scale ul li {
    font-size: 80%;
    list-style: none;
    margin-left: 0;
    line-height: 18px;
    margin-bottom: 0px;
}

.my-legend ul.legend-labels li span {
    display: inline-block;
    height: 16px;
    width: 30px;
    margin-right: 5px;
    margin-left: 0;
    border: 1px solid #999;
}

.my-legend a {
    color: #777;
}
</style>
