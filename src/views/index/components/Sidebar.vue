<template>
    <div id="sidebar">
        <header class="sidebar-header">
            <div class="logo-box">
                <div class="logo-inner"></div>
            </div>
            <h2>拓扑感知控制台</h2>
        </header>

        <!-- 节点管理 -->
        <div class="scroll-content">
            <section class="control-section">
                <div class="section-tag">集群管理</div>
                <div class="control-group">
                    <button class="control-btn" @click="openManager">
                        <span class="icon">⚙️</span> 管理节点配置
                    </button>
                </div>
            </section>

            <el-dialog v-model="isModalOpen" title="节点清单管理" width="600px" :before-close="handleBeforeClose"
                destroy-on-close>
                <el-table :data="editableNodes.slice(2)" stripe style="width: 100%" max-height="300">
                    <el-table-column label="主机名" width="120">
                        <template #default="scope">
                            <el-input v-model="scope.row.hostname" size="small" placeholder="请输入主机名" />
                        </template>
                    </el-table-column>
                    <el-table-column prop="ip" label="IP 地址" width="180">
                        <template #default="scope">
                            <!-- <el-input v-model="scope.row.ip" disable-transitions size="small" placeholder="请输入IP 地址" /> -->
                            <el-tag type="info" disable-transitions>{{ scope.row.ip }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="port" label="Port" width="180">
                        <template #default="scope">
                            <!-- 数字选择框 -->
                            <el-input-number :model-value="Number(scope.row.port)"
                                @update:model-value="(val: any) => { scope.row.port = val }" size="small" :min="1"
                                :max="65535" />
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100">
                        <template #default="scope">
                            <el-button link type="danger" @click="handleDelete(scope.row.ip)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="add-form-divider">
                    <el-divider content-position="left">添加新节点</el-divider>
                </div>

                <el-form :inline="true" :model="form" class="add-node-form">
                    <el-form-item label="主机名" class="form-item-hostname">
                        <el-input v-model="form.hostname" placeholder="如: mx20" />
                    </el-form-item>
                    <el-form-item label="IP 地址" class="form-item-ip">
                        <el-input v-model="form.ip" placeholder="如: 192.168.1.1" />
                    </el-form-item>
                    <el-form-item label="Port" class="form-item-port">
                        <el-input-number v-model="form.port" :placeholder="'22'" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="success" @click="handleAdd" :icon="Plus">添加</el-button>
                    </el-form-item>
                </el-form>

                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="isModalOpen = false">取消</el-button>
                        <el-button type="primary" @click="handleSaveAll">保存所有更改</el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 节点选择 -->
            <section class="control-section">
                <div class="section-tag">节点选择</div>
                <div class="control-group">
                    <div class="select-wrapper">
                        <select id="node-select" :value="currentNodeId" @change="onSelectChange">
                            <option v-for="option in nodes" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <button class="reload-btn control-btn" @click="$emit('reload')">
                        <span class="icon">🔄</span>
                        重载拓扑结构
                    </button>
                </div>
            </section>

            <div class="divider"></div>

            <section class="legend-section">
                <div class="section-tag">图例说明</div>
                <div class="legend-container">
                    <div v-for="item in LegendData" :key="item.color" class="legend-card">
                        <div class="legend-marker" :style="{ backgroundColor: '#ffffff', color: item.color }">
                            {{ item.text }}
                        </div>
                        <div class="legend-info">
                            <span class="legend-label">{{ item.label }}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>


        <footer class="sidebar-footer">
            v2.4.0-Stable
        </footer>
    </div>
</template>

<script setup lang="ts">
import { LegendData } from '@/data/index-data';
import { useTopologyStore } from '@/stores/useIndexStore';
import { Setting, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { useDebounceFn } from '@/utils/useDebounceFn';
// 使用共享 store
const { nodes, currentNodeId, fetchNodes } = useTopologyStore();

import { onMounted, reactive, ref } from 'vue';
const store = useTopologyStore();


const emit = defineEmits(['reload', 'clearDetails']);

const onSelectChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    currentNodeId.value = val;
    emit('clearDetails');
    console.log("Change", currentNodeId.value)
};

onMounted(async () => {
    fetchNodes();
    // 每3秒刷新一次
    // setInterval(async () => {
    //     console.log("刷新节点")
    //     useDebounceFn(() => {
    //         fetchNodes();
    //     }, 1000)();
    // }, 3000);
});

// -----------节点管理--------------
const isModalOpen = ref(false)
const form = reactive({ hostname: '', ip: '', port: 22 })
const editableNodes = ref<any[]>([]); // 弹窗内编辑的临时副本

// 打开弹窗并初始化副本
const openManager = () => {
    // 过滤掉前两个（假设你 logic 依然需要 slice(2)）
    // 注意：如果 slice(2) 是为了保护某些内置节点，后续保存需要把前两个拼回去
    editableNodes.value = nodes.value.slice().map(node => ({ ...node }));
    isModalOpen.value = true;
};

// 检查是否发生过修改
const checkChanges = () => {
    return JSON.stringify(nodes.value) !== JSON.stringify(editableNodes.value);
};

// 处理关闭逻辑 (Dialog 自带的 before-close)
const handleBeforeClose = (done: () => void) => {
    if (checkChanges()) {
        ElMessageBox.confirm(
            '检测到配置已修改，是否保存更改？',
            '提示',
            {
                confirmButtonText: '保存并退出',
                cancelButtonText: '放弃修改',
                distinguishCancelAndClose: true, // 区分取消按钮和右上角关闭
                type: 'warning',
            }
        )
            .then(async () => {
                // 用户点“保存并退出”
                await handleSaveAll();
                done();
            })
            .catch((action) => {
                if (action === 'cancel') {
                    // 用户点“放弃修改”
                    done();
                }
                // 如果是点击遮罩层或右上角且不想关闭，则什么都不做
            });
    } else {
        done();
    }
};

/// 保存逻辑
const handleSaveAll = async () => {
    // 先检查editableNodes是否与nodes相同，相同则不保存
    if (JSON.stringify(nodes.value) === JSON.stringify(editableNodes.value)) {
        ElMessage.info('配置未修改，无需保存');
        return;
    }
    // 将修改后的副本同步回 Store 或直接提交后端
    await store.updateNodes(editableNodes.value);
    isModalOpen.value = false;
    ElMessage.success('配置同步成功');
};

// 删除逻辑 (操作副本)
const handleDelete = (ip: string) => {
    editableNodes.value = editableNodes.value.filter(n => n.ip !== ip);
};

// 添加逻辑 (操作副本)
const handleAdd = () => {
    if (!form.hostname || !form.ip) {
        return ElMessage.error('请完整填写信息');
    }
    // 检查副本中是否已存在
    if (editableNodes.value.some(n => n.hostname === form.hostname)) {
        return ElMessage.error('主机名已存在');
    }
    if (editableNodes.value.some(n => n.ip === form.ip)) {
        return ElMessage.error('IP 地址已存在');
    }
    editableNodes.value.push({ ...form });
    form.hostname = '';
    form.ip = '';
};

</script>

<style scoped>
#sidebar {
    width: 260px;
    background: #ffffff;
    border-right: 1px solid #edf2f7;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.3s ease;
}

