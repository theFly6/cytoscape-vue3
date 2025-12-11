<template>
    <span class="select-title">当前拓扑节点：</span>
    <el-select v-model="curNode" placeholder="Select" style="width: 240px">
        <el-option v-for="item in nodes" :key="item.value" :label="item.label" :value="item.value"
            @click="handleNodeSelection">
            <span style="float: left">{{ item.label }}</span>
            <span style="
          float: right;
          color: var(--el-text-color-secondary);
          font-size: 13px;
        ">
                {{ item.value }}
            </span>
        </el-option>
    </el-select>
</template>

<style scoped>
.select-title {
    font-weight: bold;
    margin-left: 8px;
}

.el-select {
    margin-left: 7px;
    margin-top: 5px;
}
</style>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'

// 引入 cy 实例 hook
import { useCyInstance } from '../hooks/useCyInstance'
const { cy } = useCyInstance()
import { useNodeSelection } from '../hooks/useNodeSelection'
const { handleTopoConfig } = useNodeSelection(cy)

const curNode = ref('请选择拓扑节点')
const nodes = ref<{ value: string; label: string }[]>([])

// 5s的定时器，定时刷新节点列表
const timer = ref()

onMounted(async () => {
    // 从后端获取数据
    timer.value = setInterval(async () => {
        // const curTime = new Date().toLocaleTimeString()
        // console.log('定时器触发', curTime)
        const res = await axios.get('http://localhost:3000/topology/info/nodes')
        const data = res.data

        nodes.value = data.nodes.map((node: { hostname: string; ip: string }) => ({
            value: node.ip,
            label: node.hostname,
        }))
    }, 5000)
})

// 组件销毁时清除定时器
onBeforeUnmount(() => {
    clearInterval(timer.value)
})


// 用户选择节点时触发
const handleNodeSelection = async () => {
    const ip = curNode.value
    const hostname = nodes.value.find(n => n.value === curNode.value)?.label
    console.log('Selected node:', ip, hostname)

    // 获取并更新拓扑信息
    handleTopoConfig(ip, hostname)

    // setTimeout(() => {
    //     handleSelect()
    // }, 100)
}

</script>
