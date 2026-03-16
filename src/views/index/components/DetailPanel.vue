<template>
    <div id="details">
        <header class="sidebar-header">
            <div class="header-icon">📊</div>
            <h3>组件详情</h3>
        </header>

        <Transition name="slide-fade" mode="out-in">
            <div v-if="info" class="detail-card" :key="info.id">
                <div class="card-banner" :class="info.type.toLowerCase()">
                    <span class="type-badge">{{ info.type }}</span>
                    <h4 class="node-title">{{ info.label }}</h4>
                </div>

                <div class="detail-list">
                    <div v-for="(value, key) in formattedProperties" :key="key" class="detail-item">
                        <div class="detail-row">
                            <span class="detail-label">
                                <i class="dot" :class="key"></i>
                                {{ renderLabel(key as string) }}
                            </span>
                            <span class="detail-value" :class="{ 'status-active': value === '🟢 激活' }">
                                {{ value }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="['HOST'].includes(info.type)" class="card-actions">
                    <button class="primary-action" @click="viewMonitor(info.id)">
                        <span>📈 查看节点详情</span>
                    </button>
                </div>
                <div v-if="fetchedData" class="json-viewer-container">
                    <div class="json-header">
                        <span class="json-title">📋 节点原始数据</span>
                        <button @click="fetchedData = null" class="close-link">清除结果</button>
                    </div>
                    <div class="json-scroll-area">
                        <pre class="json-content">{{ JSON.stringify(fetchedData, null, 2) }}</pre>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-box">
                    <div class="radar-scan"></div>
                    <p>等待选择组件...</p>
                    <span>在拓扑图中点击查看详细参数</span>
                </div>
            </div>


        </Transition>

    </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DetailInfo } from '../types/topology';

const props = defineProps<{
    info: DetailInfo | null;
}>();

// 新增：用于存储接口返回的原始 JSON 数据
const fetchedData = ref<any>(null);
const isLoading = ref(false);

// 属性名翻译字典
const labelMap: Record<string, string> = {
    memory: '内存容量',
    model: '型号',
    vram: '显存大小',
    bandwidth: '带宽',
    ip: 'IP 地址',
    status: '运行状态',
    pcie_gen: 'PCIe 版本',
    cores: '核心数',
    accelerators: '加速卡类型',
    role: '节点角色',
};

// 属性格式化逻辑
const formattedProperties = computed(() => {
    if (!props.info?.properties) return {};
    const entries = Object.entries(props.info.properties);

    return entries.reduce((acc, [key, val]) => {
        // 自动处理单位或布尔值
        let displayValue = val;
        if (key === 'status') displayValue = val === 'Active' ? '🟢 激活' : '🔴 异常';

        acc[key] = displayValue;
        return acc;
    }, {} as any);
});

const renderLabel = (key: string) => labelMap[key] || key;

// 修改后的查看详情函数
const viewMonitor = async (id: string) => {
    // 假设 ip 存储在 info.properties.ip 中
    console.log('查看详情的节点ID:', id);
    const ip = props.info?.properties?.ip;
    if (!ip) {
        console.error("未找到有效的 IP 地址");
        return;
    }

    isLoading.value = true;
    try {
        const response = await fetch(`http://localhost:3000/topology/info/node/detail?ip=${ip}`);
        if (!response.ok) throw new Error('网络响应异常');
        const json = await response.json();
        fetchedData.value = json; // 将获取的数据存入响应式变量
    } catch (error) {
        console.error("获取数据失败:", error);
        fetchedData.value = { error: "无法获取节点详情数据" };
    } finally {
        isLoading.value = false;
    }
    console.log('接口返回的原始数据:', fetchedData.value);
};
</script>

<style scoped>
#details {
    width: 320px;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    z-index: 10;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

.sidebar-header h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

/* 卡片容器 */
.detail-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    /* overflow: hidden; */
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

/* 卡片页眉横幅 */
.card-banner {
    padding: 16px;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
}

.card-banner.gpu {
    border-top: 4px solid #36A8A6;
}

.card-banner.cpu {
    border-top: 4px solid #28a745;
}

.card-banner.numa {
    border-top: 4px solid #2563eb;
}

.card-banner.host {
    border-top: 4px solid #6366f1;
}

.type-badge {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.05);
    color: #64748b;
}

.node-title {
    margin: 8px 0 0 0;
    font-size: 18px;
    color: #0f172a;
}

/* 列表条目 */
.detail-list {
    padding: 12px 16px;
}

.detail-item {
    padding: 12px 0;
    border-bottom: 1px solid #f8fafc;
}

.detail-item:last-child {
    border-bottom: none;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-label {
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 6px;
}

.detail-value {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    word-break: break-all;
    margin-left: 5px;
}

.status-active {
    color: #16a34a;
}

/* 按钮样式 */
.card-actions {
    padding: 16px;
    background: #f8fafc;
}

.primary-action {
    width: 100%;
    padding: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
}

.primary-action:hover {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

/* 空状态 */
.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-box {
    text-align: center;
    padding: 40px 20px;
    border: 2px dashed #e2e8f0;
    border-radius: 20px;
    width: 100%;
}

.empty-box p {
    margin: 12px 0 4px;
    font-weight: 600;
    color: #64748b;
}

.empty-box span {
    font-size: 12px;
    color: #94a3b8;
}

/* 动画 */
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.json-viewer-container {
    /* margin: 5px; */
    margin-top: 5px;
    padding: 12px;
    padding-bottom: 0;
    background: #f8fafc;
    /* 与卡片 Banner 一致的浅灰色 */
    border: 1px solid #e2e8f0;
    border-radius: 12px;
}

.json-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #e2e8f0;
}

.json-title {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
}

.close-link {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s;
}

.close-link:hover {
    color: #ef4444;
    text-decoration: underline;
}

/* 滚动区域：自定义滚动条样式 */
.json-scroll-area {
    max-height: 250px;
    overflow: auto;
    /* 针对 Chrome/Safari 的滚动条美化 */
}

.json-scroll-area::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.json-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}

.json-scroll-area::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.json-scroll-area::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* JSON 内容：调整代码高亮颜色为更柔和的深色系 */
.json-content {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #334155;
    /* 深灰文字 */
    white-space: pre-wrap;
    word-break: break-all;
}
</style>