/* 头部 Header 优化 */
.sidebar-header {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}


.logo-box {
    width: 32px;
    height: 32px;
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-inner {
    width: 14px;
    height: 14px;
    border: 2.5px solid #fff;
    border-radius: 50%;
}

h2 {
    font-size: 19px;
    font-weight: 800;
    color: #1a202c;
    margin: 0;
    letter-spacing: -0.5px;
}

/* 滚动区域 */
.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;
}

/* 区块标签 */
.section-tag {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
}

.control-section,
.legend-section {
    padding: 10px 0;
}

/* 下拉框 Wrapper */
.select-wrapper {
    position: relative;
    margin-bottom: 12px;
}

select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #f1f5f9;
    border-radius: 12px;
    background: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    appearance: none;
    transition: all 0.2s;
    background-image: url("data:image/svg+xml,...");
    /* 保持原有的 SVG */
}

select:hover {
    border-color: #e2e8f0;
    background: #fff;
}

select:focus {
    border-color: #2563eb;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.control-btn {
    width: 100%;
    padding: 12px;
    background: #7088b0;
    /* 主色：高级中性灰 */
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.control-btn:hover {
    background: #829dcb;
    /* hover色：浅灰，过渡自然 */
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(110, 120, 134, 0.25);
}


.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 20px 0;
}

/* 图例卡片化设计 */
.legend-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.legend-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: all 0.2s;
}

.legend-card:hover {
    background: #fff;
    border-color: #e2e8f0;
    transform: translateX(4px);
}

.legend-marker {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

.legend-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

/* 页脚 */
.sidebar-footer {
    padding: 20px;
    font-size: 11px;
    color: #cbd5e1;
    text-align: center;
}

.legend-marker {
    font-size: 18px;
}

/* 让最后一个.legend-marker文字大小为28px */
/* .legend-card:last-child .legend-marker {
    font-size: 28px;
} */

/* 倒数第二个孩子 */
.legend-card:nth-last-child(2) .legend-marker {
    font-size: 28px;
}

/* 触发按钮样式 */
.manage-trigger-btn {
    margin-top: 10px;
    width: 100%;
    height: 36px;
    background: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.manage-trigger-btn:hover {
    color: #1890ff;
    border-color: #1890ff;
}

/* 弹窗遮罩 */
.modal-mask {
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 弹窗主体 */
.modal-container {
    width: 500px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.modal-header {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
}

.modal-body {
    padding: 24px;
    max-height: 400px;
    overflow-y: auto;
}

/* 列表表格 */
.node-row {
    display: grid;
    grid-template-columns: 1fr 1.5fr 60px;
    gap: 10px;
    margin-bottom: 12px;
}

.node-row input {
    padding: 6px 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
}

.disabled-input {
    background: #f5f5f5;
    color: #999;
}

.del-btn {
    color: #ff4d4f;
    background: none;
    border: none;
    cursor: pointer;
}

/* 新增区域 */
.add-zone {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px dashed #e8e8e8;
}

.add-inputs {
    display: grid;
    grid-template-columns: 1fr 1.5fr auto;
    gap: 10px;
}

.add-confirm-btn {
    background: #52c41a;
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}


/* 核心样式：控制表单项行内显示并设置宽度 */
.add-node-form :deep(.form-item-hostname) {
    width: 100px;
    /* 主机名项宽度 */
    display: inline-block;
    margin-right: 10px;
    /* 项之间的间距 */
}

.add-node-form :deep(.form-item-ip) {
    width: 250px;
    /* IP地址项宽度 */
    display: inline-block;
    margin-right: 10px;
}

.add-node-form :deep(.form-item-port) {
    width: 120px;
    /* Port项宽度 */
    display: inline-block;
    margin-right: 10px;
}

/* 可选：调整输入框宽度占满表单项 */
.add-node-form :deep(.el-input),
.add-node-form :deep(.el-input-number) {
    width: 100%;
}
</style>