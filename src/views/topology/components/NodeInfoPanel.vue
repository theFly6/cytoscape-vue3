<template>
    <el-button v-show="false" text @click="drawerVisible = true">打开节点信息面板</el-button>

    <el-drawer v-model="drawerVisible" :title="`节点信息- ${nodeInfoID}`" direction="rtl" size="520px" :with-header="true">
        <!-- 顶部操作按钮 -->
        <template #title>
            <div class="drawer-header">
                <span class="header-title">节点信息 - {{ nodeInfoID }}</span>
                <div class="header-actions">
                    <el-button :icon="RefreshRight" size="default" circle @click="handleRefresh"
                        :loading="isRefreshing" />
                    <!-- <el-button :icon="Minus" size="small" circle @click="isCollapsed = !isCollapsed" /> -->
                </div>
            </div>
        </template>

        <!-- 更新时间 -->
        <div class="timestamp">最后更新: {{ formatTimestamp(nodeData.timestamp) }}</div>

        <div v-if="!isCollapsed">
            <!-- 内存信息 -->
            <div class="section">
                <h3 class="section-title">内存信息</h3>
                <el-descriptions column="1" border>
                    <el-descriptions-item label="总内存">{{ nodeData.node.memory.total }}</el-descriptions-item>
                    <el-descriptions-item label="已使用">{{ nodeData.node.memory.used }}</el-descriptions-item>
                    <el-descriptions-item label="使用率">
                        <div class="usage-container">
                            <el-progress :percentage="nodeData.node.memory.utilization" stroke-width="6"
                                :status="getProgressStatus(nodeData.node.memory.utilization)" />
                            <span class="usage-value">{{ nodeData.node.memory.utilization }}%</span>
                        </div>
                    </el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- 内部连接 -->
            <div class="section">
                <h3 class="section-title">内部连接</h3>
                <el-table :data="nodeData.node.internalConnections" border size="small">
                    <el-table-column prop="type" label="类型" width="80" />
                    <el-table-column prop="bandwidth" label="带宽" />
                    <el-table-column prop="latency" label="延迟" />
                    <el-table-column label="使用率">
                        <template #default="scope">
                            <div class="usage-cell">
                                <el-progress :percentage="scope.row.utilization" stroke-width="4"
                                    :status="getProgressStatus(scope.row.utilization)" />
                                <span class="usage-text">{{ scope.row.utilization }}%</span>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 外部链接 -->
            <div class="section">
                <h3 class="section-title">外部链接</h3>
                <el-table :data="nodeData.links" border size="small">
                    <el-table-column label="连接" width="100">
                        <template #default="scope">{{ scope.row.from }} → {{ scope.row.to }}</template>
                    </el-table-column>
                    <el-table-column prop="type" label="类型" width="90" />
                    <el-table-column prop="bandwidth" label="带宽" />
                    <el-table-column label="使用率">
                        <template #default="scope">
                            <div class="usage-cell">
                                <el-progress :percentage="scope.row.utilization" stroke-width="4"
                                    :status="getProgressStatus(scope.row.utilization)" />
                                <span class="usage-text">{{ scope.row.utilization }}%</span>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <!-- 折叠状态 -->
        <div v-else class="collapsed-content">
            <p>内存使用率: {{ nodeData.node.memory.utilization }}%</p>
            <p>连接数: {{ nodeData.node.internalConnections.length + nodeData.links.length }}</p>
        </div>
    </el-drawer>
</template>


<script setup lang="ts">
import { ref } from 'vue'

import { RefreshRight } from '@element-plus/icons-vue'
// import { Minus } from '@element-plus/icons-vue'

// 控制抽屉显示
import { drawerVisible, nodeInfoID, nodeData } from '../hooks/useNodeInfo'

const isCollapsed = ref(false)
// const isRefreshing = ref(false)

// 节点数据（模拟数据）
// const nodeData = {
//     node: {
//         nodeID: 'n41',
//         memory: {
//             total: '16GB',
//             used: '6.72GB',
//             utilization: 46.76,
//         },
//         internalConnections: [
//             { type: 'NVLINK', bandwidth: '648GB/s', latency: '31ns', utilization: 22.45 },
//             { type: 'QPI', bandwidth: '30GB/s', latency: '65ns', utilization: 61.52 },
//             { type: 'PCIe', bandwidth: '128GB/s', latency: '803ns', utilization: 73.63 },
//         ],
//     },
//     links: [
//         { from: 'n41', to: 'node-080', type: 'Infiniband', bandwidth: '25GB/s', latency: '0.6μs', utilization: 13.17 },
//         { from: 'n41', to: 'node-003', type: 'Infiniband', bandwidth: '25GB/s', latency: '0.6μs', utilization: 12.88 },
//         { from: 'n41', to: 'node-034', type: 'Infiniband', bandwidth: '25GB/s', latency: '0.6μs', utilization: 13.59 },
//         { from: 'n41', to: 'node-043', type: 'Infiniband', bandwidth: '25GB/s', latency: '0.6μs', utilization: 47.79 },
//     ],
//     timestamp: '2025-09-10T10:25:36.379Z',
// }

// 工具函数
const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString()

const getProgressStatus = (percentage: number) => {
    if (percentage > 80) return 'error'
    if (percentage > 60) return 'warning'
    return 'success'
}

// 引入节点信息 hook
import { useNodeInfo } from '../hooks/useNodeInfo'
const { loading: isRefreshing, error, fetchNodeInfo } = useNodeInfo()

const handleRefresh = async () => {
    isRefreshing.value = true
    await fetchNodeInfo(nodeInfoID.value as string)
    isRefreshing.value = false
}

</script>

<style scoped>
.drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-title {
    font-weight: bold;
    font-size: 16px;
}

.header-actions {
    display: flex;
    gap: 6px;
}

.timestamp {
    text-align: right;
    font-size: 12px;
    color: #666;
    margin-bottom: 12px;
}

.section {
    margin-bottom: 18px;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    color: #333;
}

.section-title::before {
    content: '';
    width: 4px;
    height: 14px;
    background-color: #409eff;
    margin-right: 6px;
    border-radius: 2px;
}

.usage-container,
.usage-cell {
    display: flex;
    align-items: center;
    gap: 6px;
}

.usage-value,
.usage-text {
    min-width: 40px;
    text-align: right;
    font-size: 12px;
}
</style>

<style>
.is-drawer .el-drawer header.el-drawer__header {
    margin-bottom: 10px !important;
}
</style